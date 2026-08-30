<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Support\Carbon;

/**
 * The `tenant_user` pivot: which platform users manage which stores.
 *
 * @property int $id
 * @property int $tenant_id
 * @property int $user_id
 * @property string $role
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class TenantMembership extends Pivot
{
    public $incrementing = true;

    protected $table = 'tenant_user';

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
