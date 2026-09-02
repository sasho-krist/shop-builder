<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The platform's own Stripe credentials — used only for subscription billing
 * (Cashier charges store owners for their plan). Storefront card payments run on
 * each store's own keys, set in that store's admin. Saved values override the
 * matching `.env` variables (AppServiceProvider). Secrets are never sent back to
 * the browser — only whether they are set.
 */
class SettingController extends Controller
{
    /** Setting key => whether it is a secret (masked, blank = keep current). */
    private const FIELDS = [
        'stripe_key' => false,
        'stripe_secret' => true,
        'stripe_webhook_secret' => true,
        'stripe_price_pro' => false,
        'stripe_price_business' => false,
    ];

    public function edit(): Response
    {
        $saved = PlatformSetting::map();

        $values = [];
        foreach (self::FIELDS as $key => $isSecret) {
            $values[$key] = $isSecret
                ? ['set' => filled($saved[$key] ?? null)]
                : ['value' => $saved[$key] ?? ''];
        }

        return Inertia::render('super-admin/settings', [
            'fields' => $values,
            'live' => [
                'billing' => filled(config('cashier.secret')),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $rules = [];
        foreach (array_keys(self::FIELDS) as $key) {
            $rules[$key] = ['nullable', 'string', 'max:255'];
        }
        $data = $request->validate($rules);

        // A blank secret means "keep the stored value"; a blank plain field clears it.
        foreach (self::FIELDS as $key => $isSecret) {
            if ($isSecret && ($data[$key] ?? '') === '') {
                unset($data[$key]);
            }
        }

        PlatformSetting::putMany($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Settings saved.')]);

        return back();
    }
}
