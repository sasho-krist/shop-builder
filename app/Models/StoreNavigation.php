<?php

namespace App\Models;

use App\Support\Tenancy\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * The store's header menu and footer, editable from the admin.
 *
 * @property int $id
 * @property int $tenant_id
 * @property array<int, array{label: string, type: string, value: string|null}>|null $header_links
 * @property array<int, array{label: string, type: string, value: string|null}>|null $footer_links
 * @property string|null $footer_note
 * @property array{type?: string, text?: string|null, phone?: string|null, email?: string|null}|null $header_center
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['header_links', 'footer_links', 'footer_note', 'header_center'])]
class StoreNavigation extends Model
{
    use BelongsToTenant;

    protected $table = 'store_navigation';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'header_links' => 'array',
            'footer_links' => 'array',
            'header_center' => 'array',
        ];
    }
}
