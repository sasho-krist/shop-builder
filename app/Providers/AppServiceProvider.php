<?php

namespace App\Providers;

use App\Listeners\SyncTenantPlan;
use App\Models\Tenant;
use App\Services\Billing\BillingGateway;
use App\Services\Billing\StripeBillingGateway;
use App\Services\Payments\PaymentGateway;
use App\Services\Payments\StripePaymentGateway;
use App\Support\Tenancy\TenantContext;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Laravel\Cashier\Cashier;
use Laravel\Cashier\Events\WebhookHandled;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(TenantContext::class);
        $this->app->singleton(PaymentGateway::class, StripePaymentGateway::class);
        $this->app->singleton(BillingGateway::class, StripeBillingGateway::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        Cashier::useCustomerModel(Tenant::class);
        Event::listen(WebhookHandled::class, SyncTenantPlan::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
