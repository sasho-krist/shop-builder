<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSettingRequest;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class StoreSettingController extends Controller
{
    public function edit(): Response
    {
        $tenant = Tenant::currentOrFail();
        $settings = $tenant->storeSettings();

        return Inertia::render('admin/settings', [
            'settings' => [
                'currency' => $settings->currency,
                'currency_symbol' => $settings->currency_symbol,
                'store_email' => $settings->store_email,
                'shipping_flat' => $settings->shipping_flat,
                'free_shipping_over' => $settings->free_shipping_over,
                'tax_rate' => $settings->tax_rate,
                'tax_included' => $settings->tax_included,
            ],
            'stripe' => [
                'connected' => $settings->stripeConnected(),
                'webhook_secret_set' => is_string($settings->stripe_webhook_secret)
                    && $settings->stripe_webhook_secret !== '',
                'webhook_url' => $tenant->storefrontUrl().'/stripe/webhook',
            ],
            'domain' => [
                'subdomain' => $tenant->slug.'.'.(string) config('app.central_domain'),
                'custom_domain' => $tenant->custom_domain,
                'target' => (string) config('app.central_domain'),
            ],
        ]);
    }

    public function update(StoreSettingRequest $request): RedirectResponse
    {
        $data = $request->validated();

        // A blank Stripe field means "keep the stored value" — use the Disconnect
        // action to clear it — so drop empty ones before writing.
        foreach (['stripe_secret', 'stripe_webhook_secret'] as $key) {
            if (($data[$key] ?? '') === '') {
                unset($data[$key]);
            }
        }

        Tenant::currentOrFail()->storeSettings()->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Settings saved.')]);

        return back();
    }

    public function disconnectStripe(): RedirectResponse
    {
        Tenant::currentOrFail()->storeSettings()->update([
            'stripe_secret' => null,
            'stripe_webhook_secret' => null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Stripe disconnected.')]);

        return back();
    }
}
