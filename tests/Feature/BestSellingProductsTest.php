<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class BestSellingProductsTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        Tenant::setCurrent($this->tenant);
    }

    private function product(string $title): Product
    {
        $product = Product::factory()->for($this->tenant)->create([
            'title' => $title,
            'status' => 'active',
        ]);
        $product->variants()->create([
            'name' => 'Default',
            'price' => '10.00',
            'stock_quantity' => 100,
        ]);

        return $product;
    }

    private function sell(Product $product, int $quantity, string $status = 'paid'): void
    {
        $order = new Order([
            'number' => random_int(1000, 999999),
            'token' => Str::random(40),
            'status' => $status,
            'email' => 'buyer@example.com',
            'customer_name' => 'Buyer',
            'shipping_address' => ['line1' => 'x', 'city' => 'Sofia', 'postal_code' => '1000', 'country' => 'BG'],
            'subtotal' => '10.00',
            'shipping_total' => '0.00',
            'total' => '10.00',
        ]);
        $order->tenant_id = $this->tenant->id;
        $order->save();

        $order->lines()->create([
            'product_variant_id' => $product->variants()->firstOrFail()->id,
            'product_title' => $product->title,
            'variant_name' => 'Default',
            'unit_price' => '10.00',
            'quantity' => $quantity,
            'subtotal' => '10.00',
        ]);
    }

    public function test_it_ranks_products_by_units_sold_excluding_cancelled_orders(): void
    {
        $quiet = $this->product('Quiet');
        $popular = $this->product('Popular');
        $modest = $this->product('Modest');

        $this->sell($popular, 5, 'pending');
        $this->sell($popular, 3, 'fulfilled');
        $this->sell($modest, 4);
        $this->sell($modest, 9, 'cancelled'); // cancelled — ignored
        // $quiet never sells

        $ranked = Product::query()->bestSelling()->pluck('title')->all();

        $this->assertSame(['Popular', 'Modest', 'Quiet'], $ranked);
    }

    public function test_best_sellers_do_not_leak_across_tenants(): void
    {
        $mine = $this->product('Mine');
        $this->sell($mine, 4);

        $other = Tenant::factory()->create();
        Tenant::setCurrent($other);
        $theirs = Product::factory()->for($other)->create(['title' => 'Theirs', 'status' => 'active']);
        $theirs->variants()->create(['name' => 'Default', 'price' => '10.00', 'stock_quantity' => 100]);

        Tenant::setCurrent($this->tenant);

        $titles = Product::query()->bestSelling()->pluck('title')->all();

        $this->assertSame(['Mine'], $titles);
    }
}
