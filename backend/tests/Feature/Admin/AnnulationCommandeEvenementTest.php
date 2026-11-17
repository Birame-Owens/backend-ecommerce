<?php

namespace Tests\Feature\Admin;

use App\Models\Client;
use App\Models\Commande;
use App\Models\Evenement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** L'annulation d'une commande est journalisée, quel que soit le chemin. */
class AnnulationCommandeEvenementTest extends TestCase
{
    use RefreshDatabase;

    private Client $client;
    private Commande $commande;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware([
            \App\Http\Middleware\RateLimitMiddleware::class,
            \App\Http\Middleware\AdminAuditLog::class,
        ]);

        $this->client = Client::create([
            'nom' => 'Diallo', 'prenom' => 'Awa', 'telephone' => '+221771234567',
            'email' => 'awa@example.com', 'ville' => 'Dakar',
        ]);
        $this->commande = Commande::create([
            'client_id' => $this->client->id, 'numero_commande' => 'CMD-TEST-1',
            'statut' => 'confirmee', 'sous_total' => 20000, 'montant_total' => 22000,
            'adresse_livraison' => 'Dakar', 'telephone_livraison' => '+221771234567',
            'nom_destinataire' => 'Awa Diallo',
        ]);
    }

    public function test_annulation_par_l_admin_journalisee(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'statut' => 'actif']);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/commandes/{$this->commande->id}/update-status", ['statut' => 'annulee'])
            ->assertOk();

        $evenement = Evenement::where('type', 'annulation_commande')->first();
        $this->assertNotNull($evenement);
        $this->assertSame($this->commande->id, $evenement->commande_id);
        $this->assertSame($this->client->id, $evenement->client_id);
        $this->assertSame('commande_' . $this->commande->id, $evenement->session_id);
        $this->assertSame([
            'ancien_statut' => 'confirmee', 'montant' => 22000, 'origine' => 'admin',
        ], $evenement->metadata);
    }

    public function test_annulation_hors_admin_journalisee_comme_paiement(): void
    {
        // Ex. : paiement annulé / expiré chez le prestataire (webhook, sans admin connecté).
        $this->commande->update(['statut' => 'annulee']);

        $this->assertSame('paiement', Evenement::where('type', 'annulation_commande')->value('metadata')['origine']);
    }

    public function test_les_autres_changements_de_statut_ne_sont_pas_des_annulations(): void
    {
        $this->commande->update(['statut' => 'en_preparation']);
        $this->commande->update(['notes_admin' => 'RAS']);

        $this->assertSame(0, Evenement::where('type', 'annulation_commande')->count());
    }

    public function test_une_commande_deja_annulee_n_est_pas_comptee_deux_fois(): void
    {
        $this->commande->update(['statut' => 'annulee']);
        $this->commande->update(['notes_admin' => 'Remboursée']);

        $this->assertSame(1, Evenement::where('type', 'annulation_commande')->count());
    }
}
