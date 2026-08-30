<?php

namespace App\Services\Payments;

use App\Models\Order;
use Stripe\Checkout\Session;
use Stripe\Exception\SignatureVerificationException;
use Stripe\StripeClient;
use Stripe\Webhook;
use UnexpectedValueException;

class StripePaymentGateway implements PaymentGateway
{
    public function enabled(): bool
    {
        return filled(config('services.stripe.secret'));
    }

    public function createCheckoutSession(Order $order, string $successUrl, string $cancelUrl): CheckoutSession
    {
        $session = $this->client()->checkout->sessions->create([
            'mode' => 'payment',
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'client_reference_id' => $order->token,
            'customer_email' => $order->email,
            'metadata' => ['order_token' => $order->token],
            'line_items' => [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => strtolower($order->currency),
                    'unit_amount' => (int) round(((float) $order->total) * 100),
                    'product_data' => ['name' => "Order #{$order->number}"],
                ],
            ]],
        ]);

        return new CheckoutSession((string) $session->id, (string) $session->url);
    }

    public function parseWebhook(string $payload, ?string $signature): ?WebhookEvent
    {
        $secret = (string) config('services.stripe.webhook_secret');

        try {
            $event = Webhook::constructEvent($payload, (string) $signature, $secret);
        } catch (UnexpectedValueException|SignatureVerificationException) {
            return null;
        }

        $object = $event->data->object ?? null;
        $sessionId = $object instanceof Session ? (string) $object->id : null;
        $paid = $object instanceof Session && $object->payment_status === 'paid';

        return new WebhookEvent((string) $event->type, $sessionId, $paid);
    }

    private function client(): StripeClient
    {
        return new StripeClient((string) config('services.stripe.secret'));
    }
}
