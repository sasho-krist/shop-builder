<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductManagementTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->user = User::factory()->create();
        $this->tenant->users()->attach($this->user, ['role' => 'owner']);

        Tenant::setCurrent($this->tenant);
    }

    public function test_the_products_index_renders(): void
    {
        $this->actingAs($this->user)->get(route('products.index'))->assertOk();
    }

    public function test_a_product_is_created_with_its_variants(): void
    {
        $response = $this->actingAs($this->user)->post(route('products.store'), [
            'title' => 'Vitamin C 1000mg',
            'slug' => '',
            'status' => 'active',
            'variants' => [
                ['name' => '60 caps', 'price' => '19.90', 'stock_quantity' => '25'],
                ['name' => '120 caps', 'price' => '34.50', 'stock_quantity' => '10'],
            ],
        ]);

        $response->assertRedirect(route('products.index', absolute: false));

        $this->assertDatabaseHas('products', [
            'tenant_id' => $this->tenant->id,
            'title' => 'Vitamin C 1000mg',
            'slug' => 'vitamin-c-1000mg',
            'status' => 'active',
        ]);
        $this->assertDatabaseCount('product_variants', 2);
        $this->assertDatabaseHas('product_variants', [
            'tenant_id' => $this->tenant->id,
            'name' => '120 caps',
            'position' => 1,
        ]);

        $product = Product::firstWhere('slug', 'vitamin-c-1000mg');
        $this->assertSame('34.50', $product->variants->firstWhere('name', '120 caps')->price);
    }

    public function test_a_product_requires_a_title_and_at_least_one_variant(): void
    {
        $this->actingAs($this->user)
            ->post(route('products.store'), ['status' => 'draft', 'variants' => []])
            ->assertSessionHasErrors(['title', 'variants']);
    }

    public function test_a_variant_requires_a_price(): void
    {
        $this->actingAs($this->user)
            ->post(route('products.store'), [
                'title' => 'No price',
                'status' => 'draft',
                'variants' => [['name' => 'Default', 'stock_quantity' => '1']],
            ])
            ->assertSessionHasErrors('variants.0.price');
    }

    public function test_updating_a_product_syncs_its_variants(): void
    {
        $product = Product::factory()->for($this->tenant)->create(['title' => 'Old']);
        $keep = $product->variants()->create(['name' => 'Keep me', 'price' => 10, 'stock_quantity' => 1]);
        $drop = $product->variants()->create(['name' => 'Drop me', 'price' => 20, 'stock_quantity' => 1]);

        $this->actingAs($this->user)
            ->put(route('products.update', $product), [
                'title' => 'New title',
                'slug' => $product->slug,
                'status' => 'active',
                'variants' => [
                    ['id' => $keep->id, 'name' => 'Kept', 'price' => '12.00', 'stock_quantity' => '5'],
                    ['name' => 'Brand new', 'price' => '30.00', 'stock_quantity' => '3'],
                ],
            ])
            ->assertRedirect(route('products.edit', $product, absolute: false));

        $this->assertDatabaseHas('products', ['id' => $product->id, 'title' => 'New title']);
        $this->assertDatabaseHas('product_variants', ['id' => $keep->id, 'name' => 'Kept']);
        $this->assertSame('12.00', $keep->fresh()->price);
        $this->assertDatabaseMissing('product_variants', ['id' => $drop->id]);
        $this->assertDatabaseHas('product_variants', ['product_id' => $product->id, 'name' => 'Brand new']);
        $this->assertDatabaseCount('product_variants', 2);
    }

    public function test_deleting_a_product_removes_its_variants(): void
    {
        $product = Product::factory()->for($this->tenant)->create();
        $product->variants()->create(['name' => 'Default', 'price' => 5, 'stock_quantity' => 0]);

        $this->actingAs($this->user)
            ->delete(route('products.destroy', $product))
            ->assertRedirect(route('products.index', absolute: false));

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
        $this->assertDatabaseCount('product_variants', 0);
    }

    public function test_a_user_cannot_touch_another_stores_product(): void
    {
        $otherTenant = Tenant::factory()->create();
        $foreign = Product::factory()->for($otherTenant)->create();

        $this->actingAs($this->user)
            ->get(route('products.edit', $foreign))
            ->assertNotFound();

        $this->actingAs($this->user)
            ->delete(route('products.destroy', $foreign))
            ->assertNotFound();

        $this->assertDatabaseHas('products', ['id' => $foreign->id]);
    }
}
