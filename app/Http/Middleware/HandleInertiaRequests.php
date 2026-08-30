<?php

namespace App\Http\Middleware;

use App\Models\Cart;
use App\Models\Tenant;
use App\Models\Theme;
use App\Support\Theme\ThemePresets;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            // Resolved lazily: tenant / cart context is bound by route
            // middleware, which runs *after* this method.
            'currentTenant' => fn () => $this->currentTenant(),
            'storefront' => fn () => $this->storefront($request),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function currentTenant(): ?array
    {
        $tenant = Tenant::current();

        return $tenant === null ? null : [
            'id' => $tenant->id,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'url' => $tenant->storefrontUrl(),
        ];
    }

    /**
     * Shared data every storefront page needs: store identity, active theme
     * tokens and the cart badge count.
     *
     * @return array<string, mixed>|null
     */
    private function storefront(Request $request): ?array
    {
        $tenant = Tenant::current();

        if ($tenant === null || ! $request->routeIs('storefront.*')) {
            return null;
        }

        $activeTheme = Theme::active();
        $cart = app()->bound(Cart::class) ? app(Cart::class) : null;

        return [
            'storeName' => $tenant->name,
            'theme' => $activeTheme instanceof Theme ? $activeTheme->tokens : ThemePresets::minimal(),
            'cartCount' => $cart?->loadMissing('items')->itemCount() ?? 0,
            'currencySymbol' => $tenant->storeSettings()->currency_symbol,
        ];
    }
}
