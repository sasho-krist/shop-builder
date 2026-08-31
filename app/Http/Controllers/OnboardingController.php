<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTenantRequest;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Theme\ThemePresets;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    /**
     * Show the "create your store" form, unless the user already has one.
     */
    public function create(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user instanceof User && $user->tenants()->exists()) {
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

        if (! $user instanceof User) {
            abort(403);
        }

        if ($user->tenants()->exists()) {
            return redirect()->route('dashboard');
        }

        DB::transaction(function () use ($request, $user): void {
            $tenant = Tenant::create($request->safe()->only('name', 'slug'));
            $tenant->users()->attach($user, ['role' => 'owner']);
            $tenant->themes()->create([
                'name' => 'Default',
                'tokens' => ThemePresets::minimal(),
                'is_active' => true,
            ]);
            $tenant->pages()->create([
                'type' => 'home',
                'title' => 'Home',
                'slug' => 'home',
                'blocks' => [],
                'is_published' => true,
            ]);
            $tenant->pages()->create([
                'type' => 'shop',
                'title' => 'Shop',
                'slug' => 'shop',
                'blocks' => [],
                'is_published' => true,
            ]);
            $tenant->settings()->create([]);
        });

        return redirect()->route('dashboard');
    }
}
