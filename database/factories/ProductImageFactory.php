<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductImage>
 */
class ProductImageFactory extends Factory
{
    protected $model = ProductImage::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'tenant_id' => fn (array $attributes) => Product::findOrFail((int) $attributes['product_id'])->tenant_id,
            'disk' => 'public',
            'path' => 'test/'.fake()->uuid().'.jpg',
            'alt' => null,
            'width' => 800,
            'height' => 800,
            'position' => 0,
        ];
    }
}
