<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Tenant;
use App\Services\Payments\PaymentGateway;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\App;

class StripeWebhookController extends Controller
{
    public function __invoke(Request $request, PaymentGateway $gateway): Response
    {
        $event = $gateway->parseWebhook(
            $request->getContent(),
            $request->header('Stripe-Signature'),
        );

        if ($event === null) {
            return response('Invalid signature', 400);
        }

        if ($event->type === 'checkout.session.completed' && $event->paid && $event->sessionId !== null) {
            $this->markPaid($event->sessionId);
        }

        return response('OK');
    }

    private function markPaid(string $sessionId): void
    {
        $payment = Payment::withoutGlobalScopes()
            ->with('order.lines')
            ->where('provider_ref', $sessionId)
            ->first();

        if ($payment === null || $payment->status === 'paid') {
            return;
        }

        $order = $payment->order;
        $tenant = Tenant::query()->findOrFail($payment->tenant_id);
        Tenant::setCurrent($tenant);

        $payment->update(['status' => 'paid']);
        $order->update(['payment_status' => 'paid', 'status' => 'paid']);

        App::setLocale($order->locale);
        $order->sendConfirmation($tenant->storeSettings());

        Tenant::forgetCurrent();
    }
}
