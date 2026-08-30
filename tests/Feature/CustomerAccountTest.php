<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Page;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Tenant;
use App\Support\Theme\ThemePresets;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class CustomerAccountTest extends TestCase
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

    private function makeCustomer(string $email = 'jane@example.com'): Customer
    {
        Tenant::setCurrent($this->store);
        $customer = Customer::create(['name' => 'Jane Doe', 'email' => $email, 'password' => 'password123']);
        Tenant::forgetCurrent();

        return $customer;
    }

    public function test_a_visitor_can_register_and_is_logged_in(): void
    {
        $response = $this->post($this->url('account/register'), [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertRedirect($this->url('account'));

        Tenant::setCurrent($this->store);
        $customer = Customer::query()->firstOrFail();
        Tenant::forgetCurrent();

        $this->assertSame('jane@example.com', $customer->email);
        $this->assertSame($this->store->id, $customer->tenant_id);
        $this->assertTrue(Hash::check('password123', $customer->password));
        $this->assertAuthenticatedAs($customer, 'customer');
    }

    public function test_registration_rejects_a_duplicate_email_within_the_store(): void
    {
        $this->makeCustomer();

        $this->post($this->url('account/register'), [
            'name' => 'Someone Else',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertSessionHasErrors('email');
    }

    public function test_a_customer_can_log_in_and_out(): void
    {
        $customer = $this->makeCustomer();

        $this->post($this->url('account/login'), [
            'email' => 'jane@example.com',
            'password' => 'password123',
        ])->assertRedirect($this->url('account'));

        $this->assertAuthenticatedAs($customer, 'customer');

        $this->post($this->url('account/logout'))->assertRedirect(rtrim($this->url(), '/'));
        $this->assertGuest('customer');
    }

    public function test_login_fails_with_bad_credentials(): void
    {
        $this->makeCustomer();

        $this->post($this->url('account/login'), [
            'email' => 'jane@example.com',
            'password' => 'wrong-password',
        ])->assertSessionHasErrors('email');

        $this->assertGuest('customer');
    }

    public function test_the_account_page_requires_authentication(): void
    {
        $this->get($this->url('account'))->assertRedirect($this->url('account/login'));
    }

    public function test_the_account_page_lists_the_customers_orders(): void
    {
        $customer = $this->makeCustomer();

        Tenant::setCurrent($this->store);
        $order = Order::create([
            'customer_id' => $customer->id,
            'number' => 1001,
            'token' => 'order-token',
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'payment_method' => 'offline',
            'email' => $customer->email,
            'customer_name' => $customer->name,
            'shipping_address' => ['line1' => 'x', 'city' => 'Sofia', 'postal_code' => '1000', 'country' => 'Bulgaria'],
            'subtotal' => '9.90',
            'shipping_total' => '0.00',
            'tax_total' => '0.00',
            'total' => '9.90',
            'currency' => 'BGN',
        ]);
        Tenant::forgetCurrent();

        $this->actingAs($customer, 'customer')
            ->get($this->url('account'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('storefront/account')
                ->where('customer.email', 'jane@example.com')
                ->where('orders.0.number', $order->number)
                ->where('orders.0.token', 'order-token')
            );
    }

    public function test_checkout_links_the_order_to_the_authenticated_customer(): void
    {
        $customer = $this->makeCustomer();

        Tenant::setCurrent($this->store);
        $cart = Cart::create(['token' => 'cart-token']);
        $cart->items()->create(['product_variant_id' => $this->variant->id, 'quantity' => 1]);
        Tenant::forgetCurrent();

        $this->actingAs($customer, 'customer')->post($this->url('checkout'), [
            'email' => 'jane@example.com',
            'customer_name' => 'Jane Doe',
            'address' => [
                'line1' => '10 Main St',
                'line2' => '',
                'city' => 'Sofia',
                'postal_code' => '1000',
                'country' => 'Bulgaria',
            ],
        ])->assertRedirect();

        Tenant::setCurrent($this->store);
        $order = Order::query()->firstOrFail();
        Tenant::forgetCurrent();

        $this->assertSame($customer->id, $order->customer_id);
    }

    public function test_customers_are_isolated_per_store(): void
    {
        $this->makeCustomer('shared@example.com');

        $other = Tenant::factory()->create(['slug' => 'other', 'name' => 'Other']);
        Page::factory()->for($other)->home()->create(['blocks' => []]);
        $other->themes()->create(['name' => 'Default', 'tokens' => ThemePresets::minimal(), 'is_active' => true]);

        // The same email registers cleanly on a different store.
        $this->post('http://other.shop-builder.localhost/account/register', [
            'name' => 'Different Person',
            'email' => 'shared@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertRedirect('http://other.shop-builder.localhost/account');

        $this->assertSame(2, Customer::withoutGlobalScopes()->where('email', 'shared@example.com')->count());
    }
}
