<?php

namespace Tests\Feature\Client;

use App\Models\Category;
use App\Models\Produit;
use App\Services\Client\EvenementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EvenementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(\App\Http\Middleware\RateLimitMiddleware::class);
    }

    private function makeProduit(): Produit
    {
        $category = Category::create([
            'nom' => 'Robes',
            'slug' => 'robes-' . uniqid(),
            'est_active' => true,
            'est_populaire' => false,
            'ordre_affichage' => 1,
        ]);

        return Produit::create([
            'nom' => 'Robe Test',
            'slug' => 'robe-test-' . uniqid(),
            'description' => 'Desc.',
            'image_principale' => 'produits/default-product.jpg',
            'prix' => 20000,
            'categorie_id' => $category->id,
            'stock_disponible' => 10,
            'seuil_alerte' => 2,
            'gestion_stock' => true,
            'est_visible' => true,
            'est_populaire' => false,
            'est_nouveaute' => false,
        ]);
    }

    public function test_client_event_endpoint_stores_allowed_event(): void
    {
        $produit = $this->makeProduit();

        $response = $this->postJson('/api/client/evenements', [
            'type' => 'ajout_panier',
            'produit_id' => $produit->id,
            'metadata' => ['quantite' => 2],
        ], ['X-Session-Id' => 'sess-abc']);

        $response->assertStatus(204);

        $this->assertDatabaseHas('evenements', [
            'type' => 'ajout_panier',
            'produit_id' => $produit->id,
            'session_id' => 'sess-abc',
        ]);
    }

    public function test_client_event_endpoint_rejects_unknown_type(): void
    {
        $response = $this->postJson('/api/client/evenements', [
            'type' => 'type_bidon_non_autorise',
        ], ['X-Session-Id' => 'sess-abc']);

        $response->assertStatus(422);
    }

    public function test_service_uses_session_header_as_session_id(): void
    {
        $this->withHeader('X-Session-Id', 'sess-xyz')
            ->postJson('/api/client/evenements', ['type' => 'vue_panier']);

        $this->assertDatabaseHas('evenements', [
            'type' => 'vue_panier',
            'session_id' => 'sess-xyz',
        ]);
    }

    public function test_logging_failure_never_throws(): void
    {
        // Un type quelconque + aucune contrainte violée : le service ne doit
        // jamais lever d'exception même appelé directement.
        app(EvenementService::class)->log('vue_produit', ['produit_id' => 999999]);

        // Le produit_id inexistant viole la FK -> l'insert échoue, mais le
        // service avale l'erreur : on arrive ici sans exception.
        $this->assertTrue(true);
    }
}
