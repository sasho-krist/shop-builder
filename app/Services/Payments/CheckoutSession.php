<?php

namespace App\Services\Payments;

readonly class CheckoutSession
{
    public function __construct(
        public string $id,
        public string $url,
    ) {}
}
