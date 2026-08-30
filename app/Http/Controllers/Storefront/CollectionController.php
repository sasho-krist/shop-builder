<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Storefront\Concerns\PresentsProducts;
use App\Models\Collection;
use Inertia\Inertia;
use Inertia\Response;

class CollectionController extends Controller
{
    use PresentsProducts;

    public function show(string $slug): Response
    {
        $collection = Collection::query()
            ->where('slug', $slug)
            ->where('is_visible', true)
            ->firstOrFail();

        return Inertia::render('storefront/listing', [
            'heading' => $collection->title,
            'description' => $collection->description,
            'products' => $this->paginateProducts($collection->products()->getQuery()),
        ]);
    }
}
