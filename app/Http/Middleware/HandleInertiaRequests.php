<?php

namespace App\Http\Middleware;

use App\Models\Cart;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Page;
use App\Models\Tenant;
use App\Models\Theme;
use App\Models\User;
use App\Support\Theme\ThemePresets;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        $customer = Auth::guard('customer')->user();

        return [
            'storeName' => $tenant->name,
            'customer' => $customer instanceof Customer
                ? ['name' => $customer->name]
                : null,
            'theme' => $activeTheme instanceof Theme ? $activeTheme->tokens : ThemePresets::minimal(),
            'cartCount' => $cart?->loadMissing('items')->itemCount() ?? 0,
            'currencySymbol' => $tenant->storeSettings()->currency_symbol,
            'categories' => Category::query()
                ->whereNull('parent_id')
                ->orderBy('position')
                ->orderBy('name')
                ->limit(8)
                ->get(['id', 'name', 'slug'])
                ->map(fn (Category $category): array => [
                    'name' => $category->name,
                    'slug' => $category->slug,
                ])
                ->all(),
            'manage' => $this->manageContext($request, $tenant, $activeTheme),
        ];
    }

    /**
     * When the current visitor is a signed-in owner/staff of this store, expose
     * deep links back into the admin so the storefront can show an editing bar.
     *
     * @return array<string, mixed>|null
     */
    private function manageContext(Request $request, Tenant $tenant, ?Theme $activeTheme): ?array
    {
        $user = $request->user();

        if (! $user instanceof User || ! $user->tenants()->whereKey($tenant->getKey())->exists()) {
            return null;
        }

        $base = rtrim((string) config('app.url'), '/');
        $homePage = Page::query()->where('type', 'home')->first();

        return [
            'name' => $user->name,
            'dashboard' => "{$base}/dashboard",
            'products' => "{$base}/products",
            'newProduct' => "{$base}/products/create",
            'orders' => "{$base}/orders",
            'theme' => $activeTheme instanceof Theme ? "{$base}/themes/{$activeTheme->getKey()}/edit" : null,
            'homePage' => $homePage instanceof Page ? "{$base}/pages/{$homePage->getKey()}/edit" : null,
        ];
    }
}
