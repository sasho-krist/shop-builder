<?php

namespace App\Http\Controllers;

use App\Http\Requests\CollectionRequest;
use App\Models\Collection;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CollectionController extends Controller
{
    public function index(): Response
    {
        $collections = Collection::query()
            ->withCount('products')
            ->orderBy('position')
            ->orderBy('title')
            ->get()
            ->map(fn (Collection $collection): array => [
                'id' => $collection->id,
                'title' => $collection->title,
                'slug' => $collection->slug,
                'is_visible' => $collection->is_visible,
                'products_count' => $collection->products_count,
            ]);

        return Inertia::render('admin/collections/index', [
            'collections' => $collections,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/collections/form', ['collection' => null]);
    }

    public function store(CollectionRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $collection = Collection::create($data);
        $collection->products()->sync($this->positioned($data['product_ids'] ?? []));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Collection created.']);

        return to_route('collections.edit', $collection);
    }

    public function edit(int $collection): Response
    {
        $model = Collection::with('products.images:id,product_id,disk,path')->findOrFail($collection);

        return Inertia::render('admin/collections/form', [
            'collection' => [
                'id' => $model->id,
                'title' => $model->title,
                'slug' => $model->slug,
                'description' => $model->description,
                'is_visible' => $model->is_visible,
                'products' => $model->products->map(fn (Product $product): array => [
                    'id' => $product->id,
                    'title' => $product->title,
                    'thumbnail' => $product->images->first()?->url(),
                ]),
            ],
        ]);
    }

    public function update(CollectionRequest $request, int $collection): RedirectResponse
    {
        $model = Collection::findOrFail($collection);
        $data = $request->validated();

        $model->update($data);
        $model->products()->sync($this->positioned($data['product_ids'] ?? []));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Collection saved.']);

        return to_route('collections.edit', $model);
    }

    public function destroy(int $collection): RedirectResponse
    {
        Collection::findOrFail($collection)->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Collection deleted.']);

        return to_route('collections.index');
    }

    /**
     * @param  array<int, int|string>  $ids
     * @return array<int, array{position: int}>
     */
    private function positioned(array $ids): array
    {
        $sync = [];

        foreach (array_values($ids) as $position => $id) {
            $sync[(int) $id] = ['position' => $position];
        }

        return $sync;
    }
}
