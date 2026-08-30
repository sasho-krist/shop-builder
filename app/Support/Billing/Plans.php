<?php

namespace App\Support\Billing;

class Plans
{
    public const DEFAULT = 'free';

    /**
     * @return array<string, Plan>
     */
    public static function all(): array
    {
        /** @var array<string, array{name: string, price: int, stripe_price: string|null, limits: array{products: int|null, staff: int|null, custom_domain: bool, card_payments: bool}}> $config */
        $config = config('plans');

        $plans = [];

        foreach ($config as $key => $plan) {
            $plans[$key] = new Plan(
                key: $key,
                name: $plan['name'],
                price: $plan['price'],
                stripePrice: $plan['stripe_price'],
                limits: $plan['limits'],
            );
        }

        return $plans;
    }

    public static function get(string $key): Plan
    {
        return self::all()[$key] ?? self::all()[self::DEFAULT];
    }

    public static function forStripePrice(string $stripePrice): ?Plan
    {
        foreach (self::all() as $plan) {
            if ($plan->stripePrice === $stripePrice) {
                return $plan;
            }
        }

        return null;
    }

    public static function exists(string $key): bool
    {
        return array_key_exists($key, self::all());
    }
}
