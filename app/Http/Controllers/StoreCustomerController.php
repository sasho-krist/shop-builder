<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerRequest;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Store customers (shoppers) — the store's own account holders, listed and
 * managed by its owners. Separate from platform owners.
 */
class StoreCustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $customers = Customer::query()
            ->withCount('orders')
            ->when($search !== '', fn (Builder $query) => $query->where(
                fn (Builder $inner) => $inner
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%"),
            ))
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Customer $customer): array => [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'orders_count' => $customer->orders_count,
                'created_at' => $customer->created_at?->toFormattedDateString(),
            ]);

        return Inertia::render('admin/customers/index', [
            'customers' => $customers,
            'filters' => ['search' => $search],
        ]);
    }

    public function update(StoreCustomerRequest $request, int $customer): RedirectResponse
    {
        Customer::findOrFail($customer)->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Customer saved.']);

        return back();
    }

    public function password(Request $request, int $customer): RedirectResponse
    {
        $data = $request->validate([
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        Customer::findOrFail($customer)->update(['password' => $data['password']]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Password updated.']);

        return back();
    }

    public function destroy(int $customer): RedirectResponse
    {
        Customer::findOrFail($customer)->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Customer deleted.']);

        return back();
    }
}
