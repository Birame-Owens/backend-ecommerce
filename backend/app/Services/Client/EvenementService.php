<?php

namespace App\Services\Client;

use App\Models\Evenement;
use Illuminate\Support\Facades\Log;

/**
 * Journalisation des événements comportementaux (business intelligence
 * interne, fiable — voir Evenement/migration pour le contexte).
 *
 * Ne doit jamais faire échouer l'action métier en cours : toute erreur est
 * avalée et journalisée en warning, jamais relancée.
 */
class EvenementService
{
    public function log(string $type, array $attributes = []): void
    {
        try {
            Evenement::create(array_merge([
                'session_id' => $this->sessionId(),
                'client_id'  => $this->clientId(),
                'type'       => $type,
                'created_at' => now(),
            ], $attributes));
        } catch (\Throwable $e) {
            Log::warning('Evenement non journalisé', [
                'type'  => $type,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function sessionId(): string
    {
        // Les routes catalogue (produits/catégories/recherche) tournent
        // volontairement SANS session Laravel pour rester cacheables côté
        // nginx (voir [[scaling_cache_architecture]]) — donc pas de cookie
        // de session fiable là où la plupart de ces événements se déclenchent.
        // Le front envoie un identifiant généré une fois et stocké en
        // localStorage (X-Session-Id) : stable pour un même visiteur, quelle
        // que soit la route. Fallback sur la session Laravel puis l'IP.
        $header = request()->header('X-Session-Id');
        if ($header) {
            return (string) $header;
        }

        if (request()->hasSession()) {
            return request()->session()->getId();
        }

        return (string) request()->ip();
    }

    private function clientId(): ?int
    {
        $user = auth('sanctum')->user() ?? auth()->user();

        return $user?->client?->id;
    }
}
