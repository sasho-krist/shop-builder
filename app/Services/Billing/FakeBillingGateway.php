<?php

namespace App\Services\Billing;

use App\Models\Tenant;
use App\Support\Billing\Plan;

class FakeBillingGateway implements BillingGateway
{
    /** @var list<array{tenant_id: int, plan: string, success_url: string, cancel_url: string}> */
    public array $checkouts = [];

    public function __construct(private bool $enabled = true) {}

    public function enabled(): bool
    {
        return $this->enabled;
    }

    public function subscriptionCheckoutUrl(Tenant $tenant, Plan $plan, string $successUrl, string $cancelUrl): string
    {
        $this->checkouts[] = [
            'tenant_id' => $tenant->id,
            'plan' => $plan->key,
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
        ];

        return "https://checkout.stripe.test/subscribe/{$plan->key}";
    }

    public function billingPortalUrl(Tenant $tenant, string $returnUrl): string
    {
        return 'https://billing.stripe.test/portal?return='.urlencode($returnUrl);
    }
}
