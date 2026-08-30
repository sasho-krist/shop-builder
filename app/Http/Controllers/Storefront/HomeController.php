<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(): Response
    {
        $tenant = Tenant::currentOrFail();

        return Inertia::render('storefront/coming-soon', [
            'store' => [
                'name' => $tenant->name,
            ],
        ]);
    }
}
