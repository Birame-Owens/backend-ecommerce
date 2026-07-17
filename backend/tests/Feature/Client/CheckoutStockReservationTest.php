<?php

namespace Tests\Feature\Client;

use App\Console\Commands\ReleaseExpiredOrderStock;
use App\Models\Category;
use App\Models\Client;
use App\Models\Commande;
use App\Models\Produit;
use App\Services\Client\CheckoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutStockReservationTest extends TestCase
{
    use RefreshDatabase;

    private function makeProduit(int $stock = 1): Produit
    {
        $category = Category::create([
            'nom' => 'Robes',
            'slug' => 'robes-' . uniqid(),
            'est_active' => true,
            'est_populaire' => false,
            'ordre_affichage' => 1,
        ]);

        return Produit::create([
            'nom' => 'Robe Unique',
            'slug' => 'robe-unique-' . uniqid(),
            'description' => 'Il en reste peu.',
            'image_principale' => 'produits/default-product.jpg',
            'prix' => 20000,
            'categorie_id' => $category->id,
            'stock_disponible' => $stock,
            'seuil_alerte' => 1,
            'gestion_stock' => true,
            'est_visible' => true,
            'est_populaire' => false,
            'est_nouveaute' => false,
        ]);
    }

    private function orderPayload(Produit $produit, int $quantity = 1): array
    {
        return [
            'customer' => [
                'nom' => 'Diallo',
                'prenom' => 'Awa',
                'email' => 'awa+' . uniqid() . '@example.com',
                'telephone' => '771234567',
                'adresse_livraison' => 'Cité Keur Gorgui',
                'ville' => 'Dakar',
                'pays' => 'Sénégal',
            ],
            'items' => [
                ['product_id' => $produit->id, 'quantity' => $quantity, 'options' => []],
            ],
        ];
    }

    public function test_creating_order_decrements_stock_immediately(): void
    {
        $produit = $this->makeProduit(stock: 3);

        app(CheckoutService::class)->createOrder($this->orderPayload($produit, 2));

        $this->assertSame(1, $produit->fresh()->stock_disponible);
    }

    public function test_second_order_fails_once_stock_is_exhausted(): void
    {
        $produit = $this->makeProduit(stock: 1);

        // Première commande : prend le dernier exemplaire.
        $result = app(CheckoutService::class)->createOrder($this->orderPayload($produit, 1));
        $this->assertTrue($result['success']);
        $this->assertSame(0, $produit->fresh()->stock_disponible);

        // Deuxième commande sur le même produit : ne doit plus passer.
        $this->expectExceptionMessage('Stock insuffisant');
        app(CheckoutService::class)->createOrder($this->orderPayload($produit, 1));
    }

    public function test_order_creation_marks_stock_as_reserved(): void
    {
        $produit = $this->makeProduit(stock: 2);

        $result = app(CheckoutService::class)->createOrder($this->orderPayload($produit, 1));

        $commande = Commande::where('numero_commande', $result['data']['commande']->numero_commande)->first();
        $this->assertNotNull($commande->stock_decremented_at);
    }

    public function test_release_command_restores_stock_for_expired_pending_orders(): void
    {
        $produit = $this->makeProduit(stock: 1);
        app(CheckoutService::class)->createOrder($this->orderPayload($produit, 1));
        $this->assertSame(0, $produit->fresh()->stock_disponible);

        // Simule une commande créée il y a 20 minutes (au-delà du seuil de 15).
        Commande::query()->update(['stock_decremented_at' => now()->subMinutes(20)]);

        $this->artisan(ReleaseExpiredOrderStock::class, ['--minutes' => 15])
            ->assertExitCode(0);

        $this->assertSame(1, $produit->fresh()->stock_disponible);
        $this->assertNull(Commande::first()->stock_decremented_at);
    }

    public function test_release_command_does_not_touch_recent_pending_orders(): void
    {
        $produit = $this->makeProduit(stock: 1);
        app(CheckoutService::class)->createOrder($this->orderPayload($produit, 1));

        // La commande vient d'être créée, largement sous le seuil de 15 min.
        $this->artisan(ReleaseExpiredOrderStock::class, ['--minutes' => 15])
            ->assertExitCode(0);

        $this->assertSame(0, $produit->fresh()->stock_disponible);
        $this->assertNotNull(Commande::first()->stock_decremented_at);
    }

    public function test_release_command_does_not_touch_confirmed_orders(): void
    {
        $produit = $this->makeProduit(stock: 1);
        app(CheckoutService::class)->createOrder($this->orderPayload($produit, 1));

        Commande::query()->update([
            'statut' => 'confirmee',
            'stock_decremented_at' => now()->subMinutes(30),
        ]);

        $this->artisan(ReleaseExpiredOrderStock::class, ['--minutes' => 15])
            ->assertExitCode(0);

        // Le stock ne doit pas être restitué pour une commande déjà payée.
        $this->assertSame(0, $produit->fresh()->stock_disponible);
    }

    public function test_initiate_payment_reserves_stock_again_after_release(): void
    {
        $produit = $this->makeProduit(stock: 1);
        $result = app(CheckoutService::class)->createOrder($this->orderPayload($produit, 1));
        $commande = Commande::where('numero_commande', $result['data']['commande']->numero_commande)->first();

        // Le stock a été libéré entre-temps (expiration).
        app(CheckoutService::class)->restoreProductStock($produit, 1, null, null);
        $commande->update(['stock_decremented_at' => null]);
        $this->assertSame(1, $produit->fresh()->stock_disponible);

        try {
            app(CheckoutService::class)->initiatePayment($commande->fresh(), 'wave', ['phone' => '771234567']);
        } catch (\Exception $e) {
            // NabooPay n'est pas configuré en environnement de test : on
            // s'attend à ce que l'appel échoue plus loin, après la
            // ré-réservation du stock.
        }

        $this->assertSame(0, $produit->fresh()->stock_disponible);
        $this->assertNotNull($commande->fresh()->stock_decremented_at);
    }

    public function test_initiate_payment_fails_cleanly_when_stock_gone_after_release(): void
    {
        $produitA = $this->makeProduit(stock: 1);
        $resultA = app(CheckoutService::class)->createOrder($this->orderPayload($produitA, 1));
        $commandeA = Commande::where('numero_commande', $resultA['data']['commande']->numero_commande)->first();

        // Le stock de la commande A est libéré (expiration)...
        app(CheckoutService::class)->restoreProductStock($produitA, 1, null, null);
        $commandeA->update(['stock_decremented_at' => null]);

        // ...puis pris par une autre cliente avant que A ne relance son paiement.
        app(CheckoutService::class)->createOrder($this->orderPayload($produitA, 1));
        $this->assertSame(0, $produitA->fresh()->stock_disponible);

        $this->expectExceptionMessage('Stock indisponible');
        app(CheckoutService::class)->initiatePayment($commandeA->fresh(), 'wave', ['phone' => '771234567']);
    }
}
