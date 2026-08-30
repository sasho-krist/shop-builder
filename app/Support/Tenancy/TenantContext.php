<?php

namespace App\Support\Tenancy;

use App\Models\Tenant;

/**
 * Holds the tenant resolved for the current request (or console command).
 * Bound as a singleton so any code path can read the active store.
 */
class TenantContext
{
    private ?Tenant $tenant = null;

    public function set(Tenant $tenant): void
    {
        $this->tenant = $tenant;
    }

    public function get(): ?Tenant
    {
        return $this->tenant;
    }

    public function check(): bool
    {
        return $this->tenant instanceof Tenant;
    }

    public function id(): ?int
    {
        return $this->tenant?->id;
    }

    public function forget(): void
    {
        $this->tenant = null;
    }
}
