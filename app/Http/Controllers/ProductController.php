<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductRequest;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    private const SORTS = ['latest', 'oldest', 'title', 'title_desc'];

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(Product::STATUSES)],
            'sort' => ['nullable', Rule::in(self::SORTS)],
        ]);

        $search = $filters['search'] ?? null;
        $status = $filters['status'] ?? null;
        $sort = $filters['sort'] ?? 'latest';

        $query = Product::query()
            ->with(['variants:id,product_id,price', 'images:id,product_id,disk,path'])
            ->when($search, fn (Builder $builder, string $term) => $builder->where('title', 'like', "%{$term}%"))
            ->when($status, fn (Builder $builder, string $value) => $builder->where('status', $value));

        [$column, $direction] = match ($sort) {
            'oldest' => ['created_at', 'asc'],
            'title' => ['title', 'asc'],
            'title_desc' => ['title', 'desc'],
            default => ['created_at', 'desc'],
        };
        $query->orderBy($column, $direction);

        $products = $query
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Product $product): array => [
                'id' => $product->id,
                'title' => $product->title,
                'slug' => $product->slug,
                'status' => $product->status,
                'variants_count' => $product->variants->count(),
                'price_from' => $product->variants->min('price'),
                'thumbnail' => $product->images->first()?->url(),
                'updated_at' => $product->updated_at?->diffForHumans(),
            ]);

        return Inertia::render('admin/products/index', [
            'products' => $products,
            'statuses' => Product::STATUSES,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
                'sort' => $sort,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/products/form', [
            'product' => null,
            'statuses' => Product::STATUSES,
            'categories' => $this->categoryOptions(),
        ]);
    }

    /**
     * Lightweight JSON search used by pickers (collections, page builder).
     */
    public function search(Request $request): JsonResponse
    {
        $term = trim((string) $request->query('q', ''));

        $products = Product::query()
            ->with('images:id,product_id,disk,path')
            ->when($term !== '', fn (Builder $builder) => $builder->where('title', 'like', "%{$term}%"))
            ->orderBy('title')
            ->limit(20)
            ->get()
            ->map(fn (Product $product): array => [
                'id' => $product->id,
                'title' => $product->title,
                'thumbnail' => $product->images->first()?->url(),
            ]);

        return response()->json($products);
    }

    public function store(ProductRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data) {
            $product = Product::create($data);
            $this->syncVariants($product, $data['variants']);
            $product->categories()->sync($data['category_ids'] ?? []);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Product created.']);

        return to_route('products.index');
    }

    public function edit(int $product): Response
    {
        $model = Product::with(['variants', 'categories:id', 'images'])->findOrFail($product);

        return Inertia::render('admin/products/form', [
            'product' => [
                'id' => $model->id,
                'title' => $model->title,
                'slug' => $model->slug,
                'description' => $model->description,
                'status' => $model->status,
                'options' => $model->options ?? [],
                'seo_title' => $model->seo_title,
                'seo_description' => $model->seo_description,
                'variants' => $model->variants->map(fn (ProductVariant $variant): array => [
                    'id' => $variant->id,
                    'name' => $variant->name,
                    'sku' => $variant->sku,
                    'price' => $variant->price,
                    'compare_at_price' => $variant->compare_at_price,
                    'stock_quantity' => $variant->stock_quantity,
                    'options' => $variant->options ?? null,
                ]),
                'category_ids' => $model->categories->pluck('id'),
                'images' => $model->images->map(fn (ProductImage $image): array => [
                    'id' => $image->id,
                    'url' => $image->url(),
                    'alt' => $image->alt,
                ]),
            ],
            'statuses' => Product::STATUSES,
            'categories' => $this->categoryOptions(),
        ]);
    }

    public function update(ProductRequest $request, int $product): RedirectResponse
    {
        $model = Product::findOrFail($product);
        $data = $request->validated();

        DB::transaction(function () use ($model, $data) {
            $model->update($data);
            $this->syncVariants($model, $data['variants']);
            $model->categories()->sync($data['category_ids'] ?? []);
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
     * Flat, tree-ordered category list for the product form's picker.
     *
     * @return array<int, array{id: int, name: string, parent_id: int|null}>
     */
    private function categoryOptions(): array
    {
        return Category::query()
            ->orderBy('position')
            ->orderBy('name')
            ->get(['id', 'name', 'parent_id'])
            ->map(fn (Category $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'parent_id' => $category->parent_id,
            ])
            ->all();
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
                'options' => $variant['options'] ?? null,
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
