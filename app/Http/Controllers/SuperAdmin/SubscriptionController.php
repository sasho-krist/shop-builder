<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Support\Billing\Plan;
use App\Support\Billing\Plans;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Read-only view of platform billing. The `subscriptions` table is filled by
 * the Cashier webhook once real Stripe billing is live; until then this is a
 * plan breakdown over the stores plus whatever subscription rows exist.
 */
class SubscriptionController extends Controller
{
    public function index(): Response
    {
        $plans = collect(Plans::all())->map(fn (Plan $plan, string $key): array => [
            'key' => $key,
            'name' => $plan->name,
            'price' => $plan->price,
            'stores' => Tenant::query()->where('plan', $key)->count(),
        ])->values();

        $subscriptions = DB::table('subscriptions')
            ->leftJoin('tenants', 'tenants.id', '=', 'subscriptions.tenant_id')
            ->orderByDesc('subscriptions.id')
            ->get([
                'subscriptions.id',
                'tenants.name as store',
                'subscriptions.type',
                'subscriptions.stripe_status',
                'subscriptions.stripe_price',
                'subscriptions.quantity',
                'subscriptions.trial_ends_at',
                'subscriptions.ends_at',
                'subscriptions.created_at',
            ])
            ->map(fn ($row): array => [
                'id' => $row->id,
                'store' => $row->store,
                'type' => $row->type,
                'status' => $row->stripe_status,
                'price' => $row->stripe_price,
                'quantity' => $row->quantity,
                'trial_ends_at' => $row->trial_ends_at,
                'ends_at' => $row->ends_at,
                'created_at' => $row->created_at,
            ]);

        return Inertia::render('super-admin/subscriptions', [
            'plans' => $plans,
            'subscriptions' => $subscriptions,
        ]);
    }
}
