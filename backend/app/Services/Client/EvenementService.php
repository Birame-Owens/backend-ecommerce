<?php

namespace App\Services\Client;

use App\Models\Category;
use App\Models\Evenement;
use App\Models\Produit;
use Illuminate\Support\Facades\Log;

/**
 * Journalisation des événements comportementaux (business intelligence
 * interne, détection d'anomalies, recommandation).
 *
 * Ne doit jamais faire échouer l'action métier en cours : toute erreur est
 * avalée et journalisée en warning, jamais relancée.
 */
class EvenementService
{
    /** Taille maximale des métadonnées d'un événement (JSON encodé). */
    private const METADATA_MAX_OCTETS = 2048;

    public function log(string $type, array $attributes = []): void
    {
        try {
            Evenement::create(array_merge($this->contexte(), [
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

    /**
     * Enregistre un paquet d'événements envoyés par le navigateur en UNE seule
     * requête SQL (au lieu d'une par événement). Les identifiants de produit
     * et de catégorie inconnus sont mis à null plutôt que de rejeter le paquet.
     *
     * Horodatage : chaque événement est daté au moment du CLIC, pas à la
     * réception du paquet. Le navigateur fournit l'heure du clic (`t`) et
     * l'heure d'envoi (`$envoyeA`), toutes deux selon SON horloge ; seul leur
     * écart est utilisé (heure serveur − écart). Une horloge de téléphone
     * fausse n'a donc aucun effet.
     *
     * @param  array<int, array{type:string, produit_id?:?int, categorie_id?:?int, terme_recherche?:?string, metadata?:?array, t?:?int}>  $events
     */
    public function logBatch(array $events, ?int $envoyeA = null): int
    {
        if ($events === []) {
            return 0;
        }

        try {
            $produits = $this->idsExistants(Produit::class, array_column($events, 'produit_id'));
            $categories = $this->idsExistants(Category::class, array_column($events, 'categorie_id'));
            $contexte = $this->contexte();
            $maintenant = now();

            $lignes = array_map(function (array $e) use ($produits, $categories, $contexte, $maintenant, $envoyeA) {
                $produitId = isset($e['produit_id']) ? (int) $e['produit_id'] : null;
                $categorieId = isset($e['categorie_id']) ? (int) $e['categorie_id'] : null;

                return $contexte + [
                    'type'            => $e['type'],
                    'produit_id'      => $produitId && isset($produits[$produitId]) ? $produitId : null,
                    'categorie_id'    => $categorieId && isset($categories[$categorieId]) ? $categorieId : null,
                    'commande_id'     => null,
                    'terme_recherche' => isset($e['terme_recherche']) ? mb_substr(trim((string) $e['terme_recherche']), 0, 255) : null,
                    'metadata'        => $this->metadata($e['metadata'] ?? null),
                    // Chaîne à la milliseconde : une date Carbon serait arrondie à la seconde par le pilote SQL.
                    'created_at'      => $maintenant->copy()
                        ->subMilliseconds(self::ageMs($e['t'] ?? null, $envoyeA))
                        ->format('Y-m-d H:i:s.v'),
                ];
            }, $events);

            Evenement::insert($lignes);

            return count($lignes);
        } catch (\Throwable $e) {
            Log::warning('Paquet d\'événements non journalisé', [
                'nombre' => count($events),
                'error'  => $e->getMessage(),
            ]);

            return 0;
        }
    }

    /** Écart maximal accepté entre le clic et l'envoi (au-delà : valeur suspecte, plafonnée). */
    private const AGE_MAX_MS = 24 * 60 * 60 * 1000;

    /**
     * Ancienneté d'un événement au moment de l'envoi, en ms (0 si inconnue,
     * plafonnée à 24 h ; jamais négative même avec des valeurs incohérentes).
     */
    public static function ageMs(mixed $t, ?int $envoyeA): int
    {
        if ($envoyeA === null || !is_numeric($t)) {
            return 0;
        }

        return (int) max(0, min(self::AGE_MAX_MS, $envoyeA - (int) $t));
    }

    /** Colonnes communes à tous les événements de la requête en cours. */
    private function contexte(): array
    {
        $agent = (string) request()->userAgent();

        return [
            'session_id' => $this->sessionId(),
            'empreinte'  => $this->empreinte($agent),
            'appareil'   => self::appareil($agent),
            'client_id'  => $this->clientId(),
        ];
    }

    /**
     * Hachage non réversible (HMAC avec la clé de l'application) du préfixe IP
     * (/24 en IPv4, /48 en IPv6) et du navigateur : relie les sessions d'un même
     * appareil sans jamais stocker l'adresse IP.
     */
    private function empreinte(string $agent): string
    {
        $ip = (string) (request()->header('CF-Connecting-IP') ?: request()->ip());

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $prefixe = implode('.', array_slice(explode('.', $ip), 0, 3));
        } elseif (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            $prefixe = implode(':', array_slice(explode(':', $ip), 0, 3));
        } else {
            $prefixe = '';
        }

        return substr(hash_hmac('sha256', $prefixe . '|' . $agent, (string) config('app.key')), 0, 32);
    }

    public static function appareil(string $agent): string
    {
        $a = strtolower($agent);

        return match (true) {
            $a === '' => 'inconnu',
            (bool) preg_match('/bot|crawl|spider|slurp|headless|phantom|python|curl|wget|httpclient|facebookexternalhit|lighthouse/', $a) => 'robot',
            (bool) preg_match('/ipad|tablet|kindle|silk|(android(?!.*mobile))/', $a) => 'tablette',
            (bool) preg_match('/mobi|iphone|ipod|android|opera mini|iemobile/', $a) => 'mobile',
            default => 'ordinateur',
        };
    }

    private function metadata(mixed $metadata): ?string
    {
        if (!is_array($metadata) || $metadata === []) {
            return null;
        }

        $json = json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR);

        return ($json !== false && strlen($json) <= self::METADATA_MAX_OCTETS) ? $json : null;
    }

    /** @return array<int, true> */
    private function idsExistants(string $modele, array $ids): array
    {
        $ids = array_values(array_unique(array_filter(array_map('intval', array_filter($ids)))));
        if ($ids === []) {
            return [];
        }

        return array_fill_keys($modele::whereIn('id', $ids)->pluck('id')->all(), true);
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
