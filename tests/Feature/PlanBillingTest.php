<?php

namespace Tests\Feature;

use App\Listeners\SyncTenantPlan;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Billing\BillingGateway;
use App\Services\Billing\FakeBillingGateway;
use App\Services\Billing\MockBillingGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Laravel\Cashier\Events\WebhookHandled;
use Tests\TestCase;

class PlanBillingTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('plans.pro.stripe_price', 'price_pro_test');

        $this->tenant = Tenant::factory()->create(['plan' => 'free']);
        $this->user = User::factory()->create();
        $this->tenant->users()->attach($this->user, ['role' => 'owner']);
        Tenant::setCurrent($this->tenant);
    }

    private function createProduct(string $title): void
    {
        $this->actingAs($this->user)->post(route('products.store'), [
            'title' => $title,
            'slug' => '',
            'status' => 'active',
            'variants' => [['name' => 'Default', 'price' => '9.90', 'stock_quantity' => '5']],
        ]);
    }

    public function test_the_product_limit_of_the_free_plan_is_enforced(): void
    {
        Product::factory()->for($this->tenant)->count(15)->create();

        $this->createProduct('One too many');

        $this->assertSame(15, Product::query()->count());
        $this->assertDatabaseMissing('products', ['title' => 'One too many']);
    }

    public function test_a_higher_plan_lifts_the_product_limit(): void
    {
        $this->tenant->update(['plan' => 'pro']);
        Product::factory()->for($this->tenant)->count(15)->create();

        $this->createProduct('Sixteenth');

        $this->assertSame(16, Product::query()->count());
    }

    public function test_the_billing_page_shows_the_plan_and_usage(): void
    {
        Product::factory()->for($this->tenant)->count(3)->create();

        $this->actingAs($this->user)->get(route('billing.show'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('admin/billing')
                ->where('currentPlan', 'free')
                ->where('usage.products.used', 3)
                ->where('usage.products.limit', 15)
                ->where('billingEnabled', false)
            );
    }

    public function test_choosing_a_plan_redirects_to_the_billing_gateway(): void
    {
        $gateway = new FakeBillingGateway;
        $this->app->instance(BillingGateway::class, $gateway);

        $this->actingAs($this->user)
            ->post(route('billing.checkout'), ['plan' => 'pro'])
            ->assertRedirect('https://checkout.stripe.test/subscribe/pro');

        $this->assertSame('pro', $gateway->checkouts[0]['plan']);
    }

    public function test_the_billing_page_handles_the_checkout_return_params(): void
    {
        $this->actingAs($this->user)->get(route('billing.show').'?checkout=success')->assertOk();
        $this->actingAs($this->user)->get(route('billing.show').'?checkout=cancelled')->assertOk();
    }

    public function test_mock_checkout_subscribes_the_store_and_returns_to_billing(): void
    {
        $this->app->instance(BillingGateway::class, new MockBillingGateway);

        $this->actingAs($this->user)
            ->post(route('billing.checkout'), ['plan' => 'pro'])
            ->assertRedirect(route('billing.mock.show'));

        $this->actingAs($this->user)->get(route('billing.mock.show'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('admin/billing-mock')
                ->where('plan.key', 'pro'));

        $this->actingAs($this->user)->post(route('billing.mock.complete'))
            ->assertRedirect(route('billing.show').'?checkout=success');

        $this->assertSame('pro', $this->tenant->fresh()?->plan);
        $this->assertDatabaseHas('subscriptions', [
            'tenant_id' => $this->tenant->id,
            'stripe_status' => 'active',
            'stripe_price' => 'price_pro_test',
        ]);
    }

    public function test_mock_checkout_can_be_cancelled(): void
    {
        $this->app->instance(BillingGateway::class, new MockBillingGateway);

        $this->actingAs($this->user)->post(route('billing.checkout'), ['plan' => 'pro']);
        $this->actingAs($this->user)->post(route('billing.mock.cancel'))
            ->assertRedirect(route('billing.show').'?checkout=cancelled');

        $this->assertSame('free', $this->tenant->fresh()?->plan);
    }

    public function test_mock_portal_cancels_and_resumes_the_subscription(): void
    {
        $this->app->instance(BillingGateway::class, new MockBillingGateway);

        $this->actingAs($this->user)->post(route('billing.checkout'), ['plan' => 'pro']);
        $this->actingAs($this->user)->post(route('billing.mock.complete'));

        $this->actingAs($this->user)
            ->post(route('billing.mock.portal.action'), ['action' => 'cancel'])
            ->assertRedirect(route('billing.show'));
        $this->assertNotNull($this->tenant->subscription('default')?->ends_at);

        $this->actingAs($this->user)
            ->post(route('billing.mock.portal.action'), ['action' => 'resume'])
            ->assertRedirect(route('billing.show'));
        $this->assertNull($this->tenant->fresh()?->subscription('default')?->ends_at);
    }

    public function test_the_mock_routes_are_hidden_without_the_mock_gateway(): void
    {
        $this->app->instance(BillingGateway::class, new FakeBillingGateway);

        $this->actingAs($this->user)->get(route('billing.mock.show'))->assertNotFound();
        $this->actingAs($this->user)->post(route('billing.mock.complete'))->assertNotFound();
    }

    public function test_an_unknown_or_unpriced_plan_is_rejected(): void
    {
        $this->app->instance(BillingGateway::class, new FakeBillingGateway);

        $this->actingAs($this->user)
            ->post(route('billing.checkout'), ['plan' => 'free'])
            ->assertSessionHasErrors('plan');
    }

    public function test_billing_checkout_is_unavailable_when_the_gateway_is_off(): void
    {
        $this->app->instance(BillingGateway::class, new FakeBillingGateway(enabled: false));

        $this->actingAs($this->user)
            ->post(route('billing.checkout'), ['plan' => 'pro'])
            ->assertNotFound();
    }

    public function test_the_webhook_listener_syncs_the_plan_from_the_subscription(): void
    {
        $this->tenant->update(['stripe_id' => 'cus_test_123']);
        $this->tenant->subscriptions()->create([
            'type' => 'default',
            'stripe_id' => 'sub_test_123',
            'stripe_status' => 'active',
            'stripe_price' => 'price_pro_test',
            'quantity' => 1,
        ]);

        (new SyncTenantPlan)->handle(new WebhookHandled([
            'type' => 'customer.subscription.updated',
            'data' => ['object' => ['customer' => 'cus_test_123']],
        ]));

        $this->assertSame('pro', $this->tenant->fresh()?->plan);
    }

    public function test_the_webhook_listener_drops_back_to_free_when_the_subscription_ends(): void
    {
        $this->tenant->update(['plan' => 'pro', 'stripe_id' => 'cus_test_123']);
        $this->tenant->subscriptions()->create([
            'type' => 'default',
            'stripe_id' => 'sub_test_123',
            'stripe_status' => 'canceled',
            'stripe_price' => 'price_pro_test',
            'quantity' => 1,
            'ends_at' => now()->subDay(),
        ]);

        (new SyncTenantPlan)->handle(new WebhookHandled([
            'type' => 'customer.subscription.deleted',
            'data' => ['object' => ['customer' => 'cus_test_123']],
        ]));

        $this->assertSame('free', $this->tenant->fresh()?->plan);
    }
}
