<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\OffreCadeauRequest;
use App\Models\OffreCadeau;
use App\Models\Produit;
use App\Services\OffreCadeauService;
use Illuminate\Http\JsonResponse;

class OffreCadeauController extends Controller
{
    public function __construct(private OffreCadeauService $offreCadeauService)
    {
    }

    public function index(): JsonResponse
    {
        $offres = OffreCadeau::with(['produitDeclencheur', 'produitOffert'])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => ['offres' => $offres->map(fn ($o) => $this->format($o))],
        ]);
    }

    public function store(OffreCadeauRequest $request): JsonResponse
    {
        $offre = OffreCadeau::create($request->validated());
        $this->offreCadeauService->oublierCache();

        return response()->json([
            'success' => true,
            'message' => 'Offre cadeau créée',
            'data' => ['offre' => $this->format($offre->load(['produitDeclencheur', 'produitOffert']))],
        ], 201);
    }

    public function update(OffreCadeauRequest $request, OffreCadeau $offreCadeau): JsonResponse
    {
        $offreCadeau->update($request->validated());
        $this->offreCadeauService->oublierCache();

        return response()->json([
            'success' => true,
            'message' => 'Offre cadeau mise à jour',
            'data' => ['offre' => $this->format($offreCadeau->fresh(['produitDeclencheur', 'produitOffert']))],
        ]);
    }

    public function toggleStatus(OffreCadeau $offreCadeau): JsonResponse
    {
        $offreCadeau->update(['est_active' => !$offreCadeau->est_active]);
        $this->offreCadeauService->oublierCache();

        return response()->json([
            'success' => true,
            'message' => $offreCadeau->est_active ? 'Offre activée' : 'Offre désactivée',
            'data' => ['offre' => $this->format($offreCadeau->load(['produitDeclencheur', 'produitOffert']))],
        ]);
    }

    public function destroy(OffreCadeau $offreCadeau): JsonResponse
    {
        $offreCadeau->delete();
        $this->offreCadeauService->oublierCache();

        return response()->json(['success' => true, 'message' => 'Offre cadeau supprimée']);
    }

    private function format(OffreCadeau $offre): array
    {
        return [
            'id' => $offre->id,
            'produit_declencheur_id' => $offre->produit_declencheur_id,
            'produit_offert_id' => $offre->produit_offert_id,
            'quantite_declencheur' => $offre->quantite_declencheur,
            'quantite_offerte' => $offre->quantite_offerte,
            'couleur_offerte' => $offre->couleur_offerte,
            'taille_offerte' => $offre->taille_offerte,
            'est_active' => $offre->est_active,
            'date_debut' => $offre->date_debut?->format('Y-m-d'),
            'date_fin' => $offre->date_fin?->format('Y-m-d'),
            'disponible' => $offre->estDisponible(),
            'raison_indisponibilite' => $offre->raisonIndisponibilite(),
            'stock_cadeau' => $offre->stockCadeauDisponible(),
            'declencheur' => $this->formatProduit($offre->produitDeclencheur),
            'cadeau' => $this->formatProduit($offre->produitOffert),
        ];
    }

    private function formatProduit(?Produit $produit): ?array
    {
        if (!$produit) {
            return null;
        }

        return [
            'id' => $produit->id,
            'nom' => $produit->nom,
            'prix' => (float) $produit->prix,
            'image' => $produit->image,
            'est_visible' => (bool) $produit->est_visible,
        ];
    }
}
