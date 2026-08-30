<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CollectionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductImageController;
use App\Http\Controllers\ProductImportController;
use App\Http\Controllers\StoreDomainController;
use App\Http\Controllers\StoreSettingController;
use App\Http\Controllers\StripeWebhookController;
use App\Http\Controllers\ThemeController;
use App\Http\Middleware\EnsureTenantSelected;
use Illuminate\Support\Facades\Route;

// Storefront routes are matched first so store subdomains never fall through
// to the central marketing/admin routes below.
require __DIR__.'/storefront.php';

Route::inertia('/', 'welcome')->name('home');

Route::post('stripe/webhook', StripeWebhookController::class)->name('stripe.webhook');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('onboarding', [OnboardingController::class, 'create'])->name('onboarding.create');
    Route::post('onboarding', [OnboardingController::class, 'store'])->name('onboarding.store');

    Route::middleware(EnsureTenantSelected::class)->group(function () {
        Route::get('dashboard', DashboardController::class)->name('dashboard');

        Route::get('products', [ProductController::class, 'index'])->name('products.index');
        Route::get('products/create', [ProductController::class, 'create'])->name('products.create');
        Route::get('products/search', [ProductController::class, 'search'])->name('products.search');
        Route::get('products/import', [ProductImportController::class, 'show'])->name('products.import');
        Route::post('products/import/preview', [ProductImportController::class, 'preview'])->name('products.import.preview');
        Route::post('products/import', [ProductImportController::class, 'store'])->name('products.import.store');
        Route::post('products', [ProductController::class, 'store'])->name('products.store');
        Route::get('products/{product}/edit', [ProductController::class, 'edit'])->name('products.edit');
        Route::put('products/{product}', [ProductController::class, 'update'])->name('products.update');
        Route::delete('products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');

        Route::post('products/{product}/images', [ProductImageController::class, 'store'])->name('products.images.store');
        Route::put('products/{product}/images/reorder', [ProductImageController::class, 'reorder'])->name('products.images.reorder');
        Route::patch('products/{product}/images/{image}', [ProductImageController::class, 'update'])->name('products.images.update');
        Route::delete('products/{product}/images/{image}', [ProductImageController::class, 'destroy'])->name('products.images.destroy');

        Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
        Route::post('categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::put('categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
        Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

        Route::get('collections', [CollectionController::class, 'index'])->name('collections.index');
        Route::get('collections/create', [CollectionController::class, 'create'])->name('collections.create');
        Route::post('collections', [CollectionController::class, 'store'])->name('collections.store');
        Route::get('collections/{collection}/edit', [CollectionController::class, 'edit'])->name('collections.edit');
        Route::put('collections/{collection}', [CollectionController::class, 'update'])->name('collections.update');
        Route::delete('collections/{collection}', [CollectionController::class, 'destroy'])->name('collections.destroy');

        Route::get('themes', [ThemeController::class, 'index'])->name('themes.index');
        Route::post('themes', [ThemeController::class, 'store'])->name('themes.store');
        Route::get('themes/{theme}/edit', [ThemeController::class, 'edit'])->name('themes.edit');
        Route::put('themes/{theme}', [ThemeController::class, 'update'])->name('themes.update');
        Route::post('themes/{theme}/activate', [ThemeController::class, 'activate'])->name('themes.activate');
        Route::delete('themes/{theme}', [ThemeController::class, 'destroy'])->name('themes.destroy');

        Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
        Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
        Route::patch('orders/{order}', [OrderController::class, 'update'])->name('orders.update');

        Route::get('pages', [PageController::class, 'index'])->name('pages.index');
        Route::post('pages', [PageController::class, 'store'])->name('pages.store');
        Route::get('pages/{page}/edit', [PageController::class, 'edit'])->name('pages.edit');
        Route::put('pages/{page}', [PageController::class, 'update'])->name('pages.update');
        Route::delete('pages/{page}', [PageController::class, 'destroy'])->name('pages.destroy');

        Route::post('media', [MediaController::class, 'store'])->name('media.store');

        Route::get('store-settings', [StoreSettingController::class, 'edit'])->name('store-settings.edit');
        Route::put('store-settings', [StoreSettingController::class, 'update'])->name('store-settings.update');
        Route::put('store-domain', [StoreDomainController::class, 'update'])->name('store-domain.update');
    });
});

require __DIR__.'/settings.php';
