<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Storefront\Concerns\PresentsProducts;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    use PresentsProducts;

    public function show(string $slug): Response
    {
        $category = Category::query()->where('slug', $slug)->firstOrFail();
        $ids = $category->descendantIds(Category::query()->get(['id', 'parent_id']));

        return Inertia::render('storefront/listing', [
            'heading' => $category->name,
            'description' => $category->description,
            'products' => $this->paginateProducts(
                Product::query()->whereHas(
                    'categories',
                    fn (Builder $query) => $query->whereIn('categories.id', $ids)
                )
            ),
        ]);
    }
}
