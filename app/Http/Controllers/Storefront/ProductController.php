<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Storefront\Concerns\BuildsSectionContext;
use App\Http\Controllers\Storefront\Concerns\PresentsProducts;
use App\Models\Page;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    use BuildsSectionContext, PresentsProducts;

    public function index(): Response
    {
        $shop = Page::query()->where('type', 'shop')->first();

        return Inertia::render('storefront/listing', [
            'heading' => $shop instanceof Page && $shop->title !== ''
                ? $shop->title
                : __('Shop'),
            'description' => $shop instanceof Page ? $shop->seo_description : null,
            'products' => $this->paginateProducts(Product::query()),
            'blocks' => $shop instanceof Page ? $shop->blocks : [],
            'sections' => $this->sectionContext(),
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
