<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Storefront\Concerns\BuildsSectionContext;
use App\Http\Controllers\Storefront\Concerns\PresentsProducts;
use App\Models\Page;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    use BuildsSectionContext, PresentsProducts;

    public function index(Request $request): Response
    {
        $shop = Page::query()->where('type', 'shop')->first();

        // The system-page title doubles as the storefront heading. Run it through
        // the translator so the seeded default ("Shop") localises, while a title
        // the owner has customised passes through untouched.
        $title = $shop instanceof Page ? trim($shop->title) : '';
        $search = trim((string) $request->query('q', ''));

        return Inertia::render('storefront/listing', [
            'heading' => $search !== ''
                ? __('Results for “:q”', ['q' => $search])
                : ($title !== '' ? __($title) : __('Shop')),
            'description' => $search !== '' ? null : ($shop instanceof Page ? $shop->seo_description : null),
            'products' => $this->paginateProducts(Product::query()),
            'blocks' => $search !== '' ? [] : ($shop instanceof Page ? $shop->blocks : []),
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
