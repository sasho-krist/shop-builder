<?php

namespace App\Models;

use App\Support\Tenancy\TenantContext;
use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $custom_domain
 * @property string $plan
 * @property string $status
 * @property Carbon|null $trial_ends_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'slug', 'custom_domain', 'plan', 'status', 'trial_ends_at'])]
class Tenant extends Model
{
    /** @use HasFactory<TenantFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'trial_ends_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * @return HasMany<Theme, $this>
     */
    public function themes(): HasMany
    {
        return $this->hasMany(Theme::class);
    }

    /**
     * @return HasMany<Page, $this>
     */
    public function pages(): HasMany
    {
        return $this->hasMany(Page::class);
    }

    /**
     * @return HasOne<StoreSetting, $this>
     */
    public function settings(): HasOne
    {
        return $this->hasOne(StoreSetting::class);
    }

    public function storeSettings(): StoreSetting
    {
        return $this->settings()->firstOrCreate([]);
    }

    /**
     * The public URL of this store's storefront.
     */
    public function storefrontUrl(): string
    {
        $base = parse_url((string) config('app.url'));
        $scheme = $base['scheme'] ?? 'http';
        $port = isset($base['port']) ? ':'.$base['port'] : '';
        $host = $this->custom_domain ?? $this->slug.'.'.(string) config('app.central_domain');

        return "{$scheme}://{$host}{$port}";
    }

    public static function current(): ?self
    {
        return app(TenantContext::class)->get();
    }

    public static function currentOrFail(): self
    {
        $tenant = self::current();

        if (! $tenant instanceof self) {
            throw new \RuntimeException('No active tenant is bound to the current request.');
        }

        return $tenant;
    }

    public static function setCurrent(self $tenant): void
    {
        app(TenantContext::class)->set($tenant);
    }

    public static function forgetCurrent(): void
    {
        app(TenantContext::class)->forget();
    }

    public static function hasCurrent(): bool
    {
        return app(TenantContext::class)->check();
    }
}
