<?php

namespace App\Support\Tenancy;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Scope;

/**
 * Scopes a model to the active tenant: every query is filtered by
 * `tenant_id`, and new records inherit it automatically. When no tenant
 * is bound (console, central admin), the model behaves normally.
 */
trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new class implements Scope
        {
            public function apply(Builder $builder, Model $model): void
            {
                $tenant = Tenant::current();

                if ($tenant !== null) {
                    $builder->where($model->getTable().'.tenant_id', $tenant->id);
                }
            }
        });

        static::creating(function (Model $model): void {
            $tenant = Tenant::current();

            if ($tenant !== null && empty($model->getAttribute('tenant_id'))) {
                $model->setAttribute('tenant_id', $tenant->id);
            }
        });
    }

    /**
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
