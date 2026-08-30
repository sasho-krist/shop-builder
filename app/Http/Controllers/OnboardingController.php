<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTenantRequest;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    /**
     * Show the "create your store" form, unless the user already has one.
     */
    public function create(Request $request): Response|RedirectResponse
    {
        if ($request->user()->tenants()->exists()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('onboarding', [
            'centralDomain' => config('app.central_domain'),
        ]);
    }

    /**
     * Create the store and attach the current user as its owner.
     */
    public function store(StoreTenantRequest $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->tenants()->exists()) {
            return redirect()->route('dashboard');
        }

        $tenant = Tenant::create($request->safe()->only('name', 'slug'));
        $tenant->users()->attach($user, ['role' => 'owner']);

        return redirect()->route('dashboard');
    }
}
