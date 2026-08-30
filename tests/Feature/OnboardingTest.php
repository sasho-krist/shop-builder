<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OnboardingTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_without_a_store_is_sent_from_the_dashboard_to_onboarding(): void
    {
        $response = $this->actingAs(User::factory()->create())->get('/dashboard');

        $response->assertRedirect(route('onboarding.create', absolute: false));
    }

    public function test_user_without_a_store_can_view_the_onboarding_screen(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('onboarding.create'))
            ->assertOk();
    }

    public function test_user_can_create_a_store_and_becomes_its_owner(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('onboarding.store'), [
            'name' => 'Acme Supplies',
            'slug' => 'acme',
        ]);

        $response->assertRedirect(route('dashboard', absolute: false));

        $tenant = Tenant::firstWhere('slug', 'acme');
        $this->assertNotNull($tenant);
        $this->assertSame('Acme Supplies', $tenant->name);
        $this->assertSame('owner', $tenant->users()->firstWhere('user_id', $user->id)->pivot->role);
    }

    public function test_reserved_slugs_are_rejected(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('onboarding.store'), ['name' => 'Www', 'slug' => 'www'])
            ->assertSessionHasErrors('slug');

        $this->assertDatabaseCount('tenants', 0);
    }

    public function test_slug_must_be_unique(): void
    {
        Tenant::factory()->create(['slug' => 'acme']);

        $this->actingAs(User::factory()->create())
            ->post(route('onboarding.store'), ['name' => 'Acme Two', 'slug' => 'acme'])
            ->assertSessionHasErrors('slug');
    }

    public function test_user_who_already_has_a_store_is_redirected_away_from_onboarding(): void
    {
        $user = User::factory()->create();
        Tenant::factory()->create()->users()->attach($user, ['role' => 'owner']);

        $this->actingAs($user)
            ->get(route('onboarding.create'))
            ->assertRedirect(route('dashboard', absolute: false));

        $this->actingAs($user)
            ->post(route('onboarding.store'), ['name' => 'Second', 'slug' => 'second'])
            ->assertRedirect(route('dashboard', absolute: false));

        $this->assertDatabaseMissing('tenants', ['slug' => 'second']);
    }
}
