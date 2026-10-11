<?php

namespace Tests\Feature\Admin;

use App\Models\ArticlesCommande;
use App\Models\Commande;
use App\Models\ShopSetting;
use App\Services\Admin\DeliveryLabelService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeliveryLabelServiceTest extends TestCase
{
    use RefreshDatabase;

    /** Commande en mémoire : la vue n'a besoin que des attributs et des relations. */
    private function commande(array $attrs, int $nbArticles = 1): Commande
    {
        $commande = (new Commande())->forceFill(array_merge([
            'numero_commande'     => 'CMD-20261011-TEST01',
            'nom_destinataire'    => 'Awa Diallo',
            'telephone_livraison' => '+221771234567',
            'montant_total'       => 20000,
        ], $attrs));

        $articles = collect(range(1, $nbArticles))->map(fn ($i) => (new ArticlesCommande())->forceFill([
            'nom_produit' => "Produit $i",
            'quantite'    => 1,
        ]));
        $commande->setRelation('articles_commandes', $articles);
        $commande->setRelation('deliveryZone', null);

        return $commande;
    }

    public function test_retrait_sur_place_n_affiche_pas_d_adresse_en_double(): void
    {
        $data = app(DeliveryLabelService::class)->build($this->commande([
            'adresse_livraison'  => 'Retrait sur place',
            'zone_livraison_nom' => 'Retrait sur place',
        ]), false);

        $this->assertTrue($data['estRetrait']);
        $this->assertNull($data['zone']);
        $this->assertNull($data['adresse']);
    }

    public function test_mode_boutique_est_un_retrait(): void
    {
        $data = app(DeliveryLabelService::class)->build($this->commande([
            'mode_livraison'    => 'boutique',
            'adresse_livraison' => 'Boutique',
        ]), true);

        $this->assertTrue($data['estRetrait']);
    }

    public function test_adresse_identique_a_la_zone_n_est_affichee_qu_une_fois(): void
    {
        $data = app(DeliveryLabelService::class)->build($this->commande([
            'adresse_livraison'  => 'Dakar centre',
            'zone_livraison_nom' => 'Dakar centre',
        ]), false);

        $this->assertFalse($data['estRetrait']);
        $this->assertSame('Dakar centre', $data['zone']);
        $this->assertNull($data['adresse']);
    }

    public function test_adresse_precise_est_conservee_et_telephone_lisible(): void
    {
        $data = app(DeliveryLabelService::class)->build($this->commande([
            'adresse_livraison'  => 'Cité Keur Gorgui, Villa 42',
            'zone_livraison_nom' => 'Dakar centre',
        ]), false);

        $this->assertSame('Cité Keur Gorgui, Villa 42', $data['adresse']);
        $this->assertSame('77 123 45 67', $data['telephone']);
    }

    public function test_les_articles_en_trop_sont_resumes_sans_deborder(): void
    {
        $data = app(DeliveryLabelService::class)->build($this->commande([
            'adresse_livraison'      => 'Cité Keur Gorgui, Villa 42, en face de la pharmacie Mame Diarra',
            'zone_livraison_nom'     => 'Dakar centre',
            'instructions_livraison' => 'Appeler 10 minutes avant, portail bleu au deuxième étage.',
        ], 8), false);

        $this->assertGreaterThanOrEqual(1, $data['articles']->count());
        $this->assertSame(8, $data['articles']->count() + $data['articlesRestants']);
        $this->assertSame(8, $data['nbPieces']);
    }

    public function test_jamais_un_seul_article_resume(): void
    {
        // 5 articles pour un retrait : on affiche les 5 plutôt que « 4 + 1 autre article ».
        $data = app(DeliveryLabelService::class)->build($this->commande([
            'adresse_livraison' => 'Retrait sur place',
        ], 5), false);

        $this->assertSame(0, $data['articlesRestants']);
    }

    public function test_sans_logo_configure_on_utilise_le_monogramme(): void
    {
        ShopSetting::setValue('boutique_nom', 'ND World');

        $data = app(DeliveryLabelService::class)->build($this->commande([]), false);

        $this->assertNull($data['logo']);
        $this->assertSame('ND', $data['monogramme']);
        $this->assertSame('ND World', $data['boutiqueNom']);
    }
}
