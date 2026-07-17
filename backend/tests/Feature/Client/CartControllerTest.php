<?php

namespace Tests\Feature\Client;

use App\Models\Category;
use App\Models\Produit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartControllerTest extends TestCase
{
    use RefreshDatabase;

    private Produit $produit;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(\App\Http\Middleware\RateLimitMiddleware::class);

        $category = Category::create([
            'nom'             => 'Robes',
            'slug'            => 'robes',
            'est_active'      => true,
            'est_populaire'   => false,
            'ordre_affichage' => 1,
        ]);

        $this->produit = Produit::create([
            'nom'              => 'Robe Test',
            'slug'             => 'robe-test',
            'description'      => 'Description test.',
            'image_principale' => 'produits/default-product.jpg',
            'prix'             => 20000,
            'categorie_id'     => $category->id,
            'stock_disponible' => 10,
            'seuil_alerte'     => 2,
            'gestion_stock'    => true,
            'est_visible'      => true,
            'est_populaire'    => false,
            'est_nouveaute'    => false,
        ]);
    }

    // ── GET /api/client/cart ─────────────────────────────────────────────────

    public function test_index_returns_empty_cart(): void
    {
        $response = $this->getJson('/api/client/cart');

        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.count', 0)
                 ->assertJsonPath('data.items', []);
    }

    public function test_index_returns_cart_structure(): void
    {
        $response = $this->getJson('/api/client/cart');

        $response->assertStatus(200)
                 ->assertJsonStructure(['data' => [
                     'items', 'count', 'subtotal', 'discount', 'shipping_fee', 'total',
                 ]]);
    }

    // ── POST /api/client/cart/add ────────────────────────────────────────────

    public function test_add_returns_success(): void
    {
        $response = $this->postJson('/api/client/cart/add', [
            'product_id' => $this->produit->id,
            'quantity'   => 1,
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);
    }

    public function test_add_succeeds_for_made_to_order_product_with_zero_stock(): void
    {
        $produit = Produit::create([
            'nom'              => 'Robe Sur Mesure',
            'slug'             => 'robe-sur-mesure-cart',
            'description'      => 'Fabriquée à la demande.',
            'image_principale' => 'produits/default-product.jpg',
            'prix'             => 30000,
            'categorie_id'     => $this->produit->categorie_id,
            'stock_disponible' => 0,
            'seuil_alerte'     => 2,
            'gestion_stock'    => true,
            'fait_sur_mesure'  => true,
            'delai_production_jours' => 5,
            'est_visible'      => true,
            'est_populaire'    => false,
            'est_nouveaute'    => false,
        ]);

        $response = $this->postJson('/api/client/cart/add', [
            'product_id' => $produit->id,
            'quantity'   => 1,
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);
    }

    public function test_add_increases_cart_count(): void
    {
        $user = User::factory()->create(['role' => 'client', 'statut' => 'actif']);

        $this->actingAs($user, 'sanctum')
             ->postJson('/api/client/cart/add', [
                 'product_id' => $this->produit->id,
                 'quantity'   => 2,
             ]);

        $response = $this->actingAs($user, 'sanctum')
                         ->getJson('/api/client/cart');

        $response->assertStatus(200);
        $this->assertGreaterThan(0, $response->json('data.count'));
    }

    public function test_add_requires_product_id(): void
    {
        $this->postJson('/api/client/cart/add', ['quantity' => 1])
             ->assertStatus(422);
    }

    public function test_add_rejects_nonexistent_product(): void
    {
        $this->postJson('/api/client/cart/add', [
            'product_id' => 99999,
            'quantity'   => 1,
        ])->assertStatus(422);
    }

    public function test_add_accepts_optional_taille_and_couleur(): void
    {
        $response = $this->postJson('/api/client/cart/add', [
            'product_id' => $this->produit->id,
            'quantity'   => 1,
            'taille'     => 'M',
            'couleur'    => 'Rouge',
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);
    }

    // ── GET /api/client/cart/count ───────────────────────────────────────────

    public function test_count_returns_zero_for_empty_cart(): void
    {
        $response = $this->getJson('/api/client/cart/count');

        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.count', 0);
    }

    // ── DELETE /api/client/cart/clear ────────────────────────────────────────

    public function test_clear_returns_success(): void
    {
        $this->postJson('/api/client/cart/add', [
            'product_id' => $this->produit->id,
            'quantity'   => 1,
        ]);

        $response = $this->deleteJson('/api/client/cart/clear');

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);
    }

    public function test_clear_empties_the_cart(): void
    {
        $user = User::factory()->create(['role' => 'client', 'statut' => 'actif']);

        $this->actingAs($user, 'sanctum')
             ->postJson('/api/client/cart/add', [
                 'product_id' => $this->produit->id,
                 'quantity'   => 1,
             ]);

        $this->actingAs($user, 'sanctum')
             ->deleteJson('/api/client/cart/clear');

        $response = $this->actingAs($user, 'sanctum')
                         ->getJson('/api/client/cart');
        $response->assertStatus(200)
                 ->assertJsonPath('data.count', 0);
    }

    // ── DELETE /api/client/cart/remove/{itemId} ──────────────────────────────

    public function test_remove_item_from_cart(): void
    {
        $user = User::factory()->create(['role' => 'client', 'statut' => 'actif']);

        $this->actingAs($user, 'sanctum')
             ->postJson('/api/client/cart/add', [
                 'product_id' => $this->produit->id,
                 'quantity'   => 1,
             ]);

        $cartResponse = $this->actingAs($user, 'sanctum')
                             ->getJson('/api/client/cart');
        $itemId = $cartResponse->json('data.items.0.id');

        $this->actingAs($user, 'sanctum')
             ->deleteJson('/api/client/cart/remove/' . $itemId)
             ->assertStatus(200)
             ->assertJsonPath('success', true);
    }
}
