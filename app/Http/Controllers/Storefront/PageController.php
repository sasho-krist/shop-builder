<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Storefront\Concerns\BuildsSectionContext;
use App\Models\Page;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Renders a published custom page (type "page") from its blocks — the same
 * section pipeline the home page uses.
 */
class PageController extends Controller
{
    use BuildsSectionContext;

    public function show(string $slug): Response
    {
        $page = Page::query()
            ->where('type', 'page')
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        return Inertia::render('storefront/page', [
            'title' => $page->title,
            'blocks' => $page->blocks,
            'sections' => $this->sectionContext(),
        ]);
    }
}
