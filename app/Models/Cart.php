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
 * @property string $token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['token'])]
class Cart extends Model
{
    use BelongsToTenant;

    /**
     * @return HasMany<CartItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    /**
     * @return numeric-string
     */
    public function subtotal(): string
    {
        $total = '0';

        foreach ($this->items->loadMissing('variant') as $item) {
            $total = bcadd($total, $item->subtotal(), 2);
        }

        return $total;
    }

    public function itemCount(): int
    {
        return (int) $this->items->sum('quantity');
    }

    /**
     * subtotal / shipping / tax / total for the given store settings.
     *
     * @return array{subtotal: string, shipping: string, tax: string, total: string}
     */
    public function totals(StoreSetting $settings): array
    {
        $subtotal = $this->subtotal();
        $shipping = $settings->shippingFor($subtotal);
        $tax = $settings->taxFor($subtotal);

        return [
            'subtotal' => $subtotal,
            'shipping' => $shipping,
            'tax' => $tax,
            'total' => bcadd(bcadd($subtotal, $shipping, 2), $tax, 2),
        ];
    }

    /**
     * Storefront-facing cart payload (line items + totals).
     *
     * @return array<string, mixed>
     */
    public function presentation(?StoreSetting $settings = null): array
    {
        $this->load(['items.variant.product.images']);

        return [
            'items' => $this->items->map(function (CartItem $item): array {
                $variant = $item->variant;
                $product = $variant->product;

                return [
                    'id' => $item->id,
                    'quantity' => $item->quantity,
                    'unit_price' => $variant->price,
                    'subtotal' => $item->subtotal(),
                    'variant_name' => $variant->name,
                    'product_title' => $product->title,
                    'product_slug' => $product->slug,
                    'image' => $product->images->first()?->url(),
                ];
            })->all(),
            'subtotal' => $this->subtotal(),
            'count' => $this->itemCount(),
            'totals' => $settings === null ? null : $this->totals($settings),
            'currency_symbol' => $settings?->currency_symbol,
        ];
    }
}
