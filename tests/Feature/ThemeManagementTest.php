<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\Theme;
use App\Models\User;
use App\Support\Theme\ThemePresets;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class ThemeManagementTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    private Theme $theme;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->user = User::factory()->create();
        $this->tenant->users()->attach($this->user, ['role' => 'owner']);
        Tenant::setCurrent($this->tenant);

        $this->theme = Theme::factory()->for($this->tenant)->active()->create(['name' => 'Default']);
    }

    public function test_the_themes_index_and_editor_render(): void
    {
        $this->actingAs($this->user)->get(route('themes.index'))->assertOk();
        $this->actingAs($this->user)->get(route('themes.edit', $this->theme))->assertOk();
    }

    public function test_a_theme_is_created_from_a_preset_and_is_not_active(): void
    {
        $this->actingAs($this->user)
            ->post(route('themes.store'), ['name' => 'Winter', 'preset' => 'bold'])
            ->assertRedirect();

        $created = Theme::firstWhere('name', 'Winter');
        $this->assertNotNull($created);
        $this->assertFalse($created->is_active);
        $this->assertSame(ThemePresets::bold()['colors'], $created->tokens['colors']);
    }

    public function test_theme_tokens_can_be_updated(): void
    {
        $tokens = ThemePresets::minimal();
        $tokens['colors']['primary'] = '#abcdef';
        $tokens['radius'] = 20;

        $this->actingAs($this->user)
            ->put(route('themes.update', $this->theme), ['name' => 'Renamed', 'tokens' => $tokens])
            ->assertRedirect();

        $fresh = $this->theme->fresh();
        $this->assertSame('Renamed', $fresh->name);
        $this->assertSame('#abcdef', $fresh->tokens['colors']['primary']);
        $this->assertSame(20, $fresh->tokens['radius']);
    }

    public function test_invalid_tokens_are_rejected(): void
    {
        $tokens = ThemePresets::minimal();
        $tokens['colors']['primary'] = 'red';
        $tokens['typography']['headingFont'] = 'Comic Sans';
        $tokens['radius'] = 999;

        $this->actingAs($this->user)
            ->put(route('themes.update', $this->theme), ['name' => 'X', 'tokens' => $tokens])
            ->assertSessionHasErrors([
                'tokens.colors.primary',
                'tokens.typography.headingFont',
                'tokens.radius',
            ]);
    }

    public function test_activating_a_theme_deactivates_the_others(): void
    {
        $other = Theme::factory()->for($this->tenant)->create();

        $this->actingAs($this->user)
            ->post(route('themes.activate', $other))
            ->assertRedirect();

        $this->assertTrue($other->fresh()->is_active);
        $this->assertFalse($this->theme->fresh()->is_active);
    }

    public function test_the_last_theme_cannot_be_deleted(): void
    {
        $this->actingAs($this->user)
            ->delete(route('themes.destroy', $this->theme))
            ->assertSessionHasErrors('theme');

        $this->assertDatabaseHas('themes', ['id' => $this->theme->id]);
    }

    public function test_deleting_the_active_theme_promotes_another(): void
    {
        $other = Theme::factory()->for($this->tenant)->create();

        $this->actingAs($this->user)
            ->delete(route('themes.destroy', $this->theme))
            ->assertRedirect(route('themes.index', absolute: false));

        $this->assertDatabaseMissing('themes', ['id' => $this->theme->id]);
        $this->assertTrue($other->fresh()->is_active);
    }

    public function test_a_user_cannot_edit_another_tenants_theme(): void
    {
        $foreign = Theme::factory()->for(Tenant::factory())->create();

        $this->actingAs($this->user)
            ->get(route('themes.edit', $foreign))
            ->assertNotFound();
    }

    public function test_onboarding_creates_a_default_active_theme(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('onboarding.store'), [
            'name' => 'New Store',
            'slug' => 'new-store',
        ]);

        $tenant = Tenant::firstWhere('slug', 'new-store');
        $this->assertNotNull($tenant);
        $this->assertDatabaseHas('themes', [
            'tenant_id' => $tenant->id,
            'name' => 'Default',
            'is_active' => true,
        ]);
    }

    public function test_the_storefront_uses_the_active_theme(): void
    {
        Tenant::forgetCurrent();
        $store = Tenant::factory()->create(['slug' => 'acme']);

        $tokens = ThemePresets::minimal();
        $tokens['colors']['primary'] = '#ff0000';
        $store->themes()->create(['name' => 'Custom', 'tokens' => $tokens, 'is_active' => true]);

        $this->get('http://acme.shop-builder.localhost/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('storefront/coming-soon')
                ->where('theme.colors.primary', '#ff0000')
            );
    }
}
