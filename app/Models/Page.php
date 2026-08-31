<?php

namespace App\Models;

use App\Support\Tenancy\BelongsToTenant;
use Database\Factories\PageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $tenant_id
 * @property string $type
 * @property string $title
 * @property string $slug
 * @property array<int, array{id: string, type: string, props: array<string, mixed>}> $blocks
 * @property string|null $seo_title
 * @property string|null $seo_description
 * @property bool $is_published
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['type', 'title', 'slug', 'blocks', 'seo_title', 'seo_description', 'is_published'])]
class Page extends Model
{
    use BelongsToTenant;

    /** @use HasFactory<PageFactory> */
    use HasFactory;

    public const TYPES = ['home', 'shop', 'cart', 'thankyou', 'page'];

    /**
     * Pages the owner cannot create, rename the slug of, or delete. Every store
     * gets one of each (seeded at onboarding, backfilled by migration). The slug
     * always equals the type.
     *
     * @var array<string, string>
     */
    public const SYSTEM_PAGES = [
        'home' => 'Home',
        'shop' => 'Shop',
        'cart' => 'Cart',
        'thankyou' => 'Thank you',
    ];

    public const SYSTEM_TYPES = ['home', 'shop', 'cart', 'thankyou'];

    /**
     * Create any missing system pages for the given tenant.
     */
    public static function seedSystemPages(int $tenantId): void
    {
        foreach (self::SYSTEM_PAGES as $type => $title) {
            $exists = self::withoutGlobalScopes()
                ->where('tenant_id', $tenantId)
                ->where('type', $type)
                ->exists();

            if ($exists) {
                continue;
            }

            $page = new self([
                'type' => $type,
                'title' => $title,
                'slug' => $type,
                'blocks' => [],
                'is_published' => true,
            ]);
            $page->tenant_id = $tenantId;
            $page->save();
        }
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'blocks' => 'array',
            'is_published' => 'boolean',
        ];
    }
}
