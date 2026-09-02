<?php

namespace App\Models;

use App\Support\Tenancy\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property int $tenant_id
 * @property string $currency
 * @property string $currency_symbol
 * @property string|null $store_email
 * @property string|null $logo_path
 * @property numeric-string $shipping_flat
 * @property numeric-string|null $free_shipping_over
 * @property numeric-string $tax_rate
 * @property bool $tax_included
 * @property string|null $stripe_secret
 * @property string|null $stripe_webhook_secret
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'currency', 'currency_symbol', 'store_email',
    'shipping_flat', 'free_shipping_over', 'tax_rate', 'tax_included',
    'stripe_secret', 'stripe_webhook_secret',
])]
class StoreSetting extends Model
{
    use BelongsToTenant;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'currency' => 'BGN',
        'currency_symbol' => 'лв.',
        'shipping_flat' => 0,
        'tax_rate' => 0,
        'tax_included' => true,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'shipping_flat' => 'decimal:2',
            'free_shipping_over' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'tax_included' => 'boolean',
        ];
    }

    /**
     * Whether this store has connected its own Stripe account for card payments.
     */
    public function stripeConnected(): bool
    {
        return is_string($this->stripe_secret) && $this->stripe_secret !== '';
    }

    /**
     * Public URL of the store's logo, or null when none is set.
     */
    public function logoUrl(): ?string
    {
        return is_string($this->logo_path) && $this->logo_path !== ''
            ? Storage::disk('public')->url($this->logo_path)
            : null;
    }

    /**
     * Shipping cost for a given order subtotal.
     *
     * @param  numeric-string  $subtotal
     * @return numeric-string
     */
    public function shippingFor(string $subtotal): string
    {
        if ($this->free_shipping_over !== null
            && bccomp($subtotal, $this->free_shipping_over, 2) >= 0) {
            return '0.00';
        }

        return bcadd($this->shipping_flat, '0', 2);
    }

    /**
     * Tax charged on top of the subtotal (0 when prices already include tax).
     *
     * @param  numeric-string  $subtotal
     * @return numeric-string
     */
    public function taxFor(string $subtotal): string
    {
        if ($this->tax_included || bccomp($this->tax_rate, '0', 2) === 0) {
            return '0.00';
        }

        return bcdiv(bcmul($subtotal, $this->tax_rate, 4), '100', 2);
    }
}
