<?php

namespace App\Http\Middleware;

use App\Models\Cart;
use App\Models\Customer;
use App\Models\Page;
use App\Models\Tenant;
use App\Models\Theme;
use App\Models\User;
use App\Support\Storefront\NavLinks;
use App\Support\Theme\ThemePresets;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
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
            'locale' => fn () => App::getLocale(),
            'i18n' => fn () => $this->translations(App::getLocale()),
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
        $nav = $tenant->storeNavigation();

        return [
            'storeName' => $tenant->name,
            'logoUrl' => $tenant->storeSettings()->logoUrl(),
            'customer' => $customer instanceof Customer
                ? ['name' => $customer->name]
                : null,
            'theme' => $activeTheme instanceof Theme ? $activeTheme->tokens : ThemePresets::minimal(),
            'cartCount' => $cart?->loadMissing('items')->itemCount() ?? 0,
            'currencySymbol' => $tenant->storeSettings()->currency_symbol,
            'nav' => [
                'header' => NavLinks::resolve($nav->header_links),
                'footer' => NavLinks::resolve($nav->footer_links),
                'footerNote' => $nav->footer_note,
            ],
            'locale' => App::getLocale(),
            'manage' => $this->manageContext($request, $tenant, $activeTheme),
        ];
    }

    /** @var array<string, array<string, string>> */
    private static array $translationCache = [];

    /**
     * Flat `english => translation` map for the active locale, for the React
     * `t()` helper. English is the source language, so it needs no map.
     *
     * @return array<string, string>
     */
    private function translations(string $locale): array
    {
        if (isset(self::$translationCache[$locale])) {
            return self::$translationCache[$locale];
        }

        $path = lang_path("{$locale}.json");

        if (! File::exists($path)) {
            return self::$translationCache[$locale] = [];
        }

        /** @var array<string, string> $strings */
        $strings = json_decode(File::get($path), true) ?: [];

        return self::$translationCache[$locale] = $strings;
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
        $pages = Page::query()
            ->whereIn('type', Page::SYSTEM_TYPES)
            ->get()
            ->keyBy('type');

        $editUrl = fn (string $type): ?string => $pages->has($type)
            ? "{$base}/pages/{$pages->get($type)->getKey()}/edit"
            : null;

        return [
            'name' => $user->name,
            'dashboard' => "{$base}/dashboard",
            'products' => "{$base}/products",
            'newProduct' => "{$base}/products/create",
            'orders' => "{$base}/orders",
            'theme' => $activeTheme instanceof Theme ? "{$base}/themes/{$activeTheme->getKey()}/edit" : null,
            'homePage' => $editUrl('home'),
            'shopPage' => $editUrl('shop'),
            'cartPage' => $editUrl('cart'),
            'thankyouPage' => $editUrl('thankyou'),
        ];
    }
}
