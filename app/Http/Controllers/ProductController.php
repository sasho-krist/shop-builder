<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductRequest;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(): Response
    {
        $products = Product::query()
            ->with('variants:id,product_id,price')
            ->latest()
            ->paginate(20)
            ->through(fn (Product $product): array => [
                'id' => $product->id,
                'title' => $product->title,
                'slug' => $product->slug,
                'status' => $product->status,
                'variants_count' => $product->variants->count(),
                'price_from' => $product->variants->min('price'),
                'updated_at' => $product->updated_at?->diffForHumans(),
            ]);

        return Inertia::render('admin/products/index', [
            'products' => $products,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/products/form', [
            'product' => null,
            'statuses' => Product::STATUSES,
        ]);
    }

    public function store(ProductRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data) {
            $product = Product::create($data);
            $this->syncVariants($product, $data['variants']);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Product created.']);

        return to_route('products.index');
    }

    public function edit(int $product): Response
    {
        $model = Product::with('variants')->findOrFail($product);

        return Inertia::render('admin/products/form', [
            'product' => [
                'id' => $model->id,
                'title' => $model->title,
                'slug' => $model->slug,
                'description' => $model->description,
                'status' => $model->status,
                'seo_title' => $model->seo_title,
                'seo_description' => $model->seo_description,
                'variants' => $model->variants->map(fn (ProductVariant $variant): array => [
                    'id' => $variant->id,
                    'name' => $variant->name,
                    'sku' => $variant->sku,
                    'price' => $variant->price,
                    'compare_at_price' => $variant->compare_at_price,
                    'stock_quantity' => $variant->stock_quantity,
                ]),
            ],
            'statuses' => Product::STATUSES,
        ]);
    }

    public function update(ProductRequest $request, int $product): RedirectResponse
    {
        $model = Product::findOrFail($product);
        $data = $request->validated();

        DB::transaction(function () use ($model, $data) {
            $model->update($data);
            $this->syncVariants($model, $data['variants']);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Product saved.']);

        return to_route('products.edit', $model);
    }

    public function destroy(int $product): RedirectResponse
    {
        Product::findOrFail($product)->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Product deleted.']);

        return to_route('products.index');
    }

    /**
     * Create, update and prune variants to match the submitted payload.
     *
     * @param  array<int, array<string, mixed>>  $variants
     */
    private function syncVariants(Product $product, array $variants): void
    {
        $keptIds = [];

        foreach (array_values($variants) as $position => $variant) {
            $attributes = [
                'name' => $variant['name'],
                'sku' => $variant['sku'] ?? null,
                'price' => $variant['price'],
                'compare_at_price' => $variant['compare_at_price'] ?? null,
                'stock_quantity' => $variant['stock_quantity'],
                'position' => $position,
            ];

            $model = isset($variant['id'])
                ? $product->variants()->find((int) $variant['id']) ?? $product->variants()->make()
                : $product->variants()->make();

            $model->fill($attributes)->save();
            $keptIds[] = $model->id;
        }

        $product->variants()->whereNotIn('id', $keptIds)->delete();
    }
}
