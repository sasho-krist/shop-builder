<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(): Response
    {
        $products = Product::query()
            ->where('status', 'active')
            ->with(['variants:id,product_id,price', 'images:id,product_id,disk,path'])
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Product $product): array => [
                'id' => $product->id,
                'title' => $product->title,
                'slug' => $product->slug,
                'price' => $product->variants->min('price'),
                'image' => $product->images->first()?->url(),
            ]);

        return Inertia::render('storefront/products', ['products' => $products]);
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
