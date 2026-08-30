<?php

namespace App\Models;

use App\Support\Tenancy\BelongsToTenant;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $tenant_id
 * @property string $title
 * @property string $slug
 * @property string|null $description
 * @property string $status
 * @property array<int, array{name: string, values: list<string>}>|null $options
 * @property string|null $seo_title
 * @property string|null $seo_description
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['title', 'slug', 'description', 'status', 'options', 'seo_title', 'seo_description'])]
class Product extends Model
{
    use BelongsToTenant;

    /** @use HasFactory<ProductFactory> */
    use HasFactory;

    public const STATUSES = ['draft', 'active', 'archived'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'options' => 'array',
        ];
    }

    /**
     * @return HasMany<ProductVariant, $this>
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->orderBy('position');
    }

    /**
     * @return BelongsToMany<Category, $this>
     */
    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class)->withTimestamps();
    }

    /**
     * @return HasMany<ProductImage, $this>
     */
    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('position');
    }

    /**
     * @return BelongsToMany<Collection, $this>
     */
    public function collections(): BelongsToMany
    {
        return $this->belongsToMany(Collection::class)->withTimestamps();
    }

    /**
     * Order lines across every variant of this product.
     *
     * @return HasManyThrough<OrderLine, ProductVariant, $this>
     */
    public function orderLines(): HasManyThrough
    {
        return $this->hasManyThrough(OrderLine::class, ProductVariant::class);
    }

    /**
     * Sorts by units sold, best sellers first. Every placed order counts except
     * cancelled ones (payment on delivery is the norm, so unpaid isn't "no
     * sale"). Products with no sales fall to the end, newest among them first.
     *
     * @param  Builder<Product>  $query
     */
    public function scopeBestSelling(Builder $query): void
    {
        $query
            ->withSum([
                'orderLines as sold_units' => fn (Builder $lines) => $lines->whereHas(
                    'order',
                    fn (Builder $order) => $order->where('status', '!=', 'cancelled'),
                ),
            ], 'quantity')
            ->orderByDesc('sold_units')
            ->orderByDesc('created_at');
    }
}
