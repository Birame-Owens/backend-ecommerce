<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Services\Client\PanierSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Reçoit le contenu du panier (navigateur) d'un client connecté et en garde
 * une copie côté serveur. Voir PanierSyncService.
 */
class CartSyncController extends Controller
{
    public function __invoke(Request $request, PanierSyncService $service): JsonResponse
    {
        $data = $request->validate([
            'items'              => ['present', 'array', 'max:' . PanierSyncService::MAX_ARTICLES],
            'items.*.produit_id' => ['required', 'integer', 'min:1'],
            'items.*.quantite'   => ['required', 'integer', 'min:1', 'max:100'],
            'items.*.taille'     => ['nullable', 'string', 'max:50'],
            'items.*.couleur'    => ['nullable', 'string', 'max:50'],
        ]);

        $resultat = $service->synchroniser($request->user(), $data['items']);

        return response()->json(['success' => true, 'data' => $resultat]);
    }
}
