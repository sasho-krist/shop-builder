<?php

namespace Tests\Unit;

use App\Services\Payments\StripePaymentGateway;
use PHPUnit\Framework\TestCase;

class StripePaymentGatewayTest extends TestCase
{
    public function test_it_passes_a_supported_currency_through_untouched(): void
    {
        $this->assertSame(
            ['currency' => 'eur', 'amount' => 2599],
            StripePaymentGateway::stripeAmount('EUR', '25.99'),
        );
    }

    public function test_it_converts_bgn_to_the_fixed_rate_euro_equivalent(): void
    {
        // Stripe dropped BGN after Bulgaria's euro adoption; 49.90 BGN ≈ 25.51 EUR.
        $this->assertSame(
            ['currency' => 'eur', 'amount' => 2551],
            StripePaymentGateway::stripeAmount('BGN', '49.90'),
        );
    }
}
