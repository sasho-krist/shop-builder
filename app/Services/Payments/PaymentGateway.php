<?php

namespace App\Services\Payments;

use App\Models\Order;

interface PaymentGateway
{
    /**
     * Whether card payments are configured and usable.
     */
    public function enabled(): bool;

    /**
     * Create a hosted checkout session for the order and return where to send
     * the customer to pay.
     */
    public function createCheckoutSession(Order $order, string $successUrl, string $cancelUrl): CheckoutSession;

    /**
     * Verify and decode an incoming provider webhook. Returns null when the
     * payload cannot be trusted.
     */
    public function parseWebhook(string $payload, ?string $signature): ?WebhookEvent;
}
