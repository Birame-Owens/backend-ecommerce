<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Produit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AdminProductsAndCategoriesSeeder extends Seeder
{
    /**
     * Seed les catégories et produits de test pour l'admin
     */
    public function run(): void
    {
        // Vider les catégories et produits existants
        Produit::truncate();
        Category::truncate();

        // Créer les catégories principales
        $categories = [
            [
                'nom' => 'Costumes',
                'slug' => 'costumes',
                'description' => 'Collection de costumes traditionnels sénégalais',
                'est_active' => true,
                'est_populaire' => true,
                'couleur_theme' => '#8B4513',
                'parent_id' => null,
                'ordre_affichage' => 1,
            ],
            [
                'nom' => 'Robes Traditionnelles',
                'slug' => 'robes-traditionnelles',
                'description' => 'Robes et pagnes traditionnels',
                'est_active' => true,
                'est_populaire' => true,
                'couleur_theme' => '#FF69B4',
                'parent_id' => null,
                'ordre_affichage' => 2,
            ],
            [
                'nom' => 'Montres OWENS',
                'slug' => 'montres-owens',
                'description' => 'Montres de luxe personnalisées',
                'est_active' => true,
                'est_populaire' => false,
                'couleur_theme' => '#FFD700',
                'parent_id' => null,
                'ordre_affichage' => 3,
            ],
            [
                'nom' => 'Accessoires',
                'slug' => 'accessoires',
                'description' => 'Accessoires de mode',
                'est_active' => true,
                'est_populaire' => false,
                'couleur_theme' => '#C0C0C0',
                'parent_id' => null,
                'ordre_affichage' => 4,
            ],
        ];

        $createdCategories = [];
        foreach ($categories as $catData) {
            $createdCategories[] = Category::create($catData);
        }

        // Créer les sous-catégories
        $subCategories = [
            [
                'nom' => 'Costumes Enfants',
                'slug' => 'costumes-enfants',
                'description' => 'Costumes traditionnels pour enfants',
                'est_active' => true,
                'est_populaire' => false,
                'parent_id' => $createdCategories[0]->id,
                'ordre_affichage' => 1,
            ],
            [
                'nom' => 'Costumes Adultes',
                'slug' => 'costumes-adultes',
                'description' => 'Costumes traditionnels pour adultes',
                'est_active' => true,
                'est_populaire' => true,
                'parent_id' => $createdCategories[0]->id,
                'ordre_affichage' => 2,
            ],
        ];

        foreach ($subCategories as $subCatData) {
            Category::create($subCatData);
        }

        // Créer les produits de test
        $produits = [
            [
                'nom' => 'Costume Bazin Bleu Royal',
                'slug' => 'costume-bazin-bleu-royal',
                'description' => 'Magnifique costume en bazin damassé bleu royal avec broderies dorées',
                'description_courte' => 'Costume bazin bleu royal brodé',
                'prix' => 85000,
                'prix_promo' => 75000,
                'categorie_id' => $createdCategories[0]->id,
                'stock_disponible' => 15,
                'seuil_alerte' => 5,
                'gestion_stock' => true,
                'fait_sur_mesure' => true,
                'delai_production_jours' => 10,
                'est_visible' => true,
                'est_populaire' => true,
                'est_nouveaute' => true,
                'ordre_affichage' => 1,
                'tags' => 'bazin,costume,traditionnel,sénégal',
            ],
            [
                'nom' => 'Robe Boubou Jaune Soleil',
                'slug' => 'robe-boubou-jaune-soleil',
                'description' => 'Robe boubou traditionnelle en tissu jaune avec motifs brodés',
                'description_courte' => 'Boubou jaune avec broderies',
                'prix' => 65000,
                'prix_promo' => null,
                'categorie_id' => $createdCategories[1]->id,
                'stock_disponible' => 8,
                'seuil_alerte' => 3,
                'gestion_stock' => true,
                'fait_sur_mesure' => true,
                'delai_production_jours' => 7,
                'est_visible' => true,
                'est_populaire' => true,
                'est_nouveaute' => false,
                'ordre_affichage' => 1,
                'tags' => 'boubou,robe,traditionnel,femme',
            ],
            [
                'nom' => 'Montre OWENS Prestige Noir',
                'slug' => 'montre-owens-prestige-noir',
                'description' => 'Montre de luxe OWENS cadran noir avec bracelet en cuir véritable',
                'description_courte' => 'Montre OWENS prestige',
                'prix' => 250000,
                'prix_promo' => 220000,
                'categorie_id' => $createdCategories[2]->id,
                'stock_disponible' => 5,
                'seuil_alerte' => 2,
                'gestion_stock' => true,
                'fait_sur_mesure' => false,
                'est_visible' => true,
                'est_populaire' => true,
                'est_nouveaute' => true,
                'ordre_affichage' => 1,
                'tags' => 'montre,luxe,OWENS,prestige',
            ],
            [
                'nom' => 'Costume Caché Traditionnel',
                'slug' => 'costume-cache-traditionnel',
                'description' => 'Costume traditionnel - test de non-visibilité',
                'description_courte' => 'Costume test - caché',
                'prix' => 50000,
                'prix_promo' => null,
                'categorie_id' => $createdCategories[0]->id,
                'stock_disponible' => 2,
                'seuil_alerte' => 1,
                'gestion_stock' => true,
                'fait_sur_mesure' => false,
                'est_visible' => false, // Caché
                'est_populaire' => false,
                'est_nouveaute' => false,
                'ordre_affichage' => 2,
                'tags' => 'costume,test,caché',
            ],
        ];

        foreach ($produits as $produitData) {
            Produit::create($produitData);
        }

        $this->command->info('✅ Catégories et produits de test créés avec succès !');
        $this->command->info('📊 Statistiques:');
        $this->command->info('  - Catégories: ' . Category::count());
        $this->command->info('  - Produits: ' . Produit::count());
        $this->command->info('  - Produits visibles: ' . Produit::where('est_visible', true)->count());
    }
}
