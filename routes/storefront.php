<?php

use App\Http\Controllers\Storefront\CartController;
use App\Http\Controllers\Storefront\CheckoutController;
use App\Http\Controllers\Storefront\HomeController;
use App\Http\Controllers\Storefront\ProductController;
use App\Http\Middleware\ResolveCart;
use App\Http\Middleware\ResolveStorefrontTenant;
use Illuminate\Support\Facades\Route;

Route::domain('{store}.'.config('app.central_domain'))
    ->middleware([ResolveStorefrontTenant::class, ResolveCart::class])
    ->group(function () {
        Route::get('/', HomeController::class)->name('storefront.home');

        Route::get('products', [ProductController::class, 'index'])->name('storefront.products');
        Route::get('p/{slug}', [ProductController::class, 'show'])->name('storefront.product');

        Route::get('cart', [CartController::class, 'show'])->name('storefront.cart');
        Route::post('cart', [CartController::class, 'store'])->name('storefront.cart.add');
        Route::patch('cart/{item}', [CartController::class, 'update'])->name('storefront.cart.update');
        Route::delete('cart/{item}', [CartController::class, 'destroy'])->name('storefront.cart.remove');

        Route::get('checkout', [CheckoutController::class, 'show'])->name('storefront.checkout');
        Route::post('checkout', [CheckoutController::class, 'store'])->name('storefront.checkout.place');
        Route::get('order/{token}', [CheckoutController::class, 'confirmation'])->name('storefront.order');
    });
