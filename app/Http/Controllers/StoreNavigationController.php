<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNavigationRequest;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Page;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class StoreNavigationController extends Controller
{
    public function edit(): Response
    {
        $nav = Tenant::currentOrFail()->storeNavigation();

        return Inertia::render('admin/navigation', [
            'navigation' => [
                'header_links' => $nav->header_links ?? [],
                'footer_links' => $nav->footer_links ?? [],
                'footer_note' => $nav->footer_note ?? '',
            ],
            'targets' => [
                'categories' => Category::query()
                    ->orderBy('name')
                    ->get(['name', 'slug'])
                    ->map(fn (Category $c): array => ['label' => $c->name, 'value' => $c->slug])
                    ->all(),
                'collections' => Collection::query()
                    ->orderBy('title')
                    ->get(['title', 'slug'])
                    ->map(fn (Collection $c): array => ['label' => $c->title, 'value' => $c->slug])
                    ->all(),
                'pages' => Page::query()
                    ->where('type', 'page')
                    ->orderBy('title')
                    ->get(['title', 'slug', 'is_published'])
                    ->map(fn (Page $p): array => [
                        'label' => $p->title.($p->is_published ? '' : ' (draft)'),
                        'value' => $p->slug,
                    ])
                    ->all(),
            ],
        ]);
    }

    public function update(StoreNavigationRequest $request): RedirectResponse
    {
        Tenant::currentOrFail()->storeNavigation()->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Navigation saved.')]);

        return back();
    }
}
