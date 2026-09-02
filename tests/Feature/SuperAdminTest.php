<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureSuperAdmin;
use App\Models\PlatformSetting;
use App\Models\Tenant;
use App\Models\User;
use App\Providers\AppServiceProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SuperAdminTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'super-admin.username' => 'operator',
            'super-admin.password' => null,
            'super-admin.password_hash' => Hash::make('secret-pass'),
        ]);
    }

    private function asOperator(): self
    {
        $this->withSession([EnsureSuperAdmin::SESSION_KEY => true]);

        return $this;
    }

    public function test_the_panel_is_gated(): void
    {
        $this->get('/super-admin/stores')->assertRedirect('/super-admin/login');
        $this->get('/super-admin/owners')->assertRedirect('/super-admin/login');
        $this->get('/super-admin/subscriptions')->assertRedirect('/super-admin/login');
        $this->get('/super-admin/settings')->assertRedirect('/super-admin/login');
    }

    public function test_stripe_settings_are_saved_and_override_config(): void
    {
        $this->asOperator()->put('/super-admin/settings', [
            'stripe_key' => 'pk_test_123',
            'stripe_secret' => 'sk_test_456',
            'stripe_price_pro' => 'price_pro_1',
        ])->assertRedirect();

        $this->assertDatabaseHas('platform_settings', [
            'key' => 'stripe_key',
            'value' => 'pk_test_123',
        ]);

        PlatformSetting::flushCache();
        (new AppServiceProvider($this->app))->boot();

        // Platform Stripe drives subscription billing (Cashier) only — not the
        // per-store storefront gateway.
        $this->assertSame('sk_test_456', config('cashier.secret'));
        $this->assertSame('pk_test_123', config('cashier.key'));
        $this->assertSame('price_pro_1', config('plans.pro.stripe_price'));
    }

    public function test_a_blank_secret_keeps_the_stored_value(): void
    {
        PlatformSetting::putMany(['stripe_secret' => 'sk_test_original']);

        $this->asOperator()->put('/super-admin/settings', [
            'stripe_secret' => '',
            'stripe_key' => 'pk_test_new',
        ])->assertRedirect();

        $this->assertDatabaseHas('platform_settings', [
            'key' => 'stripe_secret',
            'value' => 'sk_test_original',
        ]);
    }

    public function test_sign_in_with_the_configured_credentials(): void
    {
        $this->post('/super-admin/login', [
            'username' => 'operator',
            'password' => 'wrong',
        ])->assertSessionHasErrors('username');

        $this->post('/super-admin/login', [
            'username' => 'operator',
            'password' => 'secret-pass',
        ])->assertRedirect('/super-admin/stores');

        $this->assertTrue(session(EnsureSuperAdmin::SESSION_KEY));
    }

    public function test_a_plain_password_override_is_honoured(): void
    {
        config(['super-admin.password' => 'plain-one']);

        $this->post('/super-admin/login', [
            'username' => 'operator',
            'password' => 'plain-one',
        ])->assertRedirect('/super-admin/stores');
    }

    public function test_stores_can_be_suspended_and_reactivated(): void
    {
        $store = Tenant::factory()->create(['status' => 'active']);

        $this->asOperator()
            ->patch("/super-admin/stores/{$store->id}/status", ['status' => 'suspended'])
            ->assertRedirect();

        $this->assertSame('suspended', $store->refresh()->status);

        $this->asOperator()
            ->patch("/super-admin/stores/{$store->id}/status", ['status' => 'active'])
            ->assertRedirect();

        $this->assertSame('active', $store->refresh()->status);
    }

    public function test_a_store_can_be_edited(): void
    {
        $store = Tenant::factory()->create(['slug' => 'old-slug', 'plan' => 'free']);

        $this->asOperator()->put("/super-admin/stores/{$store->id}", [
            'name' => 'Renamed',
            'slug' => 'new-slug',
            'custom_domain' => null,
            'plan' => 'pro',
        ])->assertRedirect();

        $store->refresh();
        $this->assertSame('Renamed', $store->name);
        $this->assertSame('new-slug', $store->slug);
        $this->assertSame('pro', $store->plan);
    }

    public function test_a_store_can_be_deleted_with_its_data(): void
    {
        $store = Tenant::factory()->create();
        $user = User::factory()->create();
        $store->users()->attach($user, ['role' => 'owner']);

        $this->asOperator()
            ->delete("/super-admin/stores/{$store->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('tenants', ['id' => $store->id]);
        $this->assertDatabaseMissing('tenant_user', ['tenant_id' => $store->id]);
    }

    public function test_an_owner_password_can_be_reset(): void
    {
        $user = User::factory()->create();

        $this->asOperator()->patch("/super-admin/owners/{$user->id}/password", [
            'password' => 'brand-new-pass',
            'password_confirmation' => 'brand-new-pass',
        ])->assertRedirect();

        $this->assertTrue(Hash::check('brand-new-pass', $user->refresh()->password));
    }

    public function test_an_owner_can_be_edited_and_deleted(): void
    {
        $user = User::factory()->create();

        $this->asOperator()->put("/super-admin/owners/{$user->id}", [
            'name' => 'New Name',
            'email' => 'new@example.test',
        ])->assertRedirect();

        $this->assertSame('new@example.test', $user->refresh()->email);

        $this->asOperator()
            ->delete("/super-admin/owners/{$user->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }
}
