<?php

namespace App\Services\Client;

use App\Models\ArticlesPanier;
use App\Models\Panier;
use App\Models\Produit;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Copie côté serveur du panier d'un client connecté.
 *
 * Le panier de référence reste celui du navigateur (front, localStorage) :
 * cette copie sert uniquement à savoir ce qu'un client connecté a laissé
 * dans son panier (relance e-mail des paniers abandonnés, statistiques).
 *
 * Seuls l'identifiant produit, la quantité, la taille et la couleur viennent
 * du navigateur : les prix sont recalculés depuis la fiche produit et les
 * produits masqués ou supprimés sont ignorés.
 */
class PanierSyncService
{
    public const MAX_ARTICLES = 50;

    /**
     * @param  array<int, array{produit_id:int, quantite:int, taille?:?string, couleur?:?string}>  $items
     * @return array{nombre_articles:int, sous_total:float, modifie:bool}
     */
    public function synchroniser(User $user, array $items): array
    {
        $lignes = $this->normaliser($items);
        $identifiant = 'user_' . $user->id;

        return DB::transaction(function () use ($identifiant, $lignes) {
            $panier = Panier::where('session_id', $identifiant)->lockForUpdate()->first();

            // Contenu identique (rechargement de page, autre onglet) : on ne touche
            // pas à derniere_activite, sinon le délai de relance repartirait à zéro.
            if ($panier && $this->signature($this->lignesActuelles($panier)) === $this->signature($lignes)) {
                return $this->resume($panier, false);
            }

            if (!$panier) {
                if ($lignes === []) {
                    return ['nombre_articles' => 0, 'sous_total' => 0.0, 'modifie' => false];
                }
                $panier = Panier::create([
                    'identifiant'      => $identifiant,
                    'session_id'       => $identifiant,
                    'client_id'        => null,
                    'sous_total'       => 0,
                    'nombre_articles'  => 0,
                    'statut'           => 'actif',
                    'derniere_activite'=> now(),
                ]);
            }

            ArticlesPanier::where('panier_id', $panier->id)->delete();

            $sousTotal = 0.0;
            $nombre = 0;
            foreach ($lignes as $ligne) {
                $prix = (float) $ligne['prix'];
                ArticlesPanier::create([
                    'panier_id'            => $panier->id,
                    'produit_id'           => $ligne['produit_id'],
                    'quantite'             => $ligne['quantite'],
                    'taille_choisie'       => $ligne['taille'],
                    'couleur_choisie'      => $ligne['couleur'],
                    'prix_unitaire'        => $prix,
                    'prix_total'           => $prix * $ligne['quantite'],
                    'date_ajout'           => now(),
                    'nombre_modifications' => 0,
                    'est_reserve'          => false,
                ]);
                $sousTotal += $prix * $ligne['quantite'];
                $nombre += $ligne['quantite'];
            }

            $panier->update([
                'sous_total'        => $sousTotal,
                'nombre_articles'   => $nombre,
                'statut'            => 'actif',
                'commande_id'       => null,
                'derniere_activite' => now(),
            ]);

            return $this->resume($panier, true);
        });
    }

    /**
     * Fusionne les doublons (même produit/taille/couleur), écarte les produits
     * invisibles et fixe le prix depuis la base.
     *
     * @return array<int, array{produit_id:int, quantite:int, taille:?string, couleur:?string, prix:float}>
     */
    private function normaliser(array $items): array
    {
        $fusion = [];
        foreach (array_slice($items, 0, self::MAX_ARTICLES) as $item) {
            $taille = isset($item['taille']) && $item['taille'] !== '' ? (string) $item['taille'] : null;
            $couleur = isset($item['couleur']) && $item['couleur'] !== '' ? (string) $item['couleur'] : null;
            $cle = $item['produit_id'] . '|' . $taille . '|' . $couleur;

            $fusion[$cle] ??= [
                'produit_id' => (int) $item['produit_id'],
                'quantite'   => 0,
                'taille'     => $taille,
                'couleur'    => $couleur,
            ];
            $fusion[$cle]['quantite'] = min(100, $fusion[$cle]['quantite'] + (int) $item['quantite']);
        }

        if ($fusion === []) {
            return [];
        }

        $produits = Produit::whereIn('id', array_unique(array_column($fusion, 'produit_id')))
            ->where('est_visible', true)
            ->get(['id', 'prix', 'prix_promo'])
            ->keyBy('id');

        $lignes = [];
        foreach ($fusion as $ligne) {
            $produit = $produits->get($ligne['produit_id']);
            if (!$produit) {
                continue;
            }
            $ligne['prix'] = (float) ($produit->prix_promo ?: $produit->prix);
            $lignes[] = $ligne;
        }

        return $lignes;
    }

    private function lignesActuelles(Panier $panier): array
    {
        return $panier->articles_paniers()
            ->get(['produit_id', 'quantite', 'taille_choisie', 'couleur_choisie', 'prix_unitaire'])
            ->map(fn ($a) => [
                'produit_id' => (int) $a->produit_id,
                'quantite'   => (int) $a->quantite,
                'taille'     => $a->taille_choisie,
                'couleur'    => $a->couleur_choisie,
                'prix'       => (float) $a->prix_unitaire,
            ])->all();
    }

    private function signature(array $lignes): string
    {
        $cles = array_map(
            fn ($l) => implode('|', [$l['produit_id'], $l['taille'], $l['couleur'], $l['quantite'], round($l['prix'], 2)]),
            $lignes
        );
        sort($cles);

        return implode(';', $cles);
    }

    private function resume(Panier $panier, bool $modifie): array
    {
        return [
            'nombre_articles' => (int) $panier->nombre_articles,
            'sous_total'      => (float) $panier->sous_total,
            'modifie'         => $modifie,
        ];
    }
}
