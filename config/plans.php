<?php

/*
|--------------------------------------------------------------------------
| Platform subscription plans
|--------------------------------------------------------------------------
|
| The `key` is stored on `tenants.plan` and is the source of truth for what
| a store may do. `stripe_price` links a plan to a Stripe recurring Price;
| when it is null the plan cannot be subscribed to online (Free, or plans
| configured manually). `limits.products` / `limits.staff` use null for
| "unlimited".
|
*/

return [

    'free' => [
        'name' => 'Free',
        'price' => 0,
        'stripe_price' => null,
        'limits' => [
            'products' => 15,
            'staff' => 1,
            'custom_domain' => false,
            'card_payments' => false,
        ],
    ],

    'pro' => [
        'name' => 'Pro',
        'price' => 29,
        'stripe_price' => env('STRIPE_PRICE_PRO'),
        'limits' => [
            'products' => 1000,
            'staff' => 5,
            'custom_domain' => true,
            'card_payments' => true,
        ],
    ],

    'business' => [
        'name' => 'Business',
        'price' => 99,
        'stripe_price' => env('STRIPE_PRICE_BUSINESS'),
        'limits' => [
            'products' => null,
            'staff' => null,
            'custom_domain' => true,
            'card_payments' => true,
        ],
    ],

];
