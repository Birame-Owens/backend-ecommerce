<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Services\Client\EvenementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Endpoint générique pour les événements qui n'ont pas de point d'ancrage
 * naturel côté serveur (actions purement client, ex: ajout/retrait panier
 * géré par le store Zustand, arrivée sur l'étape de paiement). Same-origin
 * (api.nd-world.site), donc jamais bloqué par un bloqueur de pub contrairement
 * à un traceur tiers.
 */
class EvenementController extends Controller
{
    /** Types autorisés depuis le client — le reste est journalisé côté serveur uniquement. */
    private const TYPES_AUTORISES = [
        'ajout_panier',
        'retrait_panier',
        'modification_quantite',
        'vue_panier',
        'ajout_wishlist',
        'retrait_wishlist',
        'debut_checkout',
        'changement_variante',
        'partage_produit',
        'clic_whatsapp',
    ];

    public function __construct(private EvenementService $evenements)
    {
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type'         => 'required|string|in:' . implode(',', self::TYPES_AUTORISES),
            'produit_id'   => 'nullable|integer|exists:produits,id',
            'categorie_id' => 'nullable|integer|exists:categories,id',
            'metadata'     => 'nullable|array',
        ]);

        $this->evenements->log($validated['type'], [
            'produit_id'   => $validated['produit_id'] ?? null,
            'categorie_id' => $validated['categorie_id'] ?? null,
            'metadata'     => $validated['metadata'] ?? null,
        ]);

        // Toujours 204 : un échec de journalisation ne doit jamais remonter
        // au client ni interrompre son parcours d'achat.
        return response()->json(null, 204);
    }
}
