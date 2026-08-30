<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductVariant>
 */
class ProductVariantFactory extends Factory
{
    protected $model = ProductVariant::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'tenant_id' => fn (array $attributes) => Product::findOrFail((int) $attributes['product_id'])->tenant_id,
            'name' => 'Default',
            'sku' => fake()->optional()->bothify('SKU-####'),
            'price' => fake()->randomFloat(2, 5, 500),
            'compare_at_price' => null,
            'stock_quantity' => fake()->numberBetween(0, 100),
            'position' => 0,
            'options' => null,
        ];
    }
}
