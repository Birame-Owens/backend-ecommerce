<?php

namespace Tests\Feature\Client;

use App\Models\ArticlesCommande;
use App\Models\Category;
use App\Models\Commande;
use App\Models\OffreCadeau;
use App\Models\Produit;
use App\Models\User;
use App\Services\Client\CheckoutService;
use App\Services\OffreCadeauService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class OffreCadeauTest extends TestCase
{
    use RefreshDatabase;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();

        $this->category = Category::create([
            'nom' => 'Mode',
            'slug' => 'mode-' . uniqid(),
            'est_active' => true,
            'est_populaire' => false,
            'ordre_affichage' => 1,
        ]);
    }

    private function makeProduit(string $nom, float $prix, int $stock = 10, array $overrides = []): Produit
    {
        return Produit::create(array_merge([
            'nom' => $nom,
            'slug' => str()->slug($nom) . '-' . uniqid(),
            'description' => $nom,
            'image_principale' => 'produits/default-product.jpg',
            'prix' => $prix,
            'categorie_id' => $this->category->id,
            'stock_disponible' => $stock,
            'seuil_alerte' => 1,
            'gestion_stock' => true,
            'est_visible' => true,
            'est_populaire' => false,
            'est_nouveaute' => false,
        ], $overrides));
    }

    private function makeOffre(Produit $declencheur, Produit $cadeau, array $overrides = []): OffreCadeau
    {
        return OffreCadeau::create(array_merge([
            'produit_declencheur_id' => $declencheur->id,
            'produit_offert_id' => $cadeau->id,
            'quantite_declencheur' => 1,
            'quantite_offerte' => 1,
            'est_active' => true,
        ], $overrides));
    }

    private function order(Produit $produit, int $quantity = 1): Commande
    {
        $result = app(CheckoutService::class)->createOrder([
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
        ]);

        return Commande::where('numero_commande', $result['data']['commande']->numero_commande)->firstOrFail();
    }

    private function giftLines(Commande $commande)
    {
        return ArticlesCommande::where('commande_id', $commande->id)->where('est_cadeau', true)->get();
    }

    public function test_gift_is_added_at_zero_and_total_is_unchanged(): void
    {
        $pantalon = $this->makeProduit('Pantalon en lin', 4500);
        $sac = $this->makeProduit('Sac à franges', 2500, stock: 5);
        $offre = $this->makeOffre($pantalon, $sac);

        $commande = $this->order($pantalon);

        $gifts = $this->giftLines($commande);
        $this->assertCount(1, $gifts);
        $this->assertSame($sac->id, $gifts[0]->produit_id);
        $this->assertSame(1, $gifts[0]->quantite);
        $this->assertEquals(0, $gifts[0]->prix_total_article);
        $this->assertEquals(2500, $gifts[0]->valeur_cadeau);
        $this->assertSame($offre->id, $gifts[0]->offre_cadeau_id);

        $this->assertEquals(4500, $commande->sous_total);
        $this->assertSame(4, $sac->fresh()->stock_disponible);
    }

    public function test_gift_quantity_follows_purchased_quantity(): void
    {
        $pantalon = $this->makeProduit('Pantalon', 4500);
        $sac = $this->makeProduit('Sac', 2500);
        $this->makeOffre($pantalon, $sac);

        $commande = $this->order($pantalon, 2);

        $this->assertSame(2, $this->giftLines($commande)->first()->quantite);
    }

    public function test_gift_uses_purchase_threshold(): void
    {
        $pantalon = $this->makeProduit('Pantalon', 4500);
        $sac = $this->makeProduit('Sac', 2500);
        $this->makeOffre($pantalon, $sac, ['quantite_declencheur' => 2]);

        // 1 acheté : palier non atteint.
        $this->assertCount(0, $this->giftLines($this->order($pantalon, 1)));
        // 3 achetés : un seul palier de 2 atteint.
        $this->assertSame(1, $this->giftLines($this->order($pantalon, 3))->first()->quantite);
    }

    public function test_out_of_stock_gift_disables_offer(): void
    {
        $pantalon = $this->makeProduit('Pantalon', 4500);
        $sac = $this->makeProduit('Sac', 2500, stock: 0);
        $this->makeOffre($pantalon, $sac);

        $this->assertSame([], app(OffreCadeauService::class)->offresPubliques());
        $this->assertCount(0, $this->giftLines($this->order($pantalon)));
    }

    public function test_partial_gift_stock_gives_what_is_left(): void
    {
        $pantalon = $this->makeProduit('Pantalon', 4500);
        $sac = $this->makeProduit('Sac', 2500, stock: 1);
        $this->makeOffre($pantalon, $sac);

        $commande = $this->order($pantalon, 3);

        $this->assertSame(1, $this->giftLines($commande)->first()->quantite);
        $this->assertSame(0, $sac->fresh()->stock_disponible);
    }

    public function test_inactive_or_expired_offer_gives_no_gift(): void
    {
        $pantalon = $this->makeProduit('Pantalon', 4500);
        $robe = $this->makeProduit('Robe', 9000);
        $sac = $this->makeProduit('Sac', 2500);
        $this->makeOffre($pantalon, $sac, ['est_active' => false]);
        $this->makeOffre($robe, $sac, ['date_fin' => now()->subDay()]);

        $this->assertCount(0, $this->giftLines($this->order($pantalon)));
        $this->assertCount(0, $this->giftLines($this->order($robe)));
    }

    public function test_public_endpoint_lists_available_offers(): void
    {
        $pantalon = $this->makeProduit('Pantalon', 4500);
        $sac = $this->makeProduit('Sac', 2500);
        $this->makeOffre($pantalon, $sac, ['quantite_offerte' => 2]);

        $this->getJson('/api/client/offres-cadeaux')
            ->assertOk()
            ->assertJsonPath('data.0.produit_declencheur_id', $pantalon->id)
            ->assertJsonPath('data.0.quantite_offerte', 2)
            ->assertJsonPath('data.0.cadeau.id', $sac->id)
            ->assertJsonPath('data.0.cadeau.valeur', 2500);
    }

    public function test_admin_cannot_create_two_offers_for_same_product(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'statut' => 'actif']);
        $pantalon = $this->makeProduit('Pantalon', 4500);
        $sac = $this->makeProduit('Sac', 2500);
        $montre = $this->makeProduit('Montre', 8000);

        $payload = fn (Produit $cadeau) => [
            'produit_declencheur_id' => $pantalon->id,
            'produit_offert_id' => $cadeau->id,
            'quantite_declencheur' => 1,
            'quantite_offerte' => 1,
            'est_active' => true,
        ];

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/offres-cadeaux', $payload($sac))
            ->assertCreated()
            ->assertJsonPath('data.offre.cadeau.nom', 'Sac');

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/offres-cadeaux', $payload($montre))
            ->assertStatus(422)
            ->assertJsonValidationErrors('produit_declencheur_id');
    }
}
