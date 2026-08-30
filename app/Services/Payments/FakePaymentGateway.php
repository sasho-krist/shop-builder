<?php

namespace App\Services\Payments;

use App\Models\Order;

/**
 * In-memory gateway for tests and local development. Enabled only when it is
 * explicitly bound in place of the real gateway.
 */
class FakePaymentGateway implements PaymentGateway
{
    /** @var list<array{order_token: string, success_url: string, cancel_url: string}> */
    public array $sessions = [];

    public function __construct(private bool $enabled = true) {}

    public function enabled(): bool
    {
        return $this->enabled;
    }

    public function createCheckoutSession(Order $order, string $successUrl, string $cancelUrl): CheckoutSession
    {
        $id = 'cs_test_'.$order->token;
        $this->sessions[] = [
            'order_token' => $order->token,
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
        ];

        return new CheckoutSession($id, "https://checkout.stripe.test/{$id}");
    }

    public function parseWebhook(string $payload, ?string $signature): ?WebhookEvent
    {
        if ($signature !== 'valid') {
            return null;
        }

        /** @var array{type?: string, session_id?: string, paid?: bool} $data */
        $data = json_decode($payload, true) ?: [];

        return new WebhookEvent(
            $data['type'] ?? 'checkout.session.completed',
            $data['session_id'] ?? null,
            (bool) ($data['paid'] ?? true),
        );
    }
}
