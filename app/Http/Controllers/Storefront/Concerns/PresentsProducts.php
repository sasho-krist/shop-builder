<?php

namespace App\Http\Controllers\Storefront\Concerns;

use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

trait PresentsProducts
{
    /**
     * @param  Builder<Product>  $query
     * @return LengthAwarePaginator<int, mixed>
     */
    protected function paginateProducts(Builder $query): LengthAwarePaginator
    {
        return $query
            ->where('products.status', 'active')
            ->with(['variants:id,product_id,price', 'images:id,product_id,disk,path'])
            ->latest('products.created_at')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Product $product): array => [
                'id' => $product->id,
                'title' => $product->title,
                'slug' => $product->slug,
                'price' => $product->variants->min('price'),
                'image' => $product->images->first()?->url(),
            ]);
    }
}
