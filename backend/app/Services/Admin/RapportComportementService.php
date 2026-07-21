<?php

namespace App\Services\Admin;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Business intelligence à partir de la table `evenements` (données
 * first-party, fiables — voir App\Services\Client\EvenementService).
 *
 * Objectif : répondre concrètement à « pourquoi ça ne vend pas » —
 * entonnoir de conversion, produits vus mais pas achetés, abandons de
 * panier/paiement, recherches et catégories les plus demandées.
 */
class RapportComportementService
{
    public function getReport(Carbon $debut, Carbon $fin): array
    {
        return [
            'resume'                  => $this->resume($debut, $fin),
            'entonnoir'               => $this->entonnoir($debut, $fin),
            'produits_performance'    => $this->produitsPerformance($debut, $fin),
            'recherches_frequentes'   => $this->recherchesFrequentes($debut, $fin),
            'recherches_sans_clic'    => $this->recherchesSansClic($debut, $fin),
            'top_categories'          => $this->topCategories($debut, $fin),
            'echecs_paiement'         => $this->echecsPaiement($debut, $fin),
        ];
    }

    /** Compte les événements d'un type sur la période. */
    private function compter(string $type, Carbon $debut, Carbon $fin): int
    {
        return (int) DB::table('evenements')
            ->where('type', $type)
            ->whereBetween('created_at', [$debut, $fin])
            ->count();
    }

    private function resume(Carbon $debut, Carbon $fin): array
    {
        $visiteurs = (int) DB::table('evenements')
            ->whereBetween('created_at', [$debut, $fin])
            ->distinct('session_id')
            ->count('session_id');

        return [
            'visiteurs_uniques' => $visiteurs,
            'vues_produits'     => $this->compter('vue_produit', $debut, $fin),
            'ajouts_panier'     => $this->compter('ajout_panier', $debut, $fin),
            'debuts_paiement'   => $this->compter('debut_checkout', $debut, $fin),
            'achats'            => $this->compter('achat_confirme', $debut, $fin),
        ];
    }

    /**
     * Entonnoir de conversion : chaque étape avec son volume et le % de
     * visiteurs perdus par rapport à l'étape précédente. C'est l'indicateur
     * le plus actionnable : il montre exactement OÙ les clients abandonnent.
     */
    private function entonnoir(Carbon $debut, Carbon $fin): array
    {
        $etapes = [
            ['cle' => 'vue_produit',    'label' => 'Vues produit'],
            ['cle' => 'ajout_panier',   'label' => 'Ajouts au panier'],
            ['cle' => 'debut_checkout', 'label' => 'Début de paiement'],
            ['cle' => 'commande_creee', 'label' => 'Commande créée'],
            ['cle' => 'achat_confirme', 'label' => 'Achat confirmé'],
        ];

        $precedent = null;
        $resultat = [];

        foreach ($etapes as $etape) {
            $valeur = $this->compter($etape['cle'], $debut, $fin);

            $tauxDepuisPrecedent = ($precedent !== null && $precedent > 0)
                ? round($valeur / $precedent * 100, 1)
                : null;

            $resultat[] = [
                'etape'                 => $etape['label'],
                'valeur'                => $valeur,
                'taux_depuis_precedent' => $tauxDepuisPrecedent, // % qui passent à cette étape
            ];

            $precedent = $valeur;
        }

        return $resultat;
    }

    /**
     * Produits vus sur la période, avec ajouts panier et achats réels, triés
     * par nombre de vues. Un produit très vu mais peu acheté = problème sur le
     * produit (prix, photos, confiance), pas sur le trafic.
     */
    private function produitsPerformance(Carbon $debut, Carbon $fin): array
    {
        // Vues + ajouts panier par produit (depuis les événements).
        $vues = DB::table('evenements')
            ->select('produit_id',
                DB::raw("COUNT(*) FILTER (WHERE type = 'vue_produit') as vues"),
                DB::raw("COUNT(*) FILTER (WHERE type = 'ajout_panier') as ajouts_panier"))
            ->whereNotNull('produit_id')
            ->whereIn('type', ['vue_produit', 'ajout_panier'])
            ->whereBetween('created_at', [$debut, $fin])
            ->groupBy('produit_id')
            ->having(DB::raw("COUNT(*) FILTER (WHERE type = 'vue_produit')"), '>', 0)
            ->orderByDesc('vues')
            ->limit(20)
            ->get()
            ->keyBy('produit_id');

        if ($vues->isEmpty()) {
            return [];
        }

        $produitIds = $vues->keys()->all();

        // Achats réels (source de vérité : commandes confirmées de la période).
        $achats = DB::table('articles_commande as ac')
            ->join('commandes as c', 'c.id', '=', 'ac.commande_id')
            ->whereIn('ac.produit_id', $produitIds)
            ->whereIn('c.statut', ['confirmee', 'en_preparation', 'prete', 'en_livraison', 'livree'])
            ->whereBetween('c.created_at', [$debut, $fin])
            ->select('ac.produit_id', DB::raw('SUM(ac.quantite) as achats'))
            ->groupBy('ac.produit_id')
            ->pluck('achats', 'ac.produit_id');

        $noms = DB::table('produits')
            ->whereIn('id', $produitIds)
            ->pluck('nom', 'id');

        return $vues->map(function ($row) use ($achats, $noms) {
            $nbVues = (int) $row->vues;
            $nbAchats = (int) ($achats[$row->produit_id] ?? 0);

            return [
                'produit_id'      => $row->produit_id,
                'nom'             => $noms[$row->produit_id] ?? 'Produit supprimé',
                'vues'            => $nbVues,
                'ajouts_panier'   => (int) $row->ajouts_panier,
                'achats'          => $nbAchats,
                'taux_conversion' => $nbVues > 0 ? round($nbAchats / $nbVues * 100, 1) : 0,
            ];
        })->values()->all();
    }

    private function recherchesFrequentes(Carbon $debut, Carbon $fin): array
    {
        return DB::table('evenements')
            ->where('type', 'recherche')
            ->whereNotNull('terme_recherche')
            ->whereBetween('created_at', [$debut, $fin])
            ->select('terme_recherche', DB::raw('COUNT(*) as total'))
            ->groupBy('terme_recherche')
            ->orderByDesc('total')
            ->limit(15)
            ->get()
            ->map(fn ($r) => ['terme' => $r->terme_recherche, 'total' => (int) $r->total])
            ->all();
    }

    /**
     * Recherches suivies d'aucun clic sur un résultat dans la même session :
     * ce que les clients cherchent mais ne trouvent pas (produits à ajouter
     * au catalogue). Approximation : terme recherché jamais suivi, pour la
     * même session, d'une vue produit dans les 10 minutes.
     */
    private function recherchesSansClic(Carbon $debut, Carbon $fin): array
    {
        $recherches = DB::table('evenements')
            ->where('type', 'recherche')
            ->whereNotNull('terme_recherche')
            ->whereBetween('created_at', [$debut, $fin])
            ->select('terme_recherche', 'session_id', 'created_at')
            ->get();

        if ($recherches->isEmpty()) {
            return [];
        }

        $sansClic = [];

        foreach ($recherches as $r) {
            $aVu = DB::table('evenements')
                ->where('type', 'vue_produit')
                ->where('session_id', $r->session_id)
                ->whereBetween('created_at', [$r->created_at, Carbon::parse($r->created_at)->addMinutes(10)])
                ->exists();

            if (!$aVu) {
                $terme = $r->terme_recherche;
                $sansClic[$terme] = ($sansClic[$terme] ?? 0) + 1;
            }
        }

        arsort($sansClic);

        return collect($sansClic)
            ->take(10)
            ->map(fn ($total, $terme) => ['terme' => $terme, 'total' => $total])
            ->values()
            ->all();
    }

    private function topCategories(Carbon $debut, Carbon $fin): array
    {
        return DB::table('evenements as e')
            ->join('categories as cat', 'cat.id', '=', 'e.categorie_id')
            ->where('e.type', 'vue_categorie')
            ->whereBetween('e.created_at', [$debut, $fin])
            ->select('cat.nom', DB::raw('COUNT(*) as vues'))
            ->groupBy('cat.id', 'cat.nom')
            ->orderByDesc('vues')
            ->limit(10)
            ->get()
            ->map(fn ($r) => ['nom' => $r->nom, 'vues' => (int) $r->vues])
            ->all();
    }

    /**
     * Échecs de paiement par méthode : si beaucoup de clients arrivent au
     * paiement mais échouent, le problème est technique (fournisseur de
     * paiement), pas commercial.
     */
    private function echecsPaiement(Carbon $debut, Carbon $fin): array
    {
        return DB::table('evenements')
            ->where('type', 'paiement_echoue')
            ->whereBetween('created_at', [$debut, $fin])
            ->select(DB::raw("COALESCE(metadata->>'methode', 'inconnue') as methode"), DB::raw('COUNT(*) as total'))
            ->groupBy(DB::raw("metadata->>'methode'"))
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => ['methode' => $r->methode, 'total' => (int) $r->total])
            ->all();
    }
}
