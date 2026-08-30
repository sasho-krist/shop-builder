<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $tenant = Tenant::currentOrFail();

        return Inertia::render('dashboard', [
            'store' => [
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'url' => $tenant->storefrontUrl(),
                'plan' => $tenant->plan,
            ],
        ]);
    }
}
