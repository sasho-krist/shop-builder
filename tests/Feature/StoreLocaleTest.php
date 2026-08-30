<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Models\Tenant;
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
                ->where('storefront.locale', 'bg')
                ->where('storefront.i18n.Shop', 'Магазин')
            );
    }

    public function test_the_english_cookie_renders_the_storefront_in_english(): void
    {
        $this->withCookie('sb_locale', 'en')
            ->get($this->url())
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('storefront.locale', 'en')
                ->where('storefront.i18n', [])
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
}
