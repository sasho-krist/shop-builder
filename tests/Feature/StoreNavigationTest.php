<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Page;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Theme\ThemePresets;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class StoreNavigationTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $store;

    private User $owner;

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
        $this->owner = User::factory()->create();
        $this->store->users()->attach($this->owner, ['role' => 'owner']);
        Tenant::setCurrent($this->store);
    }

    private function storefront(string $path = ''): string
    {
        return "http://acme.shop-builder.localhost/{$path}";
    }

    public function test_the_navigation_editor_renders_with_link_targets(): void
    {
        Category::create(['name' => 'Tea', 'slug' => 'tea', 'position' => 0]);
        Page::factory()->for($this->store)->create([
            'type' => 'page', 'title' => 'Contact', 'slug' => 'contact',
            'blocks' => [], 'is_published' => true,
        ]);

        $this->actingAs($this->owner)->get(route('navigation.edit'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('admin/navigation')
                ->where('targets.categories.0.value', 'tea')
                // every custom page is offered as a direct link target
                ->where('targets.pages', fn ($rows) => collect($rows)->contains(
                    fn ($r) => $r['value'] === 'contact' && $r['label'] === 'Contact',
                ))
            );
    }

    public function test_saving_navigation_persists_and_drops_blank_rows(): void
    {
        $this->actingAs($this->owner)->put(route('navigation.update'), [
            'header_links' => [
                ['label' => 'About', 'type' => 'page', 'value' => 'about'],
                ['label' => '', 'type' => 'shop', 'value' => ''],
            ],
            'footer_links' => [
                ['label' => 'Terms', 'type' => 'url', 'value' => 'https://acme.test/terms'],
            ],
            'footer_note' => 'Small-batch wellness since 2020.',
        ])->assertRedirect();

        $nav = $this->store->storeNavigation()->fresh();
        $this->assertCount(1, $nav->header_links);
        $this->assertSame('About', $nav->header_links[0]['label']);
        $this->assertSame('Small-batch wellness since 2020.', $nav->footer_note);
    }

    public function test_the_header_center_can_be_configured_and_reaches_the_storefront(): void
    {
        $this->actingAs($this->owner)->put(route('navigation.update'), [
            'header_links' => [],
            'footer_links' => [],
            'footer_note' => '',
            'header_center' => [
                'type' => 'contact',
                'phone' => '+359 88 123 4567',
                'email' => 'hi@acme.test',
                'text' => '',
            ],
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->get($this->storefront())
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('storefront.nav.center.type', 'contact')
                ->where('storefront.nav.center.phone', '+359 88 123 4567')
                ->where('storefront.nav.center.email', 'hi@acme.test')
            );
    }

    public function test_the_header_center_rejects_a_bad_email_and_hides_empty_contact(): void
    {
        $this->actingAs($this->owner)->put(route('navigation.update'), [
            'header_links' => [], 'footer_links' => [], 'footer_note' => '',
            'header_center' => ['type' => 'contact', 'email' => 'not-an-email'],
        ])->assertSessionHasErrors('header_center.email');

        $this->store->storeNavigation()->update(['header_center' => ['type' => 'contact']]);
        $this->get($this->storefront())
            ->assertInertia(fn (AssertableInertia $page) => $page->where('storefront.nav.center', null));
    }

    public function test_the_header_search_filters_the_product_listing(): void
    {
        $tea = Product::factory()->for($this->store)->create(['title' => 'Green Tea', 'status' => 'active']);
        $tea->variants()->create(['name' => 'D', 'price' => '5.00', 'stock_quantity' => 3, 'sku' => 'T1']);
        $mug = Product::factory()->for($this->store)->create(['title' => 'Ceramic Mug', 'status' => 'active']);
        $mug->variants()->create(['name' => 'D', 'price' => '9.00', 'stock_quantity' => 3, 'sku' => 'M1']);

        $this->get($this->storefront('products?q=tea'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('storefront/listing')
                ->count('products.data', 1)
                ->where('products.data.0.title', 'Green Tea')
            );
    }

    public function test_the_storefront_renders_the_custom_header_and_footer(): void
    {
        $this->store->storeNavigation()->update([
            'header_links' => [
                ['label' => 'Journal', 'type' => 'url', 'value' => 'https://acme.test/blog'],
            ],
            'footer_links' => [
                ['label' => 'Contact', 'type' => 'url', 'value' => 'mailto:hi@acme.test'],
            ],
            'footer_note' => 'Made in Sofia.',
        ]);

        $this->get($this->storefront())
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('storefront.nav.header.0.label', 'Journal')
                ->where('storefront.nav.header.0.href', 'https://acme.test/blog')
                ->where('storefront.nav.footer.0.label', 'Contact')
                ->where('storefront.nav.footerNote', 'Made in Sofia.')
            );
    }

    public function test_category_links_added_to_the_menu_render_on_the_storefront(): void
    {
        Category::create(['name' => 'Tyres', 'slug' => 'tyres', 'position' => 0]);
        Category::create(['name' => 'Parts', 'slug' => 'parts', 'position' => 1]);

        $this->store->storeNavigation()->update([
            'header_links' => [
                ['label' => 'Tyres', 'type' => 'category', 'value' => 'tyres'],
                ['label' => 'Parts', 'type' => 'category', 'value' => 'parts'],
            ],
        ]);

        $this->get($this->storefront())
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->count('storefront.nav.header', 2)
                ->where('storefront.nav.header.0.href', '/c/tyres')
                ->where('storefront.nav.header.1.href', '/c/parts')
            );
    }

    public function test_a_broken_link_target_is_dropped_from_the_storefront(): void
    {
        $this->store->storeNavigation()->update([
            'header_links' => [
                ['label' => 'Nowhere', 'type' => 'category', 'value' => ''],
                ['label' => 'Shop', 'type' => 'shop', 'value' => ''],
            ],
        ]);

        $this->get($this->storefront())
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->count('storefront.nav.header', 1)
                ->where('storefront.nav.header.0.label', 'Shop')
            );
    }

    public function test_a_published_custom_page_is_reachable_by_slug(): void
    {
        Page::factory()->for($this->store)->create([
            'type' => 'page',
            'title' => 'About us',
            'slug' => 'about',
            'blocks' => [],
            'is_published' => true,
        ]);

        $this->get($this->storefront('about'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('storefront/page')
                ->where('title', 'About us')
            );
    }

    public function test_a_draft_custom_page_is_not_reachable(): void
    {
        Page::factory()->for($this->store)->create([
            'type' => 'page',
            'title' => 'Secret',
            'slug' => 'secret',
            'blocks' => [],
            'is_published' => false,
        ]);

        $this->get($this->storefront('secret'))->assertNotFound();
        $this->get($this->storefront('does-not-exist'))->assertNotFound();
    }
}
