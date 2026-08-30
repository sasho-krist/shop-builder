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
            'domain' => [
                'subdomain' => $tenant->slug.'.'.(string) config('app.central_domain'),
                'custom_domain' => $tenant->custom_domain,
                'target' => (string) config('app.central_domain'),
            ],
        ]);
    }

    public function update(StoreSettingRequest $request): RedirectResponse
    {
        Tenant::currentOrFail()->storeSettings()->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Settings saved.']);

        return back();
    }
}
