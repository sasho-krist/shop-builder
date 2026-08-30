<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Storefront\Concerns\BuildsSectionContext;
use App\Models\Page;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    use BuildsSectionContext;

    public function __invoke(): Response
    {
        $home = Page::query()->where('type', 'home')->firstOrFail();

        return Inertia::render('storefront/home', [
            'blocks' => $home->blocks,
            'sections' => $this->sectionContext(),
        ]);
    }
}
