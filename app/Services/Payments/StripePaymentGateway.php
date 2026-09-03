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
    /** Fixed BGN→EUR conversion rate (Bulgaria's euro adoption). */
    private const BGN_TO_EUR = 1.95583;

    public function enabled(): bool
    {
        return (bool) config('services.stripe.enabled', true)
            && $this->secret() !== '';
    }

    public function createCheckoutSession(Order $order, string $successUrl, string $cancelUrl): CheckoutSession
    {
        $override = config('services.stripe.currency');
        $currency = is_string($override) && $override !== '' ? $override : $order->currency;
        ['currency' => $currency, 'amount' => $amount] = self::stripeAmount($currency, (string) $order->total);

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
                    'currency' => $currency,
                    'unit_amount' => $amount,
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

    /**
     * Stripe stopped accepting BGN when Bulgaria adopted the euro. Orders still
     * priced in BGN are charged the fixed-rate euro equivalent instead.
     *
     * @return array{currency: string, amount: int}
     */
    public static function stripeAmount(string $currency, string $total): array
    {
        $currency = strtolower($currency);
        $amount = (int) round(((float) $total) * 100);

        if ($currency === 'bgn') {
            return ['currency' => 'eur', 'amount' => (int) round($amount / self::BGN_TO_EUR)];
        }

        return ['currency' => $currency, 'amount' => $amount];
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

    /** The connected store's Stripe secret key (empty when not connected or malformed). */
    private function secret(): string
    {
        $secret = Tenant::current()?->storeSettings()->stripe_secret;

        return is_string($secret) && preg_match('/^(sk|rk)_(test|live)_[A-Za-z0-9]+$/', $secret) === 1
            ? $secret
            : '';
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
