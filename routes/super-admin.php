<?php

use App\Http\Controllers\SuperAdmin\OwnerController;
use App\Http\Controllers\SuperAdmin\SessionController;
use App\Http\Controllers\SuperAdmin\SettingController;
use App\Http\Controllers\SuperAdmin\StoreController;
use App\Http\Controllers\SuperAdmin\SubscriptionController;
use App\Http\Middleware\EnsureSuperAdmin;
use Illuminate\Support\Facades\Route;

/*
 * Platform operator panel. Separate sign-in (no `users` record, no
 * registration), gated by the EnsureSuperAdmin session flag.
 */
Route::prefix('super-admin')->name('super-admin.')->group(function () {
    Route::get('login', [SessionController::class, 'create'])->name('login');
    Route::post('login', [SessionController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('login.store');
    Route::post('logout', [SessionController::class, 'destroy'])->name('logout');

    Route::middleware(EnsureSuperAdmin::class)->group(function () {
        Route::redirect('/', '/super-admin/stores');

        Route::get('stores', [StoreController::class, 'index'])->name('stores');
        Route::put('stores/{store}', [StoreController::class, 'update'])->name('stores.update');
        Route::patch('stores/{store}/status', [StoreController::class, 'status'])->name('stores.status');
        Route::delete('stores/{store}', [StoreController::class, 'destroy'])->name('stores.destroy');

        Route::get('owners', [OwnerController::class, 'index'])->name('owners');
        Route::put('owners/{owner}', [OwnerController::class, 'update'])->name('owners.update');
        Route::patch('owners/{owner}/password', [OwnerController::class, 'password'])->name('owners.password');
        Route::delete('owners/{owner}', [OwnerController::class, 'destroy'])->name('owners.destroy');

        Route::get('subscriptions', [SubscriptionController::class, 'index'])->name('subscriptions');

        Route::get('settings', [SettingController::class, 'edit'])->name('settings');
        Route::put('settings', [SettingController::class, 'update'])->name('settings.update');
    });
});
