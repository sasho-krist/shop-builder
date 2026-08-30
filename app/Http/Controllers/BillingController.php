<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Services\Billing\BillingGateway;
use App\Services\Billing\PlanGate;
use App\Support\Billing\Plans;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function show(BillingGateway $gateway, PlanGate $planGate): Response
    {
        $tenant = Tenant::currentOrFail();
        $current = $tenant->currentPlan();

        $subscription = $tenant->subscription('default');

        return Inertia::render('admin/billing', [
            'currentPlan' => $current->key,
            'billingEnabled' => $gateway->enabled(),
            'subscriptionActive' => $subscription !== null && $subscription->valid(),
            'onGracePeriod' => $subscription?->onGracePeriod() ?? false,
            'endsAt' => $subscription?->ends_at?->toFormattedDateString(),
            'usage' => $planGate->usage($tenant),
            'plans' => collect(Plans::all())
                ->map(fn ($plan): array => [
                    'key' => $plan->key,
                    'name' => $plan->name,
                    'price' => $plan->price,
                    'subscribable' => $plan->subscribable(),
                    'limits' => [
                        'products' => $plan->limit('products'),
                        'staff' => $plan->limit('staff'),
                        'custom_domain' => $plan->allows('custom_domain'),
                        'card_payments' => $plan->allows('card_payments'),
                    ],
                ])
                ->values()
                ->all(),
        ]);
    }

    public function checkout(Request $request, BillingGateway $gateway): RedirectResponse
    {
        abort_unless($gateway->enabled(), 404);

        $subscribable = collect(Plans::all())
            ->filter(fn ($plan): bool => $plan->subscribable())
            ->keys()
            ->all();

        $data = $request->validate([
            'plan' => ['required', Rule::in($subscribable)],
        ]);

        $tenant = Tenant::currentOrFail();

        $url = $gateway->subscriptionCheckoutUrl(
            $tenant,
            Plans::get($data['plan']),
            route('billing.show').'?checkout=success',
            route('billing.show').'?checkout=cancelled',
        );

        return redirect()->away($url);
    }

    public function portal(BillingGateway $gateway): RedirectResponse
    {
        abort_unless($gateway->enabled(), 404);

        return redirect()->away(
            $gateway->billingPortalUrl(Tenant::currentOrFail(), route('billing.show')),
        );
    }
}
