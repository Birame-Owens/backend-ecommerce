<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\Evenement;
use App\Models\Produit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RapportComportementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(\App\Http\Middleware\RateLimitMiddleware::class);
    }

    private function makeAdmin(): User
    {
        return User::factory()->create(['role' => 'admin', 'statut' => 'actif']);
    }

    private function makeProduit(): Produit
    {
        $category = Category::create([
            'nom' => 'Robes', 'slug' => 'robes-' . uniqid(),
            'est_active' => true, 'est_populaire' => false, 'ordre_affichage' => 1,
        ]);

        return Produit::create([
            'nom' => 'Robe Test', 'slug' => 'robe-' . uniqid(),
            'description' => 'Desc.', 'image_principale' => 'produits/default-product.jpg',
            'prix' => 20000, 'categorie_id' => $category->id,
            'stock_disponible' => 10, 'seuil_alerte' => 2, 'gestion_stock' => true,
            'est_visible' => true, 'est_populaire' => false, 'est_nouveaute' => false,
        ]);
    }

    public function test_report_requires_admin_auth(): void
    {
        $this->getJson('/api/admin/rapports/comportement')->assertStatus(401);
    }

    public function test_report_returns_expected_structure(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/rapports/comportement?periode=30_jours');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'resume' => ['visiteurs_uniques', 'vues_produits', 'ajouts_panier', 'debuts_paiement', 'achats'],
                    'entonnoir',
                    'produits_performance',
                    'recherches_frequentes',
                    'recherches_sans_clic',
                    'top_categories',
                    'echecs_paiement',
                ],
            ]);
    }

    public function test_report_aggregates_events(): void
    {
        $admin = $this->makeAdmin();
        $produit = $this->makeProduit();

        // 3 vues produit, 1 ajout panier, 1 recherche
        foreach (range(1, 3) as $i) {
            Evenement::create(['session_id' => "s{$i}", 'type' => 'vue_produit', 'produit_id' => $produit->id, 'created_at' => now()]);
        }
        Evenement::create(['session_id' => 's1', 'type' => 'ajout_panier', 'produit_id' => $produit->id, 'created_at' => now()]);
        Evenement::create(['session_id' => 's1', 'type' => 'recherche', 'terme_recherche' => 'robe rouge', 'created_at' => now()]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/rapports/comportement?periode=30_jours');

        $response->assertStatus(200)
            ->assertJsonPath('data.resume.vues_produits', 3)
            ->assertJsonPath('data.resume.ajouts_panier', 1)
            ->assertJsonPath('data.produits_performance.0.produit_id', $produit->id)
            ->assertJsonPath('data.produits_performance.0.vues', 3)
            ->assertJsonPath('data.recherches_frequentes.0.terme', 'robe rouge');
    }
}
