<?php

use App\Http\Controllers\Storefront\AccountController;
use App\Http\Controllers\Storefront\CartController;
use App\Http\Controllers\Storefront\CategoryController;
use App\Http\Controllers\Storefront\CheckoutController;
use App\Http\Controllers\Storefront\CollectionController;
use App\Http\Controllers\Storefront\CustomerAuthController;
use App\Http\Controllers\Storefront\FormSubmissionController;
use App\Http\Controllers\Storefront\HomeController;
use App\Http\Controllers\Storefront\LocaleController;
use App\Http\Controllers\Storefront\PageController;
use App\Http\Controllers\Storefront\ProductController;
use App\Http\Controllers\Storefront\StoreAdminController;
use App\Http\Middleware\ResolveCart;
use App\Http\Middleware\ResolveStorefrontTenant;
use App\Http\Middleware\SetStorefrontLocale;
use Illuminate\Support\Facades\Route;

$central = (string) config('app.central_domain');

// Every storefront host is handled here: a `{slug}.central-domain` subdomain or
// a connected custom domain. The only host that is *not* a storefront is the
// bare central domain itself (marketing + admin), which the constraint excludes.
// `ResolveStorefrontTenant` resolves the tenant from the request host.
Route::domain('{store}')
    ->where(['store' => '^(?!'.preg_quote($central, '/').'$).+$'])
    ->middleware([SetStorefrontLocale::class, ResolveStorefrontTenant::class, ResolveCart::class])
    ->group(function (): void {
        Route::get('/', HomeController::class)->name('storefront.home');

        Route::get('locale/{locale}', LocaleController::class)->name('storefront.locale');

        Route::get('products', [ProductController::class, 'index'])->name('storefront.products');
        Route::get('p/{slug}', [ProductController::class, 'show'])->name('storefront.product');
        Route::get('c/{slug}', [CategoryController::class, 'show'])->name('storefront.category');
        Route::get('collections/{slug}', [CollectionController::class, 'show'])->name('storefront.collection');

        Route::get('cart', [CartController::class, 'show'])->name('storefront.cart');
        Route::post('cart', [CartController::class, 'store'])->name('storefront.cart.add');
        Route::patch('cart/{item}', [CartController::class, 'update'])->name('storefront.cart.update');
        Route::delete('cart/{item}', [CartController::class, 'destroy'])->name('storefront.cart.remove');

        Route::post('forms', [FormSubmissionController::class, 'store'])
            ->middleware('throttle:20,1')
            ->name('storefront.form');

        Route::get('checkout', [CheckoutController::class, 'show'])->name('storefront.checkout');
        Route::post('checkout', [CheckoutController::class, 'store'])->name('storefront.checkout.place');
        Route::get('order/{token}', [CheckoutController::class, 'confirmation'])->name('storefront.order');

        Route::get('account/register', [CustomerAuthController::class, 'showRegister'])->name('storefront.register');
        Route::post('account/register', [CustomerAuthController::class, 'register']);
        Route::get('account/login', [CustomerAuthController::class, 'showLogin'])->name('storefront.login');
        Route::post('account/login', [CustomerAuthController::class, 'login']);
        Route::post('account/logout', [CustomerAuthController::class, 'logout'])->name('storefront.logout');
        Route::get('account', [AccountController::class, 'show'])->name('storefront.account');

        Route::get('admin', [StoreAdminController::class, 'show'])->name('storefront.admin');
        Route::post('admin/login', [StoreAdminController::class, 'login'])->name('storefront.admin.login');
        Route::post('admin/register', [StoreAdminController::class, 'register'])->name('storefront.admin.register');
        Route::post('admin/logout', [StoreAdminController::class, 'logout'])->name('storefront.admin.logout');

        // Custom pages by slug — kept last so it never shadows the routes above.
        Route::get('{slug}', [PageController::class, 'show'])
            ->where('slug', '[a-z0-9](?:[a-z0-9-]*[a-z0-9])?')
            ->name('storefront.page');
    });
