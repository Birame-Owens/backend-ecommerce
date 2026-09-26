<?php

namespace App\Services;

use App\Models\OffreCadeau;
use App\Models\Produit;
use Illuminate\Support\Facades\Cache;

/**
 * Offres « produit acheté → cadeau offert ».
 *
 * L'affichage (badge, bloc « Votre cadeau », panier) s'appuie sur la liste
 * publique mise en cache ; le checkout, lui, recalcule toujours les cadeaux
 * depuis la base : c'est la seule source qui fait foi.
 */
class OffreCadeauService
{
    public const CACHE_KEY = 'offres_cadeaux:publiques';
    private const CACHE_TTL = 60; // secondes — le stock du cadeau évolue

    /** Offres visibles côté boutique (actives, en cours, cadeau en stock). */
    public function offresPubliques(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return OffreCadeau::enCours()
                ->with([
                    'produitDeclencheur:id,est_visible',
                    'produitOffert.images_produits' => fn ($q) => $q->where('est_visible', true)->orderBy('ordre_affichage'),
                ])
                ->get()
                ->filter(fn (OffreCadeau $offre) => $offre->estDisponible())
                ->map(fn (OffreCadeau $offre) => $this->formatPublic($offre))
                ->values()
                ->all();
        });
    }

    public function oublierCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Cadeaux dus pour des articles validés au checkout.
     *
     * @param  array<int, array{produit: Produit, quantity: int}>  $items
     * @return array<int, array{offre: OffreCadeau, produit: Produit, quantity: int}>
     */
    public function calculerCadeaux(array $items): array
    {
        // Les variantes d'un même produit (tailles, couleurs) comptent ensemble.
        $quantitesParProduit = [];
        foreach ($items as $item) {
            $id = $item['produit']->id;
            $quantitesParProduit[$id] = ($quantitesParProduit[$id] ?? 0) + (int) $item['quantity'];
        }

        if (!$quantitesParProduit) {
            return [];
        }

        $offres = OffreCadeau::enCours()
            ->whereIn('produit_declencheur_id', array_keys($quantitesParProduit))
            ->with(['produitDeclencheur', 'produitOffert'])
            ->get();

        $cadeaux = [];
        foreach ($offres as $offre) {
            if (!$offre->estDisponible()) {
                continue;
            }

            $quantite = $offre->cadeauxPour($quantitesParProduit[$offre->produit_declencheur_id]);

            // Stock partiel : on offre ce qui reste plutôt que rien.
            $stock = $offre->stockCadeauDisponible();
            if ($stock !== null) {
                $quantite = min($quantite, $stock);
            }

            if ($quantite > 0) {
                $cadeaux[] = [
                    'offre' => $offre,
                    'produit' => $offre->produitOffert,
                    'quantity' => $quantite,
                ];
            }
        }

        return $cadeaux;
    }

    public function formatPublic(OffreCadeau $offre): array
    {
        $cadeau = $offre->produitOffert;

        return [
            'id' => $offre->id,
            'produit_declencheur_id' => $offre->produit_declencheur_id,
            'quantite_declencheur' => $offre->quantite_declencheur,
            'quantite_offerte' => $offre->quantite_offerte,
            'couleur' => $offre->couleur_offerte,
            'taille' => $offre->taille_offerte,
            'cadeau' => [
                'id' => $cadeau->id,
                'nom' => $cadeau->nom,
                // Pas de lien vers une fiche masquée (produit réservé aux cadeaux).
                'slug' => $cadeau->est_visible ? $cadeau->slug : null,
                'image' => $cadeau->image,
                'valeur' => (float) $cadeau->prix,
                'type_variante' => $cadeau->type_variante,
            ],
        ];
    }
}
