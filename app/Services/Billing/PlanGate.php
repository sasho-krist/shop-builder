<?php

namespace App\Services\Billing;

use App\Models\Product;
use App\Models\Tenant;

class PlanGate
{
    /**
     * Whether a boolean plan feature is available to the store.
     */
    public function allows(Tenant $tenant, string $feature): bool
    {
        return $tenant->currentPlan()->allows($feature);
    }

    /**
     * Whether the store can still create another record of the given kind.
     */
    public function canAdd(Tenant $tenant, string $countable, int $add = 1): bool
    {
        $limit = $tenant->currentPlan()->limit($countable);

        if ($limit === null) {
            return true;
        }

        return $this->currentCount($tenant, $countable) + $add <= $limit;
    }

    /**
     * Per-countable usage for the billing screen.
     *
     * @return array<string, array{used: int, limit: int|null}>
     */
    public function usage(Tenant $tenant): array
    {
        $plan = $tenant->currentPlan();

        $usage = [];

        foreach (['products', 'staff'] as $countable) {
            $usage[$countable] = [
                'used' => $this->currentCount($tenant, $countable),
                'limit' => $plan->limit($countable),
            ];
        }

        return $usage;
    }

    private function currentCount(Tenant $tenant, string $countable): int
    {
        return match ($countable) {
            'products' => Product::query()->count(),
            'staff' => $tenant->users()->count(),
            default => 0,
        };
    }
}
