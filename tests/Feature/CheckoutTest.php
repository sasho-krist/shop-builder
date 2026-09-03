<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\Order;
use App\Models\Page;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Tenant;
use App\Support\Theme\ThemePresets;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $store;

    private ProductVariant $variant;

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

        Tenant::setCurrent($this->store);
        $product = Product::factory()->for($this->store)->create(['title' => 'Green Tea', 'status' => 'active']);
        $this->variant = $product->variants()->create(['name' => 'Default', 'price' => '9.90', 'stock_quantity' => 10, 'sku' => 'GT-1']);
        Tenant::forgetCurrent();

        $this->withUnencryptedCookie('sb_cart', 'cart-token');
    }

    private function url(string $path = ''): string
    {
        return "http://acme.shop-builder.localhost/{$path}";
    }

    private function seedCartWithItem(int $quantity = 2): void
    {
        Tenant::setCurrent($this->store);
        $cart = Cart::create(['token' => 'cart-token']);
        $cart->items()->create(['product_variant_id' => $this->variant->id, 'quantity' => $quantity]);
        Tenant::forgetCurrent();
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(): array
    {
        return [
            'email' => 'buyer@example.com',
            'customer_name' => 'Ivan Petrov',
            'phone' => '0888123456',
            'address' => [
                'line1' => '10 Main St',
                'line2' => '',
                'city' => 'Sofia',
                'postal_code' => '1000',
                'country' => 'Bulgaria',
            ],
            'notes' => 'Leave at the door',
        ];
    }

    public function test_checkout_redirects_to_the_cart_when_empty(): void
    {
        $this->get($this->url('checkout'))->assertRedirect($this->url('cart'));
    }

    public function test_checkout_renders_with_items(): void
    {
        $this->seedCartWithItem();

        $this->get($this->url('checkout'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('storefront/checkout')
                ->where('cart.subtotal', '19.80')
            );
    }

    public function test_placing_an_order_creates_it_and_clears_the_cart(): void
    {
        $this->seedCartWithItem(2);

        $response = $this->post($this->url('checkout'), $this->validPayload());

        $order = Order::query()->firstOrFail();
        $response->assertRedirect($this->url("order/{$order->token}"));

        $this->assertSame(1001, $order->number);
        $this->assertSame($this->store->id, $order->tenant_id);
        $this->assertSame('19.80', $order->subtotal);
        $this->assertSame('19.80', $order->total);
        $this->assertSame('pending', $order->status);

        $line = $order->lines()->firstOrFail();
        $this->assertSame('Green Tea', $line->product_title);
        $this->assertSame('GT-1', $line->sku);
        $this->assertSame(2, $line->quantity);

        Tenant::setCurrent($this->store);
        $this->assertSame(0, Cart::firstWhere('token', 'cart-token')->items()->count());
        Tenant::forgetCurrent();
    }

    public function test_a_failing_confirmation_email_does_not_break_the_order(): void
    {
        Mail::shouldReceive('to')
            ->andThrow(new \RuntimeException('mail server said no'));

        $this->seedCartWithItem(1);

        $response = $this->post($this->url('checkout'), $this->validPayload());

        $order = Order::query()->firstOrFail();
        $response->assertRedirect($this->url("order/{$order->token}"));
        $this->assertSame('9.90', $order->subtotal);
    }

    public function test_order_line_snapshot_survives_product_deletion(): void
    {
        $this->seedCartWithItem(1);
        $this->post($this->url('checkout'), $this->validPayload())->assertRedirect();

        Tenant::setCurrent($this->store);
        Product::query()->firstOrFail()->delete();
        $order = Order::query()->with('lines')->firstOrFail();
        Tenant::forgetCurrent();

        $this->assertSame('Green Tea', $order->lines->first()->product_title);
        $this->assertNull($order->lines->first()->product_variant_id);
    }

    public function test_the_confirmation_page_is_reachable_by_token(): void
    {
        $this->seedCartWithItem(1);
        $this->post($this->url('checkout'), $this->validPayload());
        $token = Order::query()->firstOrFail()->token;

        $this->get($this->url("order/{$token}"))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('storefront/order')
                ->where('order.number', 1001)
            );

        $this->get($this->url('order/nonsense'))->assertNotFound();
    }

    public function test_checkout_validates_the_form(): void
    {
        $this->seedCartWithItem(1);

        $this->post($this->url('checkout'), ['email' => 'not-an-email'])
            ->assertSessionHasErrors(['email', 'customer_name', 'address.line1', 'address.city']);
    }
}
