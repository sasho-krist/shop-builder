<?php

namespace App\Models;

use App\Support\Tenancy\BelongsToTenant;
use Database\Factories\ThemeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * @property int $id
 * @property int $tenant_id
 * @property string $name
 * @property array<string, mixed> $tokens
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'tokens', 'is_active'])]
class Theme extends Model
{
    use BelongsToTenant;

    /** @use HasFactory<ThemeFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tokens' => 'array',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Make this the tenant's only active theme.
     */
    public function activate(): void
    {
        DB::transaction(function (): void {
            static::query()->where('id', '!=', $this->id)->update(['is_active' => false]);
            $this->forceFill(['is_active' => true])->save();
        });
    }

    public static function active(): ?self
    {
        return static::query()->where('is_active', true)->first();
    }
}
