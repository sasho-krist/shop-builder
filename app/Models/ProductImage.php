<?php

namespace App\Models;

use App\Support\Tenancy\BelongsToTenant;
use Database\Factories\ProductImageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int $product_id
 * @property string $disk
 * @property string $path
 * @property string|null $alt
 * @property int|null $width
 * @property int|null $height
 * @property int $position
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['disk', 'path', 'alt', 'width', 'height', 'position'])]
class ProductImage extends Model
{
    use BelongsToTenant;

    /** @use HasFactory<ProductImageFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function url(): string
    {
        return Storage::disk($this->disk)->url($this->path);
    }

    /**
     * Remove the underlying file when the row is deleted.
     */
    protected static function booted(): void
    {
        static::deleting(function (ProductImage $image): void {
            Storage::disk($image->disk)->delete($image->path);
        });
    }
}
