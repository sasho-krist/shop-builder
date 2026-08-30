<?php

namespace App\Listeners;

use App\Models\Tenant;
use App\Support\Billing\Plan;
use App\Support\Billing\Plans;
use Laravel\Cashier\Events\WebhookHandled;

/**
 * Keeps the denormalised `tenants.plan` column — the source of truth for plan
 * limits — in step with the store's Stripe subscription.
 */
class SyncTenantPlan
{
    public function handle(WebhookHandled $event): void
    {
        $type = (string) ($event->payload['type'] ?? '');

        if (! str_starts_with($type, 'customer.subscription.')) {
            return;
        }

        $customerId = $event->payload['data']['object']['customer'] ?? null;

        if (! is_string($customerId)) {
            return;
        }

        $tenant = Tenant::query()->where('stripe_id', $customerId)->first();

        if (! $tenant instanceof Tenant) {
            return;
        }

        $subscription = $tenant->subscription('default');

        $plan = $subscription !== null && $subscription->valid() && is_string($subscription->stripe_price)
            ? Plans::forStripePrice($subscription->stripe_price)
            : null;

        $tenant->update(['plan' => $plan instanceof Plan ? $plan->key : Plans::DEFAULT]);
    }
}
