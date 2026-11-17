<?php

namespace Tests\Feature\Client;

use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Admin (cookie de session) et client (jeton) dans le même navigateur :
 * chacun doit rester connecté sous sa propre identité.
 */
class AuthSessionIsolationTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $clientUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware([
            \App\Http\Middleware\RateLimitMiddleware::class,
            \App\Http\Middleware\ApiResponseCache::class,
        ]);

        $this->admin = User::factory()->create(['role' => 'admin', 'statut' => 'actif']);
        $this->clientUser = User::factory()->create([
            'role' => 'client', 'statut' => 'actif',
            'email' => 'awa@example.com', 'password' => Hash::make('motdepasse123'),
        ]);
        Client::create([
            'nom' => 'Diallo', 'prenom' => 'Awa', 'telephone' => '+221771234567',
            'email' => 'awa@example.com', 'ville' => 'Dakar', 'user_id' => $this->clientUser->id,
        ]);
    }

    public function test_le_jeton_client_l_emporte_sur_la_session_admin(): void
    {
        $token = $this->clientUser->createToken('client-session')->plainTextToken;

        // Session admin active dans le navigateur + requête du client avec son jeton.
        $this->actingAs($this->admin, 'web')
            ->withToken($token)
            ->getJson('/api/client/auth/profile')
            ->assertOk()
            ->assertJsonPath('data.client.email', 'awa@example.com');
    }

    public function test_la_connexion_client_n_ecrit_pas_dans_la_session(): void
    {
        $this->postJson('/api/client/auth/login', [
            'email' => 'awa@example.com', 'password' => 'motdepasse123',
        ])->assertOk()->assertJsonStructure(['data' => ['token']]);

        $this->assertFalse(session()->has(Auth::guard('web')->getName()));
    }

    public function test_la_deconnexion_client_ne_deconnecte_pas_l_admin(): void
    {
        $token = $this->clientUser->createToken('client-session')->plainTextToken;
        $this->actingAs($this->admin, 'web');
        session()->put('marqueur_admin', 'present');

        $this->withToken($token)->postJson('/api/client/auth/logout')->assertOk();

        $this->assertSame('present', session('marqueur_admin'));
        $this->assertSame(0, $this->clientUser->tokens()->count());
        $this->assertSame($this->admin->id, Auth::guard('web')->id());
    }

    public function test_l_admin_par_session_accede_toujours_a_ses_donnees(): void
    {
        $this->actingAs($this->admin, 'web')
            ->getJson('/api/admin/rapports/comportement?periode=7_jours')
            ->assertOk();
    }
}
