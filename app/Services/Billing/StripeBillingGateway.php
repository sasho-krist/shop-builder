<?php

namespace App\Services\Billing;

use App\Models\Tenant;
use App\Support\Billing\Plan;

class StripeBillingGateway implements BillingGateway
{
    public function enabled(): bool
    {
        return filled(config('cashier.secret'));
    }

    public function subscriptionCheckoutUrl(Tenant $tenant, Plan $plan, string $successUrl, string $cancelUrl): string
    {
        abort_unless($plan->subscribable(), 422);

        $checkout = $tenant
            ->newSubscription('default', (string) $plan->stripePrice)
            ->checkout([
                'success_url' => $successUrl,
                'cancel_url' => $cancelUrl,
                'metadata' => ['plan' => $plan->key],
            ]);

        return (string) $checkout->asStripeCheckoutSession()->url;
    }

    public function billingPortalUrl(Tenant $tenant, string $returnUrl): string
    {
        return $tenant->billingPortalUrl($returnUrl);
    }
}
