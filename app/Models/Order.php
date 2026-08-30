<?php

namespace App\Models;

use App\Support\Tenancy\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int $number
 * @property string $token
 * @property string $status
 * @property string $payment_status
 * @property string $payment_method
 * @property string $email
 * @property string $customer_name
 * @property string|null $phone
 * @property array<string, string> $shipping_address
 * @property string|null $notes
 * @property numeric-string $subtotal
 * @property numeric-string $shipping_total
 * @property numeric-string $tax_total
 * @property numeric-string $total
 * @property string $currency
 * @property string $locale
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'customer_id', 'number', 'token', 'status', 'payment_status', 'payment_method',
    'email', 'customer_name', 'phone', 'shipping_address', 'notes',
    'subtotal', 'shipping_total', 'tax_total', 'total', 'currency', 'locale',
])]
class Order extends Model
{
    use BelongsToTenant;

    public const STATUSES = ['pending', 'paid', 'fulfilled', 'cancelled'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'shipping_address' => 'array',
            'subtotal' => 'decimal:2',
            'shipping_total' => 'decimal:2',
            'tax_total' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    /**
     * @return HasMany<OrderLine, $this>
     */
    public function lines(): HasMany
    {
        return $this->hasMany(OrderLine::class);
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
