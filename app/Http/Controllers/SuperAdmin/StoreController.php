<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Support\Billing\Plan;
use App\Support\Billing\Plans;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Every store on the platform, from the operator's seat: rename / re-slug /
 * move plan, suspend (the storefront 404s while suspended), or delete
 * outright (cascades to the whole catalogue, orders and staff links).
 */
class StoreController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $stores = Tenant::query()
            ->withCount(['users', 'products', 'orders'])
            ->when($search !== '', fn (Builder $query) => $query->where(
                fn (Builder $inner) => $inner
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('custom_domain', 'like', "%{$search}%"),
            ))
            ->orderByDesc('id')
            ->get()
            ->map(fn (Tenant $tenant): array => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'custom_domain' => $tenant->custom_domain,
                'plan' => $tenant->plan,
                'status' => $tenant->status,
                'url' => $tenant->storefrontUrl(),
                'users_count' => $tenant->users_count,
                'products_count' => $tenant->products_count,
                'orders_count' => $tenant->orders_count,
                'created_at' => $tenant->created_at?->toFormattedDateString(),
            ]);

        return Inertia::render('super-admin/stores', [
            'stores' => $stores,
            'filters' => ['search' => $search],
            'plans' => collect(Plans::all())->map(fn (Plan $plan, string $key): array => [
                'key' => $key,
                'name' => $plan->name,
            ])->values(),
        ]);
    }

    public function update(Request $request, Tenant $store): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required', 'string', 'max:255', 'alpha_dash',
                Rule::unique('tenants', 'slug')->ignore($store->getKey()),
            ],
            'custom_domain' => [
                'nullable', 'string', 'max:255',
                Rule::unique('tenants', 'custom_domain')->ignore($store->getKey()),
            ],
            'plan' => ['required', 'string', Rule::in(array_keys(Plans::all()))],
        ]);

        $store->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Store saved.')]);

        return back();
    }

    public function status(Request $request, Tenant $store): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['active', 'suspended'])],
        ]);

        $store->update(['status' => $data['status']]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $data['status'] === 'suspended'
                ? __('Store suspended.')
                : __('Store reactivated.'),
        ]);

        return back();
    }

    public function destroy(Tenant $store): RedirectResponse
    {
        $store->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Store deleted.')]);

        return back();
    }
}
