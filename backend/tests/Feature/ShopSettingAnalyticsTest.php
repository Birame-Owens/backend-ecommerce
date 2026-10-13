<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShopSettingAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(\App\Http\Middleware\RateLimitMiddleware::class);
    }

    private function makeAdmin(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role'   => 'admin',
            'statut' => 'actif',
        ], $overrides));
    }

    public function test_public_config_exposes_null_ga_id_by_default(): void
    {
        $response = $this->getJson('/api/client/config');

        $response->assertStatus(200)
                 ->assertJsonPath('data.analytics.ga_measurement_id', null);
    }

    public function test_admin_can_save_ga_id_and_it_appears_in_public_config(): void
    {
        $admin = $this->makeAdmin();

        $update = $this->actingAs($admin, 'sanctum')
            ->putJson('/api/admin/settings', [
                'settings' => ['analytics_ga_id' => 'G-ABC123XYZ'],
            ]);

        $update->assertStatus(200)
               ->assertJsonPath('data.analytics.analytics_ga_id', 'G-ABC123XYZ');

        $config = $this->getJson('/api/client/config');
        $config->assertJsonPath('data.analytics.ga_measurement_id', 'G-ABC123XYZ');
    }

    public function test_admin_can_save_meta_pixel_id_and_it_appears_in_public_config(): void
    {
        $this->getJson('/api/client/config')
             ->assertJsonPath('data.analytics.meta_pixel_id', null);

        $this->actingAs($this->makeAdmin(), 'sanctum')
            ->putJson('/api/admin/settings', ['settings' => ['analytics_meta_pixel_id' => '2662935704152680']])
            ->assertStatus(200)
            ->assertJsonPath('data.analytics.analytics_meta_pixel_id', '2662935704152680');

        $this->getJson('/api/client/config')
             ->assertJsonPath('data.analytics.meta_pixel_id', '2662935704152680');
    }

    public function test_invalid_meta_pixel_id_is_never_exposed(): void
    {
        // Le snippet entier collé par erreur au lieu de l'ID : ne doit jamais partir vers le site.
        $this->actingAs($this->makeAdmin(), 'sanctum')
            ->putJson('/api/admin/settings', ['settings' => ['analytics_meta_pixel_id' => "<script>fbq('init','1')</script>"]]);

        $this->getJson('/api/client/config')
             ->assertJsonPath('data.analytics.meta_pixel_id', null);
    }

    public function test_empty_ga_id_disables_tracking(): void
    {
        $admin = $this->makeAdmin();

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/admin/settings', ['settings' => ['analytics_ga_id' => 'G-ABC123XYZ']]);

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/admin/settings', ['settings' => ['analytics_ga_id' => '']]);

        $config = $this->getJson('/api/client/config');
        $config->assertJsonPath('data.analytics.ga_measurement_id', null);
    }
}
