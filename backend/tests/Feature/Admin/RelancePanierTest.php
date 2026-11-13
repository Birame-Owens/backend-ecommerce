<?php

namespace Tests\Feature\Admin;

use App\Mail\RelancePanierMail;
use App\Models\ArticlesPanier;
use App\Models\Category;
use App\Models\Client;
use App\Models\Commande;
use App\Models\Panier;
use App\Models\Produit;
use App\Models\RelancePanier;
use App\Models\ShopSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class RelancePanierTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        ShopSetting::setValue('notif_relance_panier', '1', 'notifications');
    }

    private function makeProduit(): Produit
    {
        $category = Category::create([
            'nom' => 'Robes', 'slug' => 'robes-' . uniqid(),
            'est_active' => true, 'est_populaire' => false, 'ordre_affichage' => 1,
        ]);

        return Produit::create([
            'nom' => 'Robe Wax', 'slug' => 'robe-' . uniqid(),
            'description' => 'Desc.', 'image_principale' => 'produits/robe.jpg',
            'prix' => 15000, 'categorie_id' => $category->id,
            'stock_disponible' => 10, 'seuil_alerte' => 2, 'gestion_stock' => true,
            'est_visible' => true, 'est_populaire' => false, 'est_nouveaute' => false,
        ]);
    }

    /** Client connecté avec un panier serveur « user_{id} » inactif depuis $heures. */
    private function makePanierAbandonne(int $heures, array $client = []): array
    {
        $user = User::factory()->create(['role' => 'client', 'statut' => 'actif']);
        $client = Client::create(array_merge([
            'nom' => 'Diallo', 'prenom' => 'Awa', 'telephone' => '+22177' . random_int(1000000, 9999999),
            'email' => 'awa' . uniqid() . '@example.com', 'ville' => 'Dakar', 'user_id' => $user->id,
            'accepte_email' => true, 'accepte_promotions' => true,
        ], $client));

        $panier = Panier::create([
            'identifiant' => 'user_' . $user->id, 'session_id' => 'user_' . $user->id,
            'sous_total' => 30000, 'nombre_articles' => 2, 'statut' => 'actif',
            'derniere_activite' => now()->subHours($heures),
        ]);
        ArticlesPanier::create([
            'panier_id' => $panier->id, 'produit_id' => $this->makeProduit()->id,
            'quantite' => 2, 'prix_unitaire' => 15000, 'prix_total' => 30000, 'taille_choisie' => 'M', 'date_ajout' => now(),
        ]);

        return [$client, $panier];
    }

    private function makeCommande(Client $client, $date): Commande
    {
        return Commande::create([
            'client_id' => $client->id, 'numero_commande' => 'CMD-' . uniqid(),
            'statut' => 'confirmee', 'sous_total' => 30000, 'montant_total' => 30000,
            'adresse_livraison' => 'Dakar', 'telephone_livraison' => $client->telephone,
            'nom_destinataire' => 'Awa Diallo', 'created_at' => $date,
        ]);
    }

    public function test_premiere_relance_apres_deux_heures(): void
    {
        [$client] = $this->makePanierAbandonne(3);

        $this->artisan('paniers:relancer')->assertSuccessful();

        Mail::assertQueued(RelancePanierMail::class, fn ($mail) =>
            $mail->hasTo($client->email) && $mail->etape === 1
            && $mail->total === 30000.0 && count($mail->articles) === 1);
        $this->assertDatabaseHas('relances_panier', ['client_id' => $client->id, 'etape' => 1]);
    }

    public function test_pas_de_relance_avant_deux_heures(): void
    {
        $this->makePanierAbandonne(1);

        $this->artisan('paniers:relancer');

        Mail::assertNothingQueued();
    }

    public function test_jamais_deux_fois_la_meme_relance(): void
    {
        $this->makePanierAbandonne(3);

        $this->artisan('paniers:relancer');
        $this->artisan('paniers:relancer');

        Mail::assertQueued(RelancePanierMail::class, 1);
    }

    public function test_seconde_relance_apres_vingt_quatre_heures(): void
    {
        [$client] = $this->makePanierAbandonne(3);
        $this->artisan('paniers:relancer');

        $this->travel(22)->hours();
        $this->artisan('paniers:relancer');

        Mail::assertQueued(RelancePanierMail::class, fn ($mail) => $mail->etape === 2);
        $this->assertSame(2, RelancePanier::where('client_id', $client->id)->count());
    }

    public function test_rien_si_desactive_dans_l_admin(): void
    {
        ShopSetting::setValue('notif_relance_panier', '0', 'notifications');
        $this->makePanierAbandonne(3);

        $this->artisan('paniers:relancer');

        Mail::assertNothingQueued();
    }

    public function test_rien_sans_consentement_aux_offres(): void
    {
        $this->makePanierAbandonne(3, ['accepte_promotions' => false]);

        $this->artisan('paniers:relancer');

        Mail::assertNothingQueued();
    }

    public function test_rien_si_le_client_a_deja_commande(): void
    {
        [$client] = $this->makePanierAbandonne(3);
        $this->makeCommande($client, now()->subHour());

        $this->artisan('paniers:relancer');

        Mail::assertNothingQueued();
    }

    public function test_les_paniers_d_invites_ne_sont_jamais_relances(): void
    {
        $panier = Panier::create([
            'identifiant' => 'guest_abcdefgh123', 'session_id' => 'guest_abcdefgh123',
            'sous_total' => 15000, 'nombre_articles' => 1, 'statut' => 'actif',
            'derniere_activite' => now()->subHours(3),
        ]);
        ArticlesPanier::create([
            'panier_id' => $panier->id, 'produit_id' => $this->makeProduit()->id,
            'quantite' => 1, 'prix_unitaire' => 15000, 'prix_total' => 15000, 'date_ajout' => now(),
        ]);

        $this->artisan('paniers:relancer');

        Mail::assertNothingQueued();
    }

    public function test_commande_apres_relance_est_comptee_comme_recuperee(): void
    {
        [$client] = $this->makePanierAbandonne(3);
        $this->artisan('paniers:relancer');

        $this->travel(1)->hours();
        $commande = $this->makeCommande($client, now());
        $this->artisan('paniers:relancer');

        $this->assertDatabaseHas('relances_panier', [
            'client_id' => $client->id, 'commande_id' => $commande->id, 'montant_recupere' => 30000,
        ]);
    }

    public function test_lien_de_desinscription_signe(): void
    {
        [$client] = $this->makePanierAbandonne(3);

        $this->get(URL::signedRoute('relance.desinscription', ['client' => $client->id]))
            ->assertOk()
            ->assertSee('Vous êtes désinscrit');
        $this->assertFalse((bool) $client->fresh()->accepte_promotions);
    }

    public function test_lien_de_desinscription_falsifie_refuse(): void
    {
        [$client] = $this->makePanierAbandonne(3);

        $this->get('/desinscription/' . $client->id)->assertForbidden();
        $this->assertTrue((bool) $client->fresh()->accepte_promotions);
    }

    public function test_l_email_se_genere_sans_erreur(): void
    {
        [$client, $panier] = $this->makePanierAbandonne(3);
        $articles = $panier->articles_paniers()->with('produit')->get();

        $html = (new RelancePanierMail($client, $articles, 1))->render();

        $this->assertStringContainsString('Robe Wax', $html);
        $this->assertStringContainsString('30 000 F', $html);
        $this->assertStringContainsString('Ne plus recevoir ces e-mails', $html);
    }

    public function test_statistiques_dans_le_rapport_comportement(): void
    {
        [$client] = $this->makePanierAbandonne(3);
        $this->artisan('paniers:relancer');
        $this->travel(1)->hours();
        $this->makeCommande($client, now());
        $this->artisan('paniers:relancer');

        $admin = User::factory()->create(['role' => 'admin', 'statut' => 'actif']);
        $this->withoutMiddleware(\App\Http\Middleware\RateLimitMiddleware::class)
            ->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/rapports/comportement?periode=7_jours')
            ->assertOk()
            ->assertJsonPath('data.relances_panier.active', true)
            ->assertJsonPath('data.relances_panier.envoyees', 1)
            ->assertJsonPath('data.relances_panier.paniers_recuperes', 1);
    }

    public function test_inscription_sans_consentement_aux_offres_par_defaut(): void
    {
        $this->withoutMiddleware(\App\Http\Middleware\RateLimitMiddleware::class)
            ->postJson('/api/client/auth/register', [
                'nom' => 'Ndiaye', 'prenom' => 'Moussa', 'email' => 'moussa@example.com',
                'telephone' => '+221701234567', 'password' => 'motdepasse123',
                'password_confirmation' => 'motdepasse123', 'accepte_conditions' => true,
            ])->assertSuccessful();

        $this->assertFalse((bool) Client::where('email', 'moussa@example.com')->value('accepte_promotions'));
    }
}
