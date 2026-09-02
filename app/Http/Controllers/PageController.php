<?php

namespace App\Http\Controllers;

use App\Http\Requests\PageRequest;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Page;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\Theme;
use App\Support\Theme\ThemePresets;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function index(): Response
    {
        $pages = Page::query()
            ->orderByRaw(
                "case type when 'home' then 0 when 'shop' then 1 when 'cart' then 2 when 'thankyou' then 3 else 4 end"
            )
            ->orderBy('title')
            ->get()
            ->map(fn (Page $page): array => [
                'id' => $page->id,
                'type' => $page->type,
                'title' => $page->title,
                'slug' => $page->slug,
                'is_published' => $page->is_published,
                'blocks_count' => count($page->blocks),
            ]);

        return Inertia::render('admin/pages/index', ['pages' => $pages]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate(['title' => ['required', 'string', 'max:255']]);

        $base = Str::slug($data['title']) ?: 'page';
        $slug = $base;
        $suffix = 2;

        while (Page::query()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        $page = Page::create([
            'type' => 'page',
            'title' => $data['title'],
            'slug' => $slug,
            'blocks' => [],
        ]);

        return to_route('pages.edit', $page);
    }

    public function edit(int $page): Response
    {
        $model = Page::findOrFail($page);
        $activeTheme = Theme::active();

        return Inertia::render('admin/pages/edit', [
            'page' => [
                'id' => $model->id,
                'type' => $model->type,
                'title' => $model->title,
                'slug' => $model->slug,
                'blocks' => $model->blocks,
                'seo_title' => $model->seo_title,
                'seo_description' => $model->seo_description,
                'is_published' => $model->is_published,
            ],
            'context' => $this->previewContext(),
            'theme' => $activeTheme instanceof Theme ? $activeTheme->tokens : ThemePresets::minimal(),
        ]);
    }

    public function update(PageRequest $request, int $page): RedirectResponse
    {
        Page::findOrFail($page)->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Page saved.')]);

        return back();
    }

    public function destroy(int $page): RedirectResponse
    {
        $model = Page::findOrFail($page);

        if (in_array($model->type, Page::SYSTEM_TYPES, true)) {
            return back()->withErrors(['page' => __('This page is part of the store and cannot be deleted.')]);
        }

        $model->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Page deleted.')]);

        return to_route('pages.index');
    }

    /**
     * Sample catalogue data so the editor preview can render product sections.
     *
     * @return array<string, mixed>
     */
    private function previewContext(): array
    {
        $symbol = Tenant::currentOrFail()->storeSettings()->currency_symbol;

        $mapProduct = function (Product $product) use ($symbol): array {
            $from = $product->variants->min('price');

            return [
                'id' => $product->id,
                'title' => $product->title,
                'price' => $from === null ? null : "{$from} {$symbol}",
                'image' => $product->images->first()?->url(),
            ];
        };

        $withRelations = fn () => Product::query()
            ->with(['variants:id,product_id,price', 'images:id,product_id,disk,path']);

        return [
            'products' => $withRelations()
                ->latest()
                ->limit(8)
                ->get()
                ->map($mapProduct)
                ->all(),
            'bestSelling' => $withRelations()
                ->bestSelling()
                ->limit(8)
                ->get()
                ->map($mapProduct)
                ->all(),
            'collections' => Collection::query()
                ->with([
                    'products.variants:id,product_id,price',
                    'products.images:id,product_id,disk,path',
                ])
                ->get()
                ->map(fn (Collection $collection): array => [
                    'id' => $collection->id,
                    'title' => $collection->title,
                    'products' => $collection->products->take(8)->map($mapProduct)->values()->all(),
                ])
                ->all(),
            'categories' => Category::query()
                ->orderBy('position')
                ->orderBy('name')
                ->with([
                    'products.variants:id,product_id,price',
                    'products.images:id,product_id,disk,path',
                ])
                ->get()
                ->map(fn (Category $category): array => [
                    'id' => $category->id,
                    'title' => $category->name,
                    'products' => $category->products->take(8)->map($mapProduct)->values()->all(),
                ])
                ->all(),
        ];
    }
}
