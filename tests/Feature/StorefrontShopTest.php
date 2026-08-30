<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Page;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\Theme;
use App\Support\Theme\ThemePresets;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class StorefrontShopTest extends TestCase
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

    private function product(string $title, string $price = '10.00', int $stock = 5): Product
    {
        Tenant::setCurrent($this->store);
        $product = Product::factory()->for($this->store)->create(['title' => $title, 'status' => 'active']);
        $product->variants()->create(['name' => 'Default', 'price' => $price, 'stock_quantity' => $stock]);
        Tenant::forgetCurrent();

        return $product;
    }

    private function url(string $path = ''): string
    {
        return "http://acme.shop-builder.localhost/{$path}";
    }

    public function test_the_product_listing_only_shows_active_products(): void
    {
        $this->product('Green Tea');
        Tenant::setCurrent($this->store);
        Product::factory()->for($this->store)->create(['title' => 'Hidden Draft', 'status' => 'draft']);
        Tenant::forgetCurrent();

        $this->get($this->url('products'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('storefront/listing')
                ->where('products.data', fn ($rows) => count($rows) === 1)
            );
    }

    public function test_a_product_detail_page_renders(): void
    {
        $product = $this->product('Omega 3');

        $this->get($this->url("p/{$product->slug}"))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('storefront/product')
                ->where('product.title', 'Omega 3')
                ->where('product.variants.0.in_stock', true)
            );
    }

    public function test_a_draft_products_detail_page_is_404(): void
    {
        Tenant::setCurrent($this->store);
        $product = Product::factory()->for($this->store)->create(['status' => 'draft']);
        Tenant::forgetCurrent();

        $this->get($this->url("p/{$product->slug}"))->assertNotFound();
    }

    public function test_items_can_be_added_updated_and_removed_from_the_cart(): void
    {
        $product = $this->product('Vitamin C', '12.50');
        Tenant::setCurrent($this->store);
        $variant = $product->variants()->firstOrFail();
        $cart = Cart::create(['token' => 'test-token']);
        Tenant::forgetCurrent();

        $this->withUnencryptedCookie('sb_cart', 'test-token');

        $this->post($this->url('cart'), ['variant_id' => $variant->id, 'quantity' => 2])
            ->assertRedirect();

        $this->get($this->url('cart'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('storefront/cart')
                ->where('cart.count', 2)
                ->where('cart.subtotal', '25.00')
            );

        Tenant::setCurrent($this->store);
        $itemId = $cart->items()->firstOrFail()->id;
        Tenant::forgetCurrent();

        $this->patch($this->url("cart/{$itemId}"), ['quantity' => 1])->assertRedirect();
        $this->get($this->url('cart'))
            ->assertInertia(fn (AssertableInertia $page) => $page->where('cart.subtotal', '12.50'));

        $this->delete($this->url("cart/{$itemId}"))->assertRedirect();
        $this->get($this->url('cart'))
            ->assertInertia(fn (AssertableInertia $page) => $page->where('cart.count', 0));
    }

    public function test_a_cart_cannot_hold_another_stores_variant(): void
    {
        $other = Tenant::factory()->create(['slug' => 'other']);
        Tenant::setCurrent($other);
        $foreignProduct = Product::factory()->for($other)->create(['status' => 'active']);
        $foreignVariant = $foreignProduct->variants()->create(['name' => 'Default', 'price' => 5, 'stock_quantity' => 5]);
        Tenant::forgetCurrent();

        $this->post($this->url('cart'), ['variant_id' => $foreignVariant->id, 'quantity' => 1])
            ->assertNotFound();
    }

    public function test_the_home_page_renders_saved_blocks(): void
    {
        $page = Page::query()->where('tenant_id', $this->store->id)->where('type', 'home')->first();
        $page->update(['blocks' => [
            ['id' => 'h1', 'type' => 'hero', 'props' => ['heading' => 'Welcome']],
        ]]);

        $this->get($this->url())
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('storefront/home')
                ->where('blocks.0.type', 'hero')
                ->where('storefront.storeName', $this->store->name)
            );
    }

    public function test_a_category_page_lists_its_products(): void
    {
        $product = $this->product('Chamomile Tea');
        Tenant::setCurrent($this->store);
        $category = Category::factory()->for($this->store)->create(['slug' => 'teas', 'name' => 'Teas']);
        $product->categories()->attach($category);
        Product::factory()->for($this->store)->create(['title' => 'Not in category', 'status' => 'active']);
        Tenant::forgetCurrent();

        $this->get($this->url('c/teas'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('storefront/listing')
                ->where('heading', 'Teas')
                ->where('products.data', fn ($rows) => count($rows) === 1)
            );
    }

    public function test_a_collection_page_lists_its_products(): void
    {
        $product = $this->product('Featured Item');
        Tenant::setCurrent($this->store);
        $collection = Collection::factory()->for($this->store)->create(['slug' => 'best', 'title' => 'Best', 'is_visible' => true]);
        $collection->products()->attach($product, ['position' => 0]);
        Tenant::forgetCurrent();

        $this->get($this->url('collections/best'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('storefront/listing')
                ->where('heading', 'Best')
            );
    }

    public function test_a_hidden_collection_page_is_404(): void
    {
        Tenant::setCurrent($this->store);
        Collection::factory()->for($this->store)->create(['slug' => 'secret', 'is_visible' => false]);
        Tenant::forgetCurrent();

        $this->get($this->url('collections/secret'))->assertNotFound();
    }

    public function test_the_storefront_falls_back_to_a_default_theme_without_one(): void
    {
        Theme::query()->where('tenant_id', $this->store->id)->delete();

        $this->get($this->url())
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('storefront.theme.colors.primary')
            );
    }
}
