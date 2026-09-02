<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Tenant;
use Stripe\Checkout\Session;
use Stripe\Exception\SignatureVerificationException;
use Stripe\StripeClient;
use Stripe\Webhook;
use UnexpectedValueException;

/**
 * Storefront card payments run on the *store's own* Stripe account, connected
 * from the store's admin Settings — so funds go straight to the merchant. Keys
 * are read from the current tenant's StoreSetting; there is no platform fallback
 * for the secret (a store with no key simply cannot take card payments).
 */
class StripePaymentGateway implements PaymentGateway
{
    public function enabled(): bool
    {
        return (bool) config('services.stripe.enabled', true)
            && $this->secret() !== '';
    }

    public function createCheckoutSession(Order $order, string $successUrl, string $cancelUrl): CheckoutSession
    {
        $currency = config('services.stripe.currency');
        $currency = is_string($currency) && $currency !== '' ? $currency : $order->currency;

        $params = [
            'mode' => 'payment',
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'client_reference_id' => $order->token,
            'customer_email' => $order->email,
            'metadata' => ['order_token' => $order->token],
            'line_items' => [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => strtolower($currency),
                    'unit_amount' => (int) round(((float) $order->total) * 100),
                    'product_data' => ['name' => "Order #{$order->number}"],
                ],
            ]],
        ];

        if (config('services.stripe.disable_link')) {
            $params['payment_method_types'] = ['card'];
        }

        $session = $this->client()->checkout->sessions->create($params);

        return new CheckoutSession((string) $session->id, (string) $session->url);
    }

    public function parseWebhook(string $payload, ?string $signature): ?WebhookEvent
    {
        $secret = $this->webhookSecret();

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

    /** The connected store's Stripe secret key (empty when not connected). */
    private function secret(): string
    {
        $secret = Tenant::current()?->storeSettings()->stripe_secret;

        return is_string($secret) ? $secret : '';
    }

    /**
     * The connected store's webhook signing secret. Falls back to the platform
     * secret so a single platform-operated Stripe account still works.
     */
    private function webhookSecret(): string
    {
        $secret = Tenant::current()?->storeSettings()->stripe_webhook_secret;

        return is_string($secret) && $secret !== ''
            ? $secret
            : (string) config('services.stripe.webhook_secret');
    }

    private function client(): StripeClient
    {
        return new StripeClient($this->secret());
    }
}
