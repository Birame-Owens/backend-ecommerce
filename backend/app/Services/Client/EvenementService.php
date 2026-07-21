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
        // Identifiant visiteur transmis via le cookie ndeya_sid (posé par le
        // front). Lu depuis l'en-tête Cookie brut pour être robuste quel que
        // soit le middleware de la route (le chiffrement de cookies Laravel
        // ne s'applique pas à ce cookie posé côté JS). Fallback sur l'ancien
        // en-tête X-Session-Id (clients encore en cache), puis session, puis IP.
        $cookieHeader = (string) request()->header('Cookie', '');
        if ($cookieHeader !== '' && preg_match('/(?:^|;\s*)ndeya_sid=([^;]+)/', $cookieHeader, $m)) {
            return substr(rawurldecode($m[1]), 0, 100);
        }

        $legacyHeader = request()->header('X-Session-Id');
        if ($legacyHeader) {
            return (string) $legacyHeader;
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
