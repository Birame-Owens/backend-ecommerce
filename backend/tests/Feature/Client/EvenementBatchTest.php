<?php

namespace Tests\Feature\Client;

use App\Models\Category;
use App\Models\Client;
use App\Models\Evenement;
use App\Models\Produit;
use App\Models\User;
use App\Services\Client\EvenementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EvenementBatchTest extends TestCase
{
    use RefreshDatabase;

    private const UA_MOBILE = 'Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36';

    private Produit $produit;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware([\App\Http\Middleware\RateLimitMiddleware::class]);

        $category = Category::create([
            'nom' => 'Robes', 'slug' => 'robes', 'est_active' => true,
            'est_populaire' => false, 'ordre_affichage' => 1,
        ]);
        $this->produit = Produit::create([
            'nom' => 'Robe Wax', 'slug' => 'robe-wax', 'description' => 'Desc.',
            'image_principale' => 'produits/robe.jpg', 'prix' => 15000, 'categorie_id' => $category->id,
            'stock_disponible' => 10, 'seuil_alerte' => 2, 'gestion_stock' => true,
            'est_visible' => true, 'est_populaire' => false, 'est_nouveaute' => false,
        ]);
    }

    private function envoyer(array $events, array $headers = [])
    {
        return $this->withHeaders(array_merge([
            'User-Agent' => self::UA_MOBILE,
            'Cookie'     => 'ndeya_sid=visiteur-123',
        ], $headers))->postJson('/api/client/evenements/batch', ['events' => $events]);
    }

    public function test_un_paquet_est_enregistre_en_une_fois_avec_le_contexte(): void
    {
        $this->envoyer([
            ['type' => 'temps_vue_produit', 'produit_id' => $this->produit->id, 'metadata' => ['duree_ms' => 12500, 'defilement_max' => 80]],
            ['type' => 'reco_affichee', 'produit_id' => $this->produit->id, 'metadata' => ['source' => 'produits_similaires', 'produits' => [3, 4]]],
            ['type' => 'clic_whatsapp', 'metadata' => ['page' => '/panier']],
        ])->assertNoContent();

        $this->assertSame(3, Evenement::count());
        $vue = Evenement::where('type', 'temps_vue_produit')->first();
        $this->assertSame('visiteur-123', $vue->session_id);
        $this->assertSame('mobile', $vue->appareil);
        $this->assertSame(32, strlen($vue->empreinte));
        $this->assertSame(12500, $vue->metadata['duree_ms']);
        $this->assertSame($this->produit->id, $vue->produit_id);
    }

    public function test_l_empreinte_ne_contient_pas_l_ip_et_reste_stable(): void
    {
        $this->envoyer([['type' => 'vue_panier']], ['CF-Connecting-IP' => '196.207.12.34']);
        $this->envoyer([['type' => 'vue_panier']], ['CF-Connecting-IP' => '196.207.12.99']); // même /24, même navigateur
        $this->envoyer([['type' => 'vue_panier']], ['CF-Connecting-IP' => '41.82.5.6']);

        $empreintes = Evenement::orderBy('id')->pluck('empreinte')->all();
        $this->assertSame($empreintes[0], $empreintes[1]);
        $this->assertNotSame($empreintes[0], $empreintes[2]);
        $this->assertStringNotContainsString('196.207', $empreintes[0]);
    }

    public function test_sendbeacon_en_texte_brut_est_accepte(): void
    {
        $corps = json_encode(['events' => [['type' => 'temps_vue_produit', 'produit_id' => $this->produit->id, 'metadata' => ['duree_ms' => 900]]]]);

        $this->call('POST', '/api/client/evenements/batch', [], ['ndeya_sid' => 'x'], [], [
            'CONTENT_TYPE'    => 'text/plain;charset=UTF-8',
            'HTTP_USER_AGENT' => self::UA_MOBILE,
        ], $corps)->assertNoContent();

        $this->assertSame(1, Evenement::where('type', 'temps_vue_produit')->count());
    }

    public function test_les_evenements_invalides_sont_ignores_sans_rejeter_le_paquet(): void
    {
        $this->envoyer([
            ['type' => 'vue_panier'],
            ['type' => 'type_inconnu'],
            ['type' => 'ajout_panier', 'produit_id' => 999999], // produit inexistant → produit_id null
            'pas un tableau',
        ])->assertNoContent();

        $this->assertSame(['ajout_panier', 'vue_panier'], Evenement::orderBy('type')->pluck('type')->all());
        $this->assertNull(Evenement::where('type', 'ajout_panier')->value('produit_id'));
    }

    public function test_un_paquet_est_limite_a_50_evenements(): void
    {
        $this->envoyer(array_fill(0, 80, ['type' => 'vue_panier']))->assertNoContent();

        $this->assertSame(50, Evenement::count());
    }

    public function test_les_metadonnees_trop_volumineuses_sont_ecartees(): void
    {
        $this->envoyer([['type' => 'vue_panier', 'metadata' => ['x' => str_repeat('a', 5000)]]])->assertNoContent();

        $this->assertNull(Evenement::first()->metadata);
    }

    public function test_le_client_connecte_est_rattache_a_ses_evenements(): void
    {
        $user = User::factory()->create(['role' => 'client', 'statut' => 'actif']);
        $client = Client::create([
            'nom' => 'Diallo', 'prenom' => 'Awa', 'telephone' => '+221771234567',
            'email' => 'awa@example.com', 'ville' => 'Dakar', 'user_id' => $user->id,
        ]);
        $token = $user->createToken('client-session')->plainTextToken;

        $this->withToken($token)->envoyer([['type' => 'vue_panier']])->assertNoContent();

        $this->assertSame($client->id, Evenement::first()->client_id);
    }

    public function test_les_vues_sont_envoyees_par_le_navigateur(): void
    {
        $this->envoyer([
            ['type' => 'vue_produit', 'produit_id' => $this->produit->id, 'categorie_id' => $this->produit->categorie_id],
            ['type' => 'vue_categorie', 'categorie_id' => $this->produit->categorie_id],
        ])->assertNoContent();

        $this->assertSame(1, Evenement::where('type', 'vue_produit')->where('produit_id', $this->produit->id)->count());
        $this->assertSame(1, Evenement::where('type', 'vue_categorie')->count());
    }

    /**
     * Ces routes GET sont mises en cache (nginx + API) : y journaliser ne
     * comptait que les accès hors cache, et la recherche en double.
     */
    public function test_les_routes_catalogue_en_cache_ne_journalisent_plus(): void
    {
        $this->withoutMiddleware([\App\Http\Middleware\ApiResponseCache::class]);

        $this->getJson('/api/client/products/robe-wax/page-data')->assertOk();
        $this->getJson('/api/client/categories/robes/products')->assertOk();
        $this->getJson('/api/client/search?q=robe')->assertOk();

        $this->assertSame(0, Evenement::count());
    }

    public function test_variante_et_partage_acceptes(): void
    {
        $this->envoyer([
            ['type' => 'changement_variante', 'produit_id' => $this->produit->id, 'metadata' => ['axe' => 'taille', 'valeur' => 'M']],
            ['type' => 'partage_produit', 'produit_id' => $this->produit->id, 'metadata' => ['canal' => 'whatsapp']],
        ])->assertNoContent();

        $this->assertSame(['canal' => 'whatsapp'], Evenement::where('type', 'partage_produit')->value('metadata'));
        $this->assertSame(1, Evenement::where('type', 'changement_variante')->count());
    }

    public function test_chaque_evenement_est_date_au_moment_du_clic_a_la_milliseconde(): void
    {
        \Illuminate\Support\Carbon::setTestNow('2026-11-17 15:06:20.500');
        // Horloge du téléphone fausse (an 2001) : seul l'écart clic → envoi compte.
        $envoi = 1_000_000_000_000;

        $this->withHeaders(['User-Agent' => self::UA_MOBILE])->postJson('/api/client/evenements/batch', [
            'envoye_a' => $envoi,
            'events'   => [
                ['type' => 'changement_variante', 't' => $envoi - 5_000, 'metadata' => ['axe' => 'couleur', 'valeur' => 'Noir']],
                ['type' => 'changement_variante', 't' => $envoi - 1_250, 'metadata' => ['axe' => 'couleur', 'valeur' => 'Blanc']],
                ['type' => 'vue_panier'], // ancien format sans heure : heure de réception
            ],
        ])->assertNoContent();

        $dates = Evenement::orderBy('id')->get()->map(fn ($e) => $e->created_at->format('H:i:s.v'))->all();
        $this->assertSame(['15:06:15.500', '15:06:19.250', '15:06:20.500'], $dates);
        \Illuminate\Support\Carbon::setTestNow();
    }

    public function test_un_ecart_incoherent_ne_produit_jamais_une_date_absurde(): void
    {
        $this->assertSame(0, EvenementService::ageMs(2_000, 1_000));           // clic « après » l'envoi
        $this->assertSame(0, EvenementService::ageMs('abc', 1_000));           // valeur invalide
        $this->assertSame(0, EvenementService::ageMs(1_000, null));            // pas d'heure d'envoi
        $this->assertSame(86_400_000, EvenementService::ageMs(0, 10 ** 12));   // plafonné à 24 h
        $this->assertSame(3_000, EvenementService::ageMs(7_000, 10_000));
    }

    public function test_detection_du_type_d_appareil(): void
    {
        $this->assertSame('mobile', EvenementService::appareil(self::UA_MOBILE));
        $this->assertSame('tablette', EvenementService::appareil('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)'));
        $this->assertSame('tablette', EvenementService::appareil('Mozilla/5.0 (Linux; Android 13; SM-X200) Safari/537.36'));
        $this->assertSame('ordinateur', EvenementService::appareil('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'));
        $this->assertSame('robot', EvenementService::appareil('Mozilla/5.0 (compatible; Googlebot/2.1)'));
        $this->assertSame('robot', EvenementService::appareil('python-requests/2.31'));
        $this->assertSame('inconnu', EvenementService::appareil(''));
    }
}
