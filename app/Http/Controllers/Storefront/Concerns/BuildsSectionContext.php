<?php

namespace App\Http\Controllers\Storefront\Concerns;

use App\Models\Collection;
use App\Models\Product;

trait BuildsSectionContext
{
    /**
     * Real catalogue data for rendering page sections on the storefront.
     *
     * @return array{products: array<int, mixed>, collections: array<int, mixed>}
     */
    protected function sectionContext(): array
    {
        $map = fn (Product $product): array => [
            'id' => $product->id,
            'title' => $product->title,
            'slug' => $product->slug,
            'price' => $product->variants->min('price'),
            'image' => $product->images->first()?->url(),
        ];

        return [
            'products' => Product::query()
                ->where('status', 'active')
                ->with(['variants:id,product_id,price', 'images:id,product_id,disk,path'])
                ->latest()
                ->limit(12)
                ->get()
                ->map($map)
                ->all(),
            'collections' => Collection::query()
                ->where('is_visible', true)
                ->with([
                    'products.variants:id,product_id,price',
                    'products.images:id,product_id,disk,path',
                ])
                ->get()
                ->map(fn (Collection $collection): array => [
                    'id' => $collection->id,
                    'title' => $collection->title,
                    'products' => $collection->products
                        ->where('status', 'active')
                        ->take(12)
                        ->map($map)
                        ->values()
                        ->all(),
                ])
                ->all(),
        ];
    }
}
