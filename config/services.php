<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'stripe' => [
        'enabled' => env('STRIPE_ENABLED', true),
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
        // Storefront one-off payments use their own Stripe webhook endpoint,
        // separate from Cashier's subscription webhook (STRIPE_WEBHOOK_SECRET).
        'webhook_secret' => env('STRIPE_STOREFRONT_WEBHOOK_SECRET', env('STRIPE_WEBHOOK_SECRET')),
        // Force the hosted Checkout to card only, hiding Stripe Link.
        'disable_link' => env('STRIPE_DISABLE_LINK', false),
        // Optional override for the Checkout line-item currency; when unset the
        // order's own currency is used.
        'currency' => env('STRIPE_CURRENCY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
