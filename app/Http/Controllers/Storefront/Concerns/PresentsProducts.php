<?php

namespace App\Http\Controllers\Storefront\Concerns;

use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Request;

trait PresentsProducts
{
    /**
     * @param  Builder<Product>  $query
     * @return LengthAwarePaginator<int, mixed>
     */
    protected function paginateProducts(Builder $query): LengthAwarePaginator
    {
        $term = trim((string) Request::query('q', ''));

        return $query
            ->where('products.status', 'active')
            ->when($term !== '', fn (Builder $q) => $q->where(
                fn (Builder $w) => $w
                    ->where('products.title', 'like', "%{$term}%")
                    ->orWhere('products.description', 'like', "%{$term}%")
            ))
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
