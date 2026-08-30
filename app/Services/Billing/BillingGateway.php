<?php

namespace App\Services\Billing;

use App\Models\Tenant;
use App\Support\Billing\Plan;

interface BillingGateway
{
    /**
     * Whether online subscription management is configured.
     */
    public function enabled(): bool;

    /**
     * Hosted checkout URL for subscribing the store to a plan.
     */
    public function subscriptionCheckoutUrl(Tenant $tenant, Plan $plan, string $successUrl, string $cancelUrl): string;

    /**
     * Stripe billing portal URL for managing an existing subscription.
     */
    public function billingPortalUrl(Tenant $tenant, string $returnUrl): string;
}
