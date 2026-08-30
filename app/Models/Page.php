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

    public const TYPES = ['home', 'page'];

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
