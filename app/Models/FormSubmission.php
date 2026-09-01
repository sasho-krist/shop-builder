<?php

namespace App\Models;

use App\Support\Tenancy\BelongsToTenant;
use Database\Factories\FormSubmissionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int|null $page_id
 * @property string|null $form_name
 * @property array<string, mixed> $data
 * @property bool $is_read
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['page_id', 'form_name', 'data', 'is_read'])]
class FormSubmission extends Model
{
    use BelongsToTenant;

    /** @use HasFactory<FormSubmissionFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Page, $this>
     */
    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'data' => 'array',
            'is_read' => 'boolean',
        ];
    }
}
