<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Platform-wide key/value settings edited from the operator panel — currently
 * the Stripe credentials, which override `config/services.php` + `config/cashier.php`
 * at boot (see AppServiceProvider::applyPlatformSettings). Values set here win
 * over the matching `.env` variables.
 *
 * @property int $id
 * @property string $key
 * @property string|null $value
 */
class PlatformSetting extends Model
{
    protected $fillable = ['key', 'value'];

    private const CACHE_KEY = 'platform_settings';

    /**
     * @return array<string, string|null>
     */
    public static function map(): array
    {
        /** @var array<string, string|null> */
        return Cache::rememberForever(
            self::CACHE_KEY,
            fn (): array => self::query()->pluck('value', 'key')->all(),
        );
    }

    /**
     * @param  array<string, string|null>  $values
     */
    public static function putMany(array $values): void
    {
        foreach ($values as $key => $value) {
            self::query()->updateOrCreate(
                ['key' => $key],
                ['value' => $value === '' ? null : $value],
            );
        }

        Cache::forget(self::CACHE_KEY);
    }

    public static function flushCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
