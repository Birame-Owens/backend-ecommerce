<?php

namespace App\Console\Commands;

use App\Models\Commande;
use App\Services\Client\CheckoutService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class ReleaseExpiredOrderStock extends Command
{
    /**
     * Le stock est réservé (décrémenté) dès la création d'une commande pour
     * empêcher la survente. Cette commande libère ce stock quand la commande
     * reste "en_attente" (jamais payée) au-delà du délai — sans l'annuler :
     * elle reste consultable et le lien de relance email (payments:retry-failed)
     * continue de fonctionner ; initiatePayment re-réserve le stock si le
     * client revient payer plus tard.
     */
    protected $signature = 'commandes:liberer-stock-expire {--minutes=15 : Délai sans paiement avant libération}';

    protected $description = 'Libère le stock réservé des commandes en attente de paiement depuis trop longtemps';

    public function handle(CheckoutService $checkoutService): int
    {
        $minutes = (int) $this->option('minutes');
        $seuil = now()->subMinutes($minutes);

        $commandeIds = Commande::where('statut', 'en_attente')
            ->whereNotNull('stock_decremented_at')
            ->where('stock_decremented_at', '<', $seuil)
            ->pluck('id');

        if ($commandeIds->isEmpty()) {
            $this->info('Aucune commande à libérer.');
            return Command::SUCCESS;
        }

        $liberees = 0;

        foreach ($commandeIds as $commandeId) {
            DB::beginTransaction();

            try {
                // Re-verrouille et revérifie sous transaction : si un paiement a
                // été confirmé entre-temps, on ne touche à rien.
                $commande = Commande::where('id', $commandeId)->lockForUpdate()->first();

                if (
                    !$commande
                    || $commande->statut !== 'en_attente'
                    || !$commande->stock_decremented_at
                    || $commande->stock_decremented_at >= $seuil
                ) {
                    DB::rollBack();
                    continue;
                }

                $commande->loadMissing('articles_commandes.produit');

                foreach ($commande->articles_commandes as $article) {
                    $produit = $article->produit;
                    if ($produit && $produit->gestion_stock) {
                        $checkoutService->restoreProductStock(
                            $produit,
                            $article->quantite,
                            $article->couleur_choisie,
                            $article->taille_choisie
                        );
                    }
                }

                $commande->update(['stock_decremented_at' => null]);

                DB::commit();
                $liberees++;
            } catch (Throwable $e) {
                DB::rollBack();
                Log::error('Erreur libération stock expiré', [
                    'commande_id' => $commandeId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info("{$liberees} commande(s) libérée(s).");

        return Command::SUCCESS;
    }
}
