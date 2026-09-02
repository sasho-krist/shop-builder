<?php

namespace App\Providers;

use App\Listeners\SyncTenantPlan;
use App\Models\PlatformSetting;
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
        $this->applyPlatformSettings();
    }

    /**
     * Let the operator panel's Stripe settings (DB) override the config that
     * otherwise comes from `.env`. These are the *platform's* own Stripe account,
     * used only for subscription billing (Cashier) — storefront card payments run
     * on each store's own keys (StoreSetting). A missing table (fresh install,
     * mid-migration) is ignored so the app still boots.
     */
    protected function applyPlatformSettings(): void
    {
        try {
            $settings = PlatformSetting::map();
        } catch (\Throwable) {
            return;
        }

        $apply = function (string $configKey, string $settingKey) use ($settings): void {
            $value = $settings[$settingKey] ?? null;

            if (is_string($value) && $value !== '') {
                config([$configKey => $value]);
            }
        };

        $apply('cashier.key', 'stripe_key');
        $apply('cashier.secret', 'stripe_secret');
        $apply('cashier.webhook.secret', 'stripe_webhook_secret');
        $apply('plans.pro.stripe_price', 'stripe_price_pro');
        $apply('plans.business.stripe_price', 'stripe_price_business');
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
