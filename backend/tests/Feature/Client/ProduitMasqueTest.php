<?php

namespace Tests\Feature\Client;

use App\Models\Category;
use App\Models\Produit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * Un produit masqué par l'admin disparaît immédiatement de toutes les listes
 * (y compris celles déjà en cache) et sa fiche renvoie un vrai 404.
 */
class ProduitMasqueTest extends TestCase
{
    use RefreshDatabase;

    private Category $category;
    private Produit $produit;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        // Le cache des réponses HTTP est vidé par l'admin via les tags ; on teste ici
        // le cache applicatif des listes (ProductService), source du bug.
        $this->withoutMiddleware([
            \App\Http\Middleware\RateLimitMiddleware::class,
            \App\Http\Middleware\ApiResponseCache::class,
        ]);

        $this->category = Category::create([
            'nom' => 'Robes', 'slug' => 'robes', 'est_active' => true,
            'est_populaire' => false, 'ordre_affichage' => 1,
        ]);
        $this->produit = Produit::create([
            'nom' => 'Robe Wax', 'slug' => 'robe-wax', 'description' => 'Desc.',
            'image_principale' => 'produits/robe.jpg', 'prix' => 15000,
            'categorie_id' => $this->category->id, 'stock_disponible' => 10, 'seuil_alerte' => 2,
            'gestion_stock' => true, 'est_visible' => true, 'est_populaire' => false, 'est_nouveaute' => false,
        ]);
    }

    private function nomsDansLaCategorie(array $params = []): array
    {
        $query = $params ? '?' . http_build_query($params) : '';

        return collect($this->getJson("/api/client/categories/robes/products{$query}")
            ->assertOk()->json('data.products'))->pluck('nom')->all();
    }

    private function masquer(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'statut' => 'actif']);
        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/produits/{$this->produit->id}/toggle-status")
            ->assertOk();
    }

    public function test_le_produit_masque_disparait_des_listes_deja_en_cache(): void
    {
        // Listes mises en cache avant le masquage (catégorie, avec tri, page 1).
        $this->assertSame(['Robe Wax'], $this->nomsDansLaCategorie());
        $this->assertSame(['Robe Wax'], $this->nomsDansLaCategorie(['sort' => 'price_asc', 'page' => 1]));
        $this->assertSame(['Robe Wax'], collect($this->getJson('/api/client/products?search=Robe')->json('data.products'))->pluck('nom')->all());

        $this->masquer();
        $this->assertFalse($this->produit->fresh()->est_visible);

        $this->assertSame([], $this->nomsDansLaCategorie());
        $this->assertSame([], $this->nomsDansLaCategorie(['sort' => 'price_asc', 'page' => 1]));
        $this->assertSame([], collect($this->getJson('/api/client/products?search=Robe')->json('data.products'))->pluck('nom')->all());
    }

    public function test_la_fiche_d_un_produit_masque_renvoie_404(): void
    {
        $this->getJson('/api/client/products/robe-wax/page-data')->assertOk();

        $this->masquer();

        $this->getJson('/api/client/products/robe-wax/page-data')
            ->assertNotFound()
            ->assertJsonPath('success', false);
    }

    public function test_le_produit_reapparait_quand_il_est_rendu_visible(): void
    {
        $this->masquer();
        $this->assertSame([], $this->nomsDansLaCategorie());

        $this->masquer(); // second basculement : visible à nouveau
        $this->assertSame(['Robe Wax'], $this->nomsDansLaCategorie());
    }
}
