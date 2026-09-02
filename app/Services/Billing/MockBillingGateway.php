<?php

namespace App\Services\Billing;

use App\Models\Tenant;
use App\Support\Billing\Plan;

/**
 * A self-contained stand-in for Stripe subscription checkout, for local
 * development and demos where there is no Stripe account / webhook tunnel.
 * Bound in place of StripeBillingGateway when `BILLING_MOCK=true` (never in
 * production). "Checkout" redirects to an in-app page that completes the
 * subscription and returns to the billing screen — the same shape as the real
 * flow, minus a real card charge.
 */
class MockBillingGateway implements BillingGateway
{
    public function enabled(): bool
    {
        return true;
    }

    public function subscriptionCheckoutUrl(Tenant $tenant, Plan $plan, string $successUrl, string $cancelUrl): string
    {
        session()->put('billing_mock', [
            'plan' => $plan->key,
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
        ]);

        return route('billing.mock.show');
    }

    public function billingPortalUrl(Tenant $tenant, string $returnUrl): string
    {
        session()->put('billing_mock_portal_return', $returnUrl);

        return route('billing.mock.portal');
    }
}
