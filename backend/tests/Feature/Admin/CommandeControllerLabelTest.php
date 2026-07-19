<?php

namespace Tests\Feature\Admin;

use App\Models\Client;
use App\Models\Commande;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommandeControllerLabelTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin(): User
    {
        return User::factory()->create([
            'role'   => 'admin',
            'statut' => 'actif',
        ]);
    }

    private function makeCommande(): Commande
    {
        $client = Client::create([
            'nom'       => 'Diallo',
            'prenom'    => 'Awa',
            'telephone' => '+221771234567',
            'ville'     => 'Dakar',
        ]);

        return Commande::create([
            'client_id'           => $client->id,
            'numero_commande'     => 'CMD-20260719-LABEL1',
            'statut'              => 'confirmee',
            'sous_total'          => 20000,
            'montant_total'       => 20000,
            'adresse_livraison'   => 'Cité Keur Gorgui, Villa 42',
            'telephone_livraison' => '+221771234567',
            'nom_destinataire'    => 'Awa Diallo',
        ]);
    }

    public function test_admin_can_generate_delivery_label_pdf(): void
    {
        $admin = $this->makeAdmin();
        $commande = $this->makeCommande();

        $response = $this->actingAs($admin, 'sanctum')
            ->get("/api/admin/commandes/{$commande->id}/etiquette");

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_guest_cannot_generate_delivery_label(): void
    {
        $commande = $this->makeCommande();

        $response = $this->get("/api/admin/commandes/{$commande->id}/etiquette");

        $response->assertStatus(401);
    }
}
