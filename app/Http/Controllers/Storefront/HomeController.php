<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Theme;
use App\Support\Theme\ThemePresets;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(): Response
    {
        $tenant = Tenant::currentOrFail();
        $theme = Theme::active();

        return Inertia::render('storefront/coming-soon', [
            'store' => [
                'name' => $tenant->name,
            ],
            'theme' => $theme instanceof Theme ? $theme->tokens : ThemePresets::minimal(),
        ]);
    }
}
