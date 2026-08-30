<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Theme\ThemePresets;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class StoreLocaleTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $store;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Tenant::factory()->create(['slug' => 'acme']);
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

    public function test_the_storefront_is_bulgarian_by_default(): void
    {
        $this->get($this->url())
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('locale', 'bg')
                ->where('storefront.locale', 'bg')
                ->where('i18n.Shop', 'Магазин')
            );
    }

    public function test_the_english_cookie_renders_the_storefront_in_english(): void
    {
        $expected = json_decode(
            (string) file_get_contents(lang_path('en.json')),
            true,
        );

        $this->withCookie('sb_locale', 'en')
            ->get($this->url())
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('locale', 'en')
                ->where('storefront.locale', 'en')
                ->where('i18n', $expected)
            );
    }

    public function test_the_switcher_stores_the_chosen_locale_in_a_cookie(): void
    {
        $this->get($this->url('locale/en'))
            ->assertRedirect()
            ->assertCookie('sb_locale', 'en');
    }

    public function test_an_unknown_locale_falls_back_to_bulgarian(): void
    {
        $this->withCookie('sb_locale', 'fr')
            ->get($this->url())
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('storefront.locale', 'bg')
            );

        $this->get($this->url('locale/fr'))
            ->assertCookie('sb_locale', 'bg');
    }

    public function test_the_admin_panel_follows_the_users_locale_preference(): void
    {
        $user = User::factory()->create(['locale' => 'bg']);
        $this->store->users()->attach($user, ['role' => 'owner']);

        $this->actingAs($user)
            ->withSession(['active_tenant_id' => $this->store->id])
            ->get('http://shop-builder.localhost/dashboard')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('locale', 'bg')
                ->where('i18n.Dashboard', 'Табло')
            );
    }

    public function test_a_user_can_switch_the_admin_language(): void
    {
        $user = User::factory()->create(['locale' => 'bg']);

        $this->actingAs($user)
            ->patch('http://shop-builder.localhost/settings/locale', ['locale' => 'en'])
            ->assertRedirect();

        $this->assertSame('en', $user->fresh()->locale);
    }
}
