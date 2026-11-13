<?php

namespace App\Services\Admin;

use App\Mail\RelancePanierMail;
use App\Models\Client;
use App\Models\Commande;
use App\Models\Panier;
use App\Models\RelancePanier;
use App\Models\ShopSetting;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Relances e-mail des paniers abandonnés.
 *
 * Ne concerne que les clients CONNECTÉS : leur panier est stocké côté serveur sous
 * l'identifiant « user_{id} » (CartService), il est donc le même sur tous leurs
 * appareils et l'e-mail peut renvoyer vers un panier réellement retrouvable.
 *
 * Tourne en arrière-plan (commande paniers:relancer, toutes les heures) : rien
 * n'est exécuté pendant la navigation des clients. Les e-mails partent par la
 * file « default », moins prioritaire que la file « emails » des confirmations
 * de commande, et le nombre d'envois par exécution est plafonné pour ne pas
 * dépasser le quota SMTP de l'hébergeur.
 */
class RelancePanierService
{
    /** Délai d'inactivité (heures) avant chaque étape de relance. */
    public const DELAIS = [1 => 2, 2 => 24];

    /** Au-delà, un panier est trop ancien pour être relancé. */
    public const AGE_MAX_JOURS = 7;

    /** Plafond d'e-mails par exécution (quota SMTP de l'hébergeur). */
    public const MAX_PAR_EXECUTION = 50;

    public function estActive(): bool
    {
        return ShopSetting::getValue('notif_relance_panier', '0') === '1';
    }

    /**
     * @return array{active: bool, envoyees: array<int,int>, recuperees: int}
     */
    public function executer(): array
    {
        $resultat = ['active' => $this->estActive(), 'envoyees' => [1 => 0, 2 => 0], 'recuperees' => 0];

        // Le suivi des paniers récupérés tourne même si les envois sont coupés.
        $resultat['recuperees'] = $this->marquerRecuperations();

        if (!$resultat['active']) {
            return $resultat;
        }

        $budget = self::MAX_PAR_EXECUTION;
        // Étape 2 d'abord : ce sont les paniers les plus anciens, donc les plus près d'être perdus.
        foreach ([2, 1] as $etape) {
            $envoyees = $this->relancerEtape($etape, $budget);
            $resultat['envoyees'][$etape] = $envoyees;
            $budget -= $envoyees;
            if ($budget <= 0) {
                break;
            }
        }

        return $resultat;
    }

    private function relancerEtape(int $etape, int $budget): int
    {
        $limite = now()->subHours(self::DELAIS[$etape]);
        $plusAncien = now()->subDays(self::AGE_MAX_JOURS);
        $envoyees = 0;

        $paniers = Panier::query()
            ->where('session_id', 'like', 'user\_%')
            ->where('statut', 'actif')
            ->whereNull('commande_id')
            ->whereBetween('derniere_activite', [$plusAncien, $limite])
            ->whereHas('articles_paniers')
            // pas déjà relancé à cette étape pour cet épisode du panier
            ->whereNotExists(fn ($q) => $q->selectRaw('1')->from('relances_panier as r')
                ->whereColumn('r.panier_id', 'paniers.id')
                ->whereColumn('r.activite_panier', 'paniers.derniere_activite')
                ->where('r.etape', $etape))
            // l'étape 2 n'est envoyée qu'après l'étape 1 du même épisode
            ->when($etape === 2, fn ($q) => $q->whereExists(fn ($s) => $s->selectRaw('1')->from('relances_panier as r1')
                ->whereColumn('r1.panier_id', 'paniers.id')
                ->whereColumn('r1.activite_panier', 'paniers.derniere_activite')
                ->where('r1.etape', 1)))
            ->orderBy('derniere_activite')
            ->with(['articles_paniers.produit'])
            ->limit($budget * 3) // marge : certains paniers seront écartés (consentement, commande)
            ->get();

        foreach ($paniers as $panier) {
            if ($envoyees >= $budget) {
                break;
            }
            $client = $this->clientEligible($panier);
            if (!$client) {
                continue;
            }

            $articles = $panier->articles_paniers->filter(fn ($a) => $a->produit !== null)->values();
            if ($articles->isEmpty()) {
                continue;
            }

            try {
                RelancePanier::create([
                    'panier_id'       => $panier->id,
                    'client_id'       => $client->id,
                    'etape'           => $etape,
                    'activite_panier' => $panier->derniere_activite,
                    'nombre_articles' => (int) $articles->sum('quantite'),
                    'montant_panier'  => (float) $articles->sum('prix_total'),
                    'envoye_at'       => now(),
                ]);

                Mail::to($client->email)->queue(
                    (new RelancePanierMail($client, $articles, $etape))->onQueue('default')
                );
                $envoyees++;
            } catch (\Throwable $e) {
                Log::warning('Relance panier non envoyée', ['panier_id' => $panier->id, 'error' => $e->getMessage()]);
            }
        }

        return $envoyees;
    }

    /** Client connecté, joignable par e-mail, consentant, et sans commande depuis l'abandon. */
    private function clientEligible(Panier $panier): ?Client
    {
        $userId = (int) substr($panier->session_id, strlen('user_'));
        if ($userId <= 0) {
            return null;
        }

        $client = Client::where('user_id', $userId)->first();
        if (!$client || !$client->email || !$client->accepte_email || !$client->accepte_promotions) {
            return null;
        }

        $aCommande = Commande::where('client_id', $client->id)
            ->where('created_at', '>=', $panier->derniere_activite)
            ->exists();

        return $aCommande ? null : $client;
    }

    /** Une relance est « récupérée » si le client passe commande dans les 7 jours qui suivent. */
    private function marquerRecuperations(): int
    {
        $marquees = 0;

        RelancePanier::whereNull('recupere_at')
            ->where('envoye_at', '>=', now()->subDays(self::AGE_MAX_JOURS + 7))
            ->orderBy('id')
            ->chunkById(200, function ($relances) use (&$marquees) {
                foreach ($relances as $relance) {
                    $commande = Commande::where('client_id', $relance->client_id)
                        ->whereBetween('created_at', [$relance->envoye_at, $relance->envoye_at->copy()->addDays(7)])
                        ->orderBy('created_at')
                        ->first();
                    if ($commande) {
                        $relance->update([
                            'recupere_at'      => $commande->created_at,
                            'commande_id'      => $commande->id,
                            'montant_recupere' => (float) $commande->montant_total,
                        ]);
                        $marquees++;
                    }
                }
            });

        return $marquees;
    }

    /** Statistiques pour le tableau de bord « Comportement ». */
    public function statistiques(Carbon $debut, Carbon $fin): array
    {
        $relances = RelancePanier::whereBetween('envoye_at', [$debut, $fin]);

        $envoyees = (clone $relances)->count();
        // Un panier relancé deux fois (étapes 1 et 2) ne compte qu'une fois comme récupéré.
        $recuperes = (clone $relances)->whereNotNull('commande_id')->distinct('commande_id')->count('commande_id');
        $ca = (float) RelancePanier::whereIn('id', (clone $relances)->whereNotNull('commande_id')
                ->selectRaw('MIN(id)')->groupBy('commande_id'))
            ->sum('montant_recupere');

        $dernieres = (clone $relances)->with('client:id,prenom,nom')
            ->orderByDesc('envoye_at')->limit(10)->get()
            ->map(fn (RelancePanier $r) => [
                'client'          => trim(($r->client->prenom ?? '') . ' ' . ($r->client->nom ?? '')),
                'etape'           => $r->etape,
                'nombre_articles' => $r->nombre_articles,
                'montant_panier'  => $r->montant_panier,
                'envoye_at'       => $r->envoye_at->toIso8601String(),
                'recupere'        => $r->commande_id !== null,
            ])->all();

        return [
            'active'          => $this->estActive(),
            'envoyees'        => $envoyees,
            'paniers_recuperes' => $recuperes,
            'ca_recupere'     => $ca,
            'dernieres'       => $dernieres,
        ];
    }
}
