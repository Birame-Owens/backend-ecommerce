<?php

namespace Tests\Feature\Client;

use App\Mail\RelancePanierMail;
use App\Models\Category;
use App\Models\Client;
use App\Models\Panier;
use App\Models\Produit;
use App\Models\ShopSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class CartSyncTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware([
            \App\Http\Middleware\RateLimitMiddleware::class,
            \App\Http\Middleware\ApiResponseCache::class,
        ]);
        $this->user = User::factory()->create(['role' => 'client', 'statut' => 'actif']);
        Client::create([
            'nom' => 'Diallo', 'prenom' => 'Awa', 'telephone' => '+221771234567',
            'email' => 'awa@example.com', 'ville' => 'Dakar', 'user_id' => $this->user->id,
            'accepte_email' => true, 'accepte_promotions' => true,
        ]);
    }

    private function makeProduit(array $attrs = []): Produit
    {
        $category = Category::create([
            'nom' => 'Robes', 'slug' => 'robes-' . uniqid(),
            'est_active' => true, 'est_populaire' => false, 'ordre_affichage' => 1,
        ]);

        return Produit::create(array_merge([
            'nom' => 'Robe Wax', 'slug' => 'robe-' . uniqid(),
            'description' => 'Desc.', 'image_principale' => 'produits/robe.jpg',
            'prix' => 15000, 'categorie_id' => $category->id,
            'stock_disponible' => 10, 'seuil_alerte' => 2, 'gestion_stock' => true,
            'est_visible' => true, 'est_populaire' => false, 'est_nouveaute' => false,
        ], $attrs));
    }

    private function sync(array $items)
    {
        return $this->actingAs($this->user, 'sanctum')->putJson('/api/client/cart/sync', ['items' => $items]);
    }

    private function panier(): ?Panier
    {
        return Panier::where('session_id', 'user_' . $this->user->id)->first();
    }

    public function test_le_panier_du_client_connecte_est_copie_avec_les_prix_du_serveur(): void
    {
        $produit = $this->makeProduit();

        $this->sync([['produit_id' => $produit->id, 'quantite' => 2, 'taille' => 'M', 'couleur' => null]])
            ->assertOk()
            ->assertJsonPath('data.nombre_articles', 2);

        $panier = $this->panier();
        $this->assertSame(30000.0, $panier->sous_total);
        $this->assertDatabaseHas('articles_panier', [
            'panier_id' => $panier->id, 'produit_id' => $produit->id,
            'quantite' => 2, 'taille_choisie' => 'M', 'prix_unitaire' => 15000,
        ]);
    }

    public function test_le_prix_promo_est_utilise_et_les_produits_masques_ignores(): void
    {
        $promo = $this->makeProduit(['prix_promo' => 10000]);
        $masque = $this->makeProduit(['est_visible' => false]);

        $this->sync([
            ['produit_id' => $promo->id, 'quantite' => 1],
            ['produit_id' => $masque->id, 'quantite' => 1],
            ['produit_id' => 999999, 'quantite' => 1],
        ])->assertOk();

        $panier = $this->panier();
        $this->assertSame(1, $panier->articles_paniers()->count());
        $this->assertSame(10000.0, $panier->sous_total);
    }

    public function test_un_panier_vide_vide_la_copie_serveur(): void
    {
        $produit = $this->makeProduit();
        $this->sync([['produit_id' => $produit->id, 'quantite' => 1]]);

        $this->sync([])->assertOk();

        $this->assertSame(0, $this->panier()->articles_paniers()->count());
        $this->assertSame(0, $this->panier()->nombre_articles);
    }

    public function test_un_contenu_identique_ne_repousse_pas_la_date_d_activite(): void
    {
        $produit = $this->makeProduit();
        $this->sync([['produit_id' => $produit->id, 'quantite' => 1]]);
        $avant = $this->panier()->derniere_activite;

        $this->travel(1)->hours();
        $this->sync([['produit_id' => $produit->id, 'quantite' => 1]])
            ->assertJsonPath('data.modifie', false);

        $this->assertTrue($avant->equalTo($this->panier()->derniere_activite));
    }

    public function test_une_modification_repousse_la_date_d_activite(): void
    {
        $produit = $this->makeProduit();
        $this->sync([['produit_id' => $produit->id, 'quantite' => 1]]);
        $avant = $this->panier()->derniere_activite;

        $this->travel(1)->hours();
        $this->sync([['produit_id' => $produit->id, 'quantite' => 3]])
            ->assertJsonPath('data.modifie', true);

        $this->assertTrue($this->panier()->derniere_activite->greaterThan($avant));
    }

    public function test_reserve_aux_clients_connectes(): void
    {
        $this->putJson('/api/client/cart/sync', ['items' => []])->assertUnauthorized();
    }

    public function test_quantites_invalides_refusees(): void
    {
        $produit = $this->makeProduit();

        $this->sync([['produit_id' => $produit->id, 'quantite' => 0]])->assertUnprocessable();
        $this->sync([['produit_id' => $produit->id, 'quantite' => 500]])->assertUnprocessable();
    }

    public function test_le_panier_est_relu_sur_un_autre_appareil_avec_prix_et_stock_actuels(): void
    {
        $produit = $this->makeProduit(['stock_disponible' => 2]);
        $masque = $this->makeProduit();
        $this->sync([
            ['produit_id' => $produit->id, 'quantite' => 3, 'taille' => 'M', 'couleur' => 'Rouge'],
            ['produit_id' => $masque->id, 'quantite' => 1],
        ]);
        $produit->update(['prix_promo' => 12000]);
        $masque->update(['est_visible' => false]);

        $items = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/client/cart/sync')
            ->assertOk()
            ->json('data.items');

        $this->assertCount(1, $items);
        $this->assertSame($produit->id, $items[0]['id']);
        $this->assertSame($produit->slug, $items[0]['slug']);
        $this->assertEquals(12000, $items[0]['prix']);       // prix actuel (promo)
        $this->assertSame(2, $items[0]['qty']);               // plafonné au stock
        $this->assertSame(['M', 'Rouge'], [$items[0]['taille'], $items[0]['couleur']]);
    }

    public function test_la_relecture_est_reservee_au_client_connecte(): void
    {
        $this->getJson('/api/client/cart/sync')->assertUnauthorized();
    }

    public function test_de_bout_en_bout_le_panier_synchronise_declenche_la_relance(): void
    {
        Mail::fake();
        ShopSetting::setValue('notif_relance_panier', '1', 'notifications');
        $produit = $this->makeProduit();
        $this->sync([['produit_id' => $produit->id, 'quantite' => 1, 'taille' => 'L']]);

        $this->travel(3)->hours();
        $this->artisan('paniers:relancer')->assertSuccessful();

        Mail::assertQueued(RelancePanierMail::class, fn ($mail) =>
            $mail->hasTo('awa@example.com') && $mail->etape === 1 && $mail->total === 15000.0);
    }
}
