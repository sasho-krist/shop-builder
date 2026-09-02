<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Services\Billing\BillingGateway;
use App\Services\Billing\MockBillingGateway;
use App\Services\Billing\PlanGate;
use App\Support\Billing\Plan;
use App\Support\Billing\Plans;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class BillingController extends Controller
{
    public function show(Request $request, BillingGateway $gateway, PlanGate $planGate): Response
    {
        $tenant = Tenant::currentOrFail();
        $current = $tenant->currentPlan();

        $subscription = $tenant->subscription('default');

        $this->flashCheckoutResult($request);

        return Inertia::render('admin/billing', [
            'currentPlan' => $current->key,
            'billingEnabled' => $gateway->enabled(),
            'subscriptionActive' => $subscription !== null && $subscription->valid(),
            'onGracePeriod' => $subscription?->onGracePeriod() ?? false,
            'endsAt' => $subscription?->ends_at?->toFormattedDateString(),
            'usage' => $planGate->usage($tenant),
            'plans' => collect(Plans::all())
                ->map(fn (Plan $plan): array => [
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

    public function checkout(Request $request, BillingGateway $gateway): HttpResponse
    {
        abort_unless($gateway->enabled(), 404);

        $subscribable = collect(Plans::all())
            ->filter(fn (Plan $plan): bool => $plan->subscribable())
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

        return $this->leaveTo($request, $url);
    }

    public function portal(Request $request, BillingGateway $gateway): HttpResponse
    {
        abort_unless($gateway->enabled(), 404);

        return $this->leaveTo(
            $request,
            $gateway->billingPortalUrl(Tenant::currentOrFail(), route('billing.show')),
        );
    }

    /**
     * Send the browser to a checkout / portal URL. Stripe's is a different
     * origin, so an Inertia visit needs a hard `Inertia::location`; a plain
     * request (tests) gets a normal redirect.
     */
    private function leaveTo(Request $request, string $url): HttpResponse
    {
        return $request->header('X-Inertia')
            ? Inertia::location($url)
            : redirect()->away($url);
    }

    // --- Mock checkout (local development only) -----------------------------

    public function mockShow(Request $request, BillingGateway $gateway): Response|RedirectResponse
    {
        abort_unless($gateway instanceof MockBillingGateway, 404);

        $mock = $request->session()->get('billing_mock');
        if (! is_array($mock) || ! Plans::exists((string) ($mock['plan'] ?? ''))) {
            return redirect()->route('billing.show');
        }

        $plan = Plans::get($mock['plan']);

        return Inertia::render('admin/billing-mock', [
            'plan' => ['key' => $plan->key, 'name' => $plan->name, 'price' => $plan->price],
        ]);
    }

    public function mockComplete(Request $request, BillingGateway $gateway): RedirectResponse
    {
        abort_unless($gateway instanceof MockBillingGateway, 404);

        $mock = $request->session()->pull('billing_mock');
        abort_unless(is_array($mock) && Plans::exists((string) ($mock['plan'] ?? '')), 404);

        $tenant = Tenant::currentOrFail();
        $plan = Plans::get($mock['plan']);

        if (! is_string($tenant->stripe_id) || $tenant->stripe_id === '') {
            $tenant->forceFill(['stripe_id' => 'cus_mock_'.$tenant->getKey()])->save();
        }

        $tenant->subscriptions()->updateOrCreate(
            ['type' => 'default'],
            [
                'stripe_id' => 'sub_mock_'.$tenant->getKey(),
                'stripe_status' => 'active',
                'stripe_price' => (string) $plan->stripePrice,
                'quantity' => 1,
                'ends_at' => null,
                'trial_ends_at' => null,
            ],
        );

        $tenant->update(['plan' => $plan->key]);

        return redirect($mock['success_url'] ?? route('billing.show'));
    }

    public function mockCancelCheckout(Request $request): RedirectResponse
    {
        $mock = $request->session()->pull('billing_mock');
        $url = is_array($mock) && is_string($mock['cancel_url'] ?? null)
            ? $mock['cancel_url']
            : route('billing.show').'?checkout=cancelled';

        return redirect($url);
    }

    public function mockPortal(Request $request, BillingGateway $gateway): Response|RedirectResponse
    {
        abort_unless($gateway instanceof MockBillingGateway, 404);

        $tenant = Tenant::currentOrFail();
        $subscription = $tenant->subscription('default');

        if ($subscription === null) {
            return redirect()->route('billing.show');
        }

        return Inertia::render('admin/billing-mock-portal', [
            'planName' => $tenant->currentPlan()->name,
            'onGracePeriod' => $subscription->onGracePeriod(),
            'endsAt' => $subscription->ends_at?->toFormattedDateString(),
        ]);
    }

    public function mockPortalAction(Request $request, BillingGateway $gateway): RedirectResponse
    {
        abort_unless($gateway instanceof MockBillingGateway, 404);

        $data = $request->validate([
            'action' => ['required', Rule::in(['cancel', 'resume'])],
        ]);

        $tenant = Tenant::currentOrFail();
        $subscription = $tenant->subscription('default');
        abort_if($subscription === null, 404);

        if ($data['action'] === 'cancel') {
            $subscription->update([
                'stripe_status' => 'canceled',
                'ends_at' => now()->addMonth(),
            ]);
            Inertia::flash('toast', ['type' => 'success', 'message' => __('Subscription cancelled — active until the period ends.')]);
        } else {
            $subscription->update(['stripe_status' => 'active', 'ends_at' => null]);
            Inertia::flash('toast', ['type' => 'success', 'message' => __('Subscription resumed.')]);
        }

        return redirect()->route('billing.show');
    }

    private function flashCheckoutResult(Request $request): void
    {
        $result = $request->query('checkout');

        if ($result === 'success') {
            Inertia::flash('toast', ['type' => 'success', 'message' => __('Plan updated. Thanks!')]);
        } elseif ($result === 'cancelled') {
            Inertia::flash('toast', ['type' => 'info', 'message' => __('Checkout cancelled — your plan is unchanged.')]);
        }
    }
}
