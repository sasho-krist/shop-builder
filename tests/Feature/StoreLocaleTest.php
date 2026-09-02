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

    public function test_the_storefront_is_bulgarian(): void
    {
        $this->get($this->url())
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('locale', 'bg')
                ->where('storefront.locale', 'bg')
                ->where('i18n.Shop', 'Магазин')
            );
    }

    public function test_an_english_cookie_is_ignored(): void
    {
        $this->withCookie('sb_locale', 'en')
            ->get($this->url())
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('locale', 'bg')
                ->where('storefront.locale', 'bg')
            );
    }

    public function test_the_marketing_site_is_bulgarian(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('locale', 'bg'));
    }

    public function test_the_admin_panel_is_bulgarian(): void
    {
        $user = User::factory()->create(['locale' => 'en']);
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
}
