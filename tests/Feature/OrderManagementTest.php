<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class OrderManagementTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    private Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->user = User::factory()->create();
        $this->tenant->users()->attach($this->user, ['role' => 'owner']);
        Tenant::setCurrent($this->tenant);

        $this->order = $this->makeOrder($this->tenant);
    }

    private function makeOrder(Tenant $tenant): Order
    {
        $order = new Order([
            'number' => 1001,
            'token' => Str::random(40),
            'email' => 'buyer@example.com',
            'customer_name' => 'Test Buyer',
            'shipping_address' => ['line1' => 'x', 'city' => 'Sofia', 'postal_code' => '1000', 'country' => 'BG'],
            'subtotal' => '10.00',
            'shipping_total' => '0.00',
            'total' => '10.00',
        ]);
        $order->tenant_id = $tenant->id;
        $order->save();

        $order->lines()->create([
            'product_title' => 'Green Tea',
            'variant_name' => 'Default',
            'unit_price' => '10.00',
            'quantity' => 1,
            'subtotal' => '10.00',
        ]);

        return $order;
    }

    public function test_the_orders_index_and_detail_render(): void
    {
        $this->actingAs($this->user)->get(route('orders.index'))->assertOk();
        $this->actingAs($this->user)->get(route('orders.show', $this->order))->assertOk();
    }

    public function test_an_order_status_can_be_updated(): void
    {
        $this->actingAs($this->user)
            ->patch(route('orders.update', $this->order), [
                'status' => 'fulfilled',
                'payment_status' => 'paid',
            ])
            ->assertRedirect();

        $fresh = $this->order->fresh();
        $this->assertSame('fulfilled', $fresh->status);
        $this->assertSame('paid', $fresh->payment_status);
    }

    public function test_invalid_status_values_are_rejected(): void
    {
        $this->actingAs($this->user)
            ->patch(route('orders.update', $this->order), [
                'status' => 'shipped-to-mars',
                'payment_status' => 'paid',
            ])
            ->assertSessionHasErrors('status');
    }

    public function test_a_user_cannot_view_another_stores_order(): void
    {
        $foreign = $this->makeOrder(Tenant::factory()->create());

        $this->actingAs($this->user)
            ->get(route('orders.show', $foreign))
            ->assertNotFound();
    }
}
