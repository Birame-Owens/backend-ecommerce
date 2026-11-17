<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Services\Client\EvenementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Validator;

/**
 * Endpoint générique pour les événements qui n'ont pas de point d'ancrage
 * naturel côté serveur (actions purement client, ex: ajout/retrait panier
 * géré par le store Zustand, temps passé sur une fiche, recommandations vues).
 * Same-origin (api.nd-world.site), donc jamais bloqué par un bloqueur de pub
 * contrairement à un traceur tiers.
 */
class EvenementController extends Controller
{
    /** Types autorisés depuis le client — le reste est journalisé côté serveur uniquement. */
    public const TYPES_AUTORISES = [
        'debut_session',
        // Vues journalisées par le navigateur : les pages catalogue sont mises
        // en cache côté serveur, qui ne voit donc pas chaque visite.
        'vue_produit',
        'vue_categorie',
        'ajout_panier',
        'retrait_panier',
        'modification_quantite',
        'vidage_panier',
        'vue_panier',
        'ajout_wishlist',
        'retrait_wishlist',
        'debut_checkout',
        // Choix d'une couleur / taille (intérêt fin pour une variante précise).
        'changement_variante',
        // Partage d'une fiche (WhatsApp, Facebook, lien copié…).
        'partage_produit',
        'clic_whatsapp',
        // Recherche VALIDÉE uniquement (terme final), journalisée depuis la
        // page /recherche — pas la recherche instantanée frappe par frappe.
        'recherche',
        'filtre_catalogue',
        // Temps réellement passé sur une fiche (onglet visible) + défilement.
        'temps_vue_produit',
        // Recommandations affichées à l'écran et clics sur ces recommandations.
        'reco_affichee',
        'clic_reco',
    ];

    /** Taille maximale d'un paquet envoyé par le navigateur. */
    public const MAX_PAR_PAQUET = 50;

    public function __construct(private EvenementService $evenements)
    {
    }

    /** Ancien envoi unitaire (onglets encore ouverts sur une version précédente du site). */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type'            => 'required|string|in:' . implode(',', self::TYPES_AUTORISES),
            'produit_id'      => 'nullable|integer|exists:produits,id',
            'categorie_id'    => 'nullable|integer|exists:categories,id',
            'terme_recherche' => 'nullable|string|max:255',
            'metadata'        => 'nullable|array',
        ]);

        $this->evenements->log($validated['type'], [
            'produit_id'      => $validated['produit_id'] ?? null,
            'categorie_id'    => $validated['categorie_id'] ?? null,
            'terme_recherche' => isset($validated['terme_recherche']) ? trim($validated['terme_recherche']) : null,
            'metadata'        => $validated['metadata'] ?? null,
        ]);

        // Toujours 204 : un échec de journalisation ne doit jamais remonter
        // au client ni interrompre son parcours d'achat.
        return response()->json(null, 204);
    }

    /**
     * Paquet d'événements : un seul appel HTTP et une seule écriture en base.
     * Accepte aussi un corps JSON envoyé en text/plain par navigator.sendBeacon
     * à la fermeture de la page (type « simple » : pas de requête CORS préalable).
     * Les événements invalides sont ignorés individuellement.
     */
    public function batch(Request $request): Response
    {
        $corps = $request->isJson() ? $request->json()->all() : json_decode($request->getContent(), true);
        $events = is_array($corps) && is_array($corps['events'] ?? null) ? $corps['events'] : [];

        $valides = [];
        foreach (array_slice($events, 0, self::MAX_PAR_PAQUET) as $event) {
            if (!is_array($event)) {
                continue;
            }
            $validator = Validator::make($event, [
                'type'            => 'required|string|in:' . implode(',', self::TYPES_AUTORISES),
                'produit_id'      => 'nullable|integer|min:1',
                'categorie_id'    => 'nullable|integer|min:1',
                'terme_recherche' => 'nullable|string|max:255',
                'metadata'        => 'nullable|array',
            ]);
            if ($validator->passes()) {
                $valides[] = $validator->validated();
            }
        }

        $this->evenements->logBatch($valides);

        return response()->noContent();
    }
}
