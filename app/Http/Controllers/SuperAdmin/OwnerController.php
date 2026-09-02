<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Every platform user (store owner / staff) from the operator's seat:
 * edit name & email, force a password reset, or delete the account
 * (which detaches them from every store they manage).
 */
class OwnerController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $owners = User::query()
            ->with('tenants:id,name')
            ->when($search !== '', fn (Builder $query) => $query->where(
                fn (Builder $inner) => $inner
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%"),
            ))
            ->orderByDesc('id')
            ->get()
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified' => $user->email_verified_at !== null,
                'created_at' => $user->created_at?->toFormattedDateString(),
                'stores' => $user->tenants
                    ->map(fn (Tenant $tenant): array => [
                        'id' => $tenant->id,
                        'name' => $tenant->name,
                    ])
                    ->all(),
            ]);

        return Inertia::render('super-admin/owners', [
            'owners' => $owners,
            'filters' => ['search' => $search],
        ]);
    }

    public function update(Request $request, User $owner): RedirectResponse
    {
        $owner->update($request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($owner->getKey())],
        ]));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Owner saved.')]);

        return back();
    }

    public function password(Request $request, User $owner): RedirectResponse
    {
        $data = $request->validate([
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $owner->forceFill([
            'password' => $data['password'],
            'remember_token' => null,
        ])->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Password reset.')]);

        return back();
    }

    public function destroy(User $owner): RedirectResponse
    {
        $owner->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Owner deleted.')]);

        return back();
    }
}
