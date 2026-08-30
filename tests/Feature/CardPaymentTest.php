<?php

namespace Tests\Feature;

use App\Mail\OrderPlaced;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Page;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Tenant;
use App\Services\Payments\FakePaymentGateway;
use App\Services\Payments\PaymentGateway;
use App\Support\Theme\ThemePresets;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class CardPaymentTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $store;

    private ProductVariant $variant;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();

        $this->store = Tenant::factory()->create(['slug' => 'acme', 'name' => 'Acme', 'plan' => 'pro']);
        Page::factory()->for($this->store)->home()->create(['blocks' => []]);
        $this->store->themes()->create([
            'name' => 'Default',
            'tokens' => ThemePresets::minimal(),
            'is_active' => true,
        ]);

        Tenant::setCurrent($this->store);
        $product = Product::factory()->for($this->store)->create(['title' => 'Green Tea', 'status' => 'active']);
        $this->variant = $product->variants()->create(['name' => 'Default', 'price' => '9.90', 'stock_quantity' => 10, 'sku' => 'GT-1']);
        $cart = Cart::create(['token' => 'cart-token']);
        $cart->items()->create(['product_variant_id' => $this->variant->id, 'quantity' => 1]);
        Tenant::forgetCurrent();

        $this->withUnencryptedCookie('sb_cart', 'cart-token');
    }

    private function url(string $path = ''): string
    {
        return "http://acme.shop-builder.localhost/{$path}";
    }

    private function enableGateway(): FakePaymentGateway
    {
        $gateway = new FakePaymentGateway;
        $this->app->instance(PaymentGateway::class, $gateway);

        return $gateway;
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(string $method): array
    {
        return [
            'payment_method' => $method,
            'email' => 'buyer@example.com',
            'customer_name' => 'Ivan Petrov',
            'address' => [
                'line1' => '10 Main St', 'line2' => '',
                'city' => 'Sofia', 'postal_code' => '1000', 'country' => 'Bulgaria',
            ],
        ];
    }

    public function test_card_is_offered_only_when_the_gateway_is_configured(): void
    {
        $this->get($this->url('checkout'))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('cardPaymentsEnabled', false)
            );

        $this->enableGateway();

        $this->get($this->url('checkout'))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('cardPaymentsEnabled', true)
            );
    }

    public function test_card_payment_is_rejected_when_the_gateway_is_off(): void
    {
        $this->post($this->url('checkout'), $this->payload('card'))
            ->assertSessionHasErrors('payment_method');

        $this->assertSame(0, Order::query()->count());
    }

    public function test_a_free_plan_store_cannot_offer_card_payments(): void
    {
        $this->store->update(['plan' => 'free']);
        $this->enableGateway();

        $this->get($this->url('checkout'))
            ->assertInertia(fn (AssertableInertia $page) => $page->where('cardPaymentsEnabled', false));

        $this->post($this->url('checkout'), $this->payload('card'))
            ->assertSessionHasErrors('payment_method');
    }

    public function test_a_card_order_creates_a_pending_payment_and_redirects_to_the_gateway(): void
    {
        $gateway = $this->enableGateway();

        $response = $this->post($this->url('checkout'), $this->payload('card'));

        Tenant::setCurrent($this->store);
        $order = Order::query()->firstOrFail();
        $payment = Payment::query()->firstOrFail();
        Tenant::forgetCurrent();

        $this->assertSame('card', $order->payment_method);
        $this->assertSame('unpaid', $order->payment_status);
        $this->assertSame('pending', $payment->status);
        $this->assertSame("cs_test_{$order->token}", $payment->provider_ref);
        $this->assertSame('9.90', $payment->amount);

        $response->assertRedirect("https://checkout.stripe.test/cs_test_{$order->token}");
        $this->assertSame($this->url("order/{$order->token}"), $gateway->sessions[0]['success_url']);

        // The cart survives until Stripe confirms; no email until then either.
        Tenant::setCurrent($this->store);
        $this->assertSame(1, Cart::firstWhere('token', 'cart-token')->items()->count());
        Tenant::forgetCurrent();
        Mail::assertNothingSent();
    }

    public function test_submitting_card_checkout_again_resumes_the_same_order(): void
    {
        $this->enableGateway();

        $this->post($this->url('checkout'), $this->payload('card'));
        $first = Order::query()->firstOrFail()->token;

        $this->post($this->url('checkout'), $this->payload('card'))
            ->assertRedirect("https://checkout.stripe.test/cs_test_{$first}");

        $this->assertSame(1, Order::query()->count());
    }

    public function test_the_confirmation_page_empties_the_cart_for_a_card_order(): void
    {
        $this->enableGateway();
        $this->post($this->url('checkout'), $this->payload('card'));

        Tenant::setCurrent($this->store);
        $token = Order::query()->firstOrFail()->token;
        Tenant::forgetCurrent();

        $this->get($this->url("order/{$token}"))->assertOk();

        Tenant::setCurrent($this->store);
        $this->assertSame(0, Cart::firstWhere('token', 'cart-token')->items()->count());
        Tenant::forgetCurrent();
    }

    public function test_the_webhook_marks_the_order_paid_and_sends_the_email(): void
    {
        $this->enableGateway();
        $this->post($this->url('checkout'), $this->payload('card'));

        Tenant::setCurrent($this->store);
        $order = Order::query()->firstOrFail();
        Tenant::forgetCurrent();

        $this->postJson('http://shop-builder.localhost/stripe/webhook', [
            'type' => 'checkout.session.completed',
            'session_id' => "cs_test_{$order->token}",
            'paid' => true,
        ], ['Stripe-Signature' => 'valid'])->assertOk();

        Tenant::setCurrent($this->store);
        $order->refresh();
        $payment = Payment::query()->firstOrFail();
        Tenant::forgetCurrent();

        $this->assertSame('paid', $order->payment_status);
        $this->assertSame('paid', $order->status);
        $this->assertSame('paid', $payment->status);
        Mail::assertSent(OrderPlaced::class, fn (OrderPlaced $mail) => $mail->hasTo('buyer@example.com'));
    }

    public function test_the_webhook_rejects_an_invalid_signature(): void
    {
        $this->enableGateway();
        $this->post($this->url('checkout'), $this->payload('card'));

        Tenant::setCurrent($this->store);
        $order = Order::query()->firstOrFail();
        Tenant::forgetCurrent();

        $this->postJson('http://shop-builder.localhost/stripe/webhook', [
            'session_id' => "cs_test_{$order->token}",
        ], ['Stripe-Signature' => 'nope'])->assertStatus(400);

        Tenant::setCurrent($this->store);
        $this->assertSame('unpaid', $order->refresh()->payment_status);
        Tenant::forgetCurrent();
    }

    public function test_offline_checkout_still_works_with_the_gateway_enabled(): void
    {
        $this->enableGateway();

        $this->post($this->url('checkout'), $this->payload('offline'))
            ->assertRedirect();

        Tenant::setCurrent($this->store);
        $order = Order::query()->firstOrFail();
        Tenant::forgetCurrent();

        $this->assertSame('offline', $order->payment_method);
        $this->assertSame(0, Payment::query()->count());
        Mail::assertSent(OrderPlaced::class);
    }
}
