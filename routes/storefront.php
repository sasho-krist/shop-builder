<?php

use App\Http\Controllers\Storefront\HomeController;
use App\Http\Middleware\ResolveStorefrontTenant;
use Illuminate\Support\Facades\Route;

Route::domain('{store}.'.config('app.central_domain'))
    ->middleware(ResolveStorefrontTenant::class)
    ->group(function () {
        Route::get('/', HomeController::class)->name('storefront.home');
    });
