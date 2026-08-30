<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Theme\ThemePresets;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class StoreAdminEntryTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $store;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Tenant::factory()->create(['slug' => 'acme', 'name' => 'Acme']);
        Page::factory()->for($this->store)->home()->create(['blocks' => []]);
        $this->store->themes()->create([
            'name' => 'Default',
            'tokens' => ThemePresets::minimal(),
            'is_active' => true,
        ]);
    }

    private function url(string $path = ''): string
    {
        return "http://acme.shop-builder.localhost/{$path}";
    }

    private function dashboard(): string
    {
        return rtrim((string) config('app.url'), '/').'/dashboard';
    }

    public function test_a_visitor_sees_the_owner_entry_screen(): void
    {
        $this->get($this->url('admin'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('storefront/admin-entry')
                ->where('storeName', 'Acme')
            );
    }

    public function test_an_existing_owner_is_sent_straight_to_the_dashboard(): void
    {
        $owner = User::factory()->create();
        $this->store->users()->attach($owner, ['role' => 'owner']);

        $this->actingAs($owner)->get($this->url('admin'))
            ->assertRedirect($this->dashboard());
    }

    public function test_registering_creates_an_owner_and_signs_them_in(): void
    {
        $response = $this->post($this->url('admin/register'), [
            'name' => 'New Owner',
            'email' => 'new@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertRedirect($this->dashboard());

        $user = User::query()->where('email', 'new@example.com')->firstOrFail();
        $this->assertTrue($this->store->users()->whereKey($user->id)->exists());
        $this->assertAuthenticatedAs($user);
        $this->assertSame($this->store->id, session('active_tenant_id'));
    }

    public function test_registering_with_an_existing_email_is_rejected(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->post($this->url('admin/register'), [
            'name' => 'X',
            'email' => 'taken@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertSessionHasErrors('email');
    }

    public function test_an_owner_can_sign_in_at_the_store_admin(): void
    {
        $owner = User::factory()->create(['password' => bcrypt('secret-pass')]);
        $this->store->users()->attach($owner, ['role' => 'owner']);

        $this->post($this->url('admin/login'), [
            'email' => $owner->email,
            'password' => 'secret-pass',
        ])->assertRedirect($this->dashboard());

        $this->assertAuthenticatedAs($owner);
        $this->assertSame($this->store->id, session('active_tenant_id'));
    }

    public function test_a_valid_account_that_does_not_manage_this_store_is_refused(): void
    {
        $stranger = User::factory()->create(['password' => bcrypt('secret-pass')]);

        $this->post($this->url('admin/login'), [
            'email' => $stranger->email,
            'password' => 'secret-pass',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }
}
