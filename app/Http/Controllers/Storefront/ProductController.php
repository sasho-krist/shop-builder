<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Storefront\Concerns\PresentsProducts;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    use PresentsProducts;

    public function index(): Response
    {
        return Inertia::render('storefront/listing', [
            'heading' => 'Shop',
            'description' => null,
            'products' => $this->paginateProducts(Product::query()),
        ]);
    }

    public function show(string $slug): Response
    {
        $product = Product::query()
            ->where('slug', $slug)
            ->where('status', 'active')
            ->with(['variants', 'images'])
            ->firstOrFail();

        return Inertia::render('storefront/product', [
            'product' => [
                'id' => $product->id,
                'title' => $product->title,
                'slug' => $product->slug,
                'description' => $product->description,
                'images' => $product->images->map(fn (ProductImage $image): array => [
                    'url' => $image->url(),
                    'alt' => $image->alt,
                ]),
                'variants' => $product->variants->map(fn (ProductVariant $variant): array => [
                    'id' => $variant->id,
                    'name' => $variant->name,
                    'price' => $variant->price,
                    'compare_at_price' => $variant->compare_at_price,
                    'in_stock' => $variant->stock_quantity > 0,
                ]),
            ],
        ]);
    }
}
