<?php

namespace Tests\Feature;

use App\Mail\OrderPlaced;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Page;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Theme\ThemePresets;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class StoreSettingsTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create(['slug' => 'acme']);
        $this->user = User::factory()->create();
        $this->tenant->users()->attach($this->user, ['role' => 'owner']);
        Tenant::setCurrent($this->tenant);

        Page::factory()->for($this->tenant)->home()->create(['blocks' => []]);
        $this->tenant->themes()->create([
            'name' => 'Default',
            'tokens' => ThemePresets::minimal(),
            'is_active' => true,
        ]);
        $this->tenant->settings()->create([]);
    }

    public function test_the_settings_page_renders(): void
    {
        $this->actingAs($this->user)->get(route('store-settings.edit'))->assertOk();
    }

    public function test_settings_can_be_saved(): void
    {
        $this->actingAs($this->user)
            ->put(route('store-settings.update'), [
                'currency' => 'EUR',
                'currency_symbol' => '€',
                'store_email' => 'shop@acme.test',
                'shipping_flat' => '4.99',
                'free_shipping_over' => '50',
                'tax_rate' => '20',
                'tax_included' => false,
            ])
            ->assertRedirect();

        $settings = $this->tenant->settings()->firstOrFail();
        $this->assertSame('EUR', $settings->currency);
        $this->assertSame('4.99', $settings->shipping_flat);
        $this->assertFalse($settings->tax_included);
    }

    public function test_invalid_settings_are_rejected(): void
    {
        $this->actingAs($this->user)
            ->put(route('store-settings.update'), [
                'currency' => 'TOOLONG',
                'currency_symbol' => 'x',
                'shipping_flat' => '-1',
                'tax_rate' => '150',
            ])
            ->assertSessionHasErrors(['currency', 'shipping_flat', 'tax_rate']);
    }

    public function test_shipping_and_tax_are_applied_at_checkout(): void
    {
        Mail::fake();

        $this->tenant->settings()->update([
            'shipping_flat' => '5.00',
            'free_shipping_over' => '100',
            'tax_rate' => '20',
            'tax_included' => false,
            'currency' => 'EUR',
        ]);

        $product = Product::factory()->for($this->tenant)->create(['status' => 'active']);
        $variant = $product->variants()->create(['name' => 'Default', 'price' => '10.00', 'stock_quantity' => 5]);

        $cart = Cart::create(['token' => 'ck']);
        $cart->items()->create(['product_variant_id' => $variant->id, 'quantity' => 3]);
        Tenant::forgetCurrent();

        $this->withUnencryptedCookie('sb_cart', 'ck')
            ->post('http://acme.shop-builder.localhost/checkout', [
                'email' => 'b@b.test',
                'customer_name' => 'Buyer',
                'address' => [
                    'line1' => 'x', 'line2' => '',
                    'city' => 'Sofia', 'postal_code' => '1000', 'country' => 'BG',
                ],
            ])
            ->assertRedirect();

        $order = Order::query()->firstOrFail();
        // subtotal 30.00, under 100 so shipping 5.00, tax 20% of 30 = 6.00
        $this->assertSame('30.00', $order->subtotal);
        $this->assertSame('5.00', $order->shipping_total);
        $this->assertSame('6.00', $order->tax_total);
        $this->assertSame('41.00', $order->total);
        $this->assertSame('EUR', $order->currency);

        Mail::assertSent(OrderPlaced::class, fn (OrderPlaced $mail) => $mail->hasTo('b@b.test'));
    }

    public function test_free_shipping_threshold_removes_the_shipping_cost(): void
    {
        Mail::fake();

        $this->tenant->settings()->update(['shipping_flat' => '5.00', 'free_shipping_over' => '20']);

        $product = Product::factory()->for($this->tenant)->create(['status' => 'active']);
        $variant = $product->variants()->create(['name' => 'Default', 'price' => '25.00', 'stock_quantity' => 5]);
        $cart = Cart::create(['token' => 'ck2']);
        $cart->items()->create(['product_variant_id' => $variant->id, 'quantity' => 1]);
        Tenant::forgetCurrent();

        $this->withUnencryptedCookie('sb_cart', 'ck2')
            ->post('http://acme.shop-builder.localhost/checkout', [
                'email' => 'b@b.test',
                'customer_name' => 'Buyer',
                'address' => ['line1' => 'x', 'city' => 'S', 'postal_code' => '1', 'country' => 'BG'],
            ]);

        $this->assertSame('0.00', Order::query()->firstOrFail()->shipping_total);
    }
}
