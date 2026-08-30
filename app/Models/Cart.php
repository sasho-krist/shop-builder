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
}
