<?php

namespace Tests\Feature\Client;

use App\Models\Client;
use App\Models\Commande;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutOrderAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(\App\Http\Middleware\RateLimitMiddleware::class);
    }

    private function createOrder(?int $userId = null): Commande
    {
        $client = Client::create([
            'nom'       => 'Diallo',
            'prenom'    => 'Awa',
            'telephone' => '+221771234567',
            'ville'     => 'Dakar',
            'user_id'   => $userId,
        ]);

        return Commande::create([
            'client_id'           => $client->id,
            'numero_commande'     => 'CMD-20260716-TESTOK',
            'access_token'        => bin2hex(random_bytes(24)),
            'statut'              => 'en_attente',
            'sous_total'          => 25000,
            'montant_total'       => 25000,
            'adresse_livraison'   => 'Cité Keur Gorgui, Villa 42',
            'telephone_livraison' => '+221771234567',
            'nom_destinataire'    => 'Awa Diallo',
        ]);
    }

    public function test_guest_can_view_order_with_correct_token(): void
    {
        $commande = $this->createOrder();

        $response = $this->getJson("/api/client/commandes/{$commande->numero_commande}?t={$commande->access_token}");

        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.numero_commande', $commande->numero_commande);
    }

    public function test_guest_is_denied_without_token(): void
    {
        $commande = $this->createOrder();

        $response = $this->getJson("/api/client/commandes/{$commande->numero_commande}");

        $response->assertStatus(404);
    }

    public function test_guest_is_denied_with_wrong_token(): void
    {
        $commande = $this->createOrder();

        $response = $this->getJson("/api/client/commandes/{$commande->numero_commande}?t=" . bin2hex(random_bytes(24)));

        $response->assertStatus(404);
    }

    public function test_access_token_is_never_exposed_in_response(): void
    {
        $commande = $this->createOrder();

        $response = $this->getJson("/api/client/commandes/{$commande->numero_commande}?t={$commande->access_token}");

        $response->assertJsonMissingPath('data.access_token');
    }

    public function test_authenticated_owner_can_view_order_without_token(): void
    {
        $user = User::factory()->create();
        $commande = $this->createOrder($user->id);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/client/commandes/{$commande->numero_commande}");

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);
    }

    public function test_authenticated_non_owner_is_denied_without_token(): void
    {
        $otherUser = User::factory()->create();
        $commande = $this->createOrder();

        $response = $this->actingAs($otherUser, 'sanctum')
            ->getJson("/api/client/commandes/{$commande->numero_commande}");

        $response->assertStatus(404);
    }
}
