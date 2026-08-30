<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOwnerRequest;
use App\Models\Tenant;
use App\Models\TenantMembership;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Platform users who manage the current store. Owners can add and remove other
 * owners, and edit their name/email — but never their password: once set (at
 * registration or when first added) it belongs to that owner alone.
 */
class StoreOwnerController extends Controller
{
    public function index(Request $request): Response
    {
        $tenant = Tenant::currentOrFail();
        $meId = (int) ($request->user()?->getAuthIdentifier() ?? 0);

        $owners = TenantMembership::query()
            ->where('tenant_id', $tenant->getKey())
            ->with('user')
            ->orderBy('id')
            ->get()
            ->map(fn (TenantMembership $membership): array => [
                'id' => $membership->user_id,
                'name' => $membership->user?->name,
                'email' => $membership->user?->email,
                'role' => $membership->role,
                'is_you' => $membership->user_id === $meId,
                'joined_at' => $membership->created_at?->toFormattedDateString(),
            ]);

        return Inertia::render('admin/owners/index', [
            'owners' => $owners,
        ]);
    }

    public function store(StoreOwnerRequest $request): RedirectResponse
    {
        $tenant = Tenant::currentOrFail();
        $data = $request->validated();

        $user = User::query()->firstWhere('email', $data['email']);

        if ($user === null) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
            ]);
        }

        if ($tenant->users()->whereKey($user->getKey())->exists()) {
            throw ValidationException::withMessages([
                'email' => 'This person already manages the store.',
            ]);
        }

        $tenant->users()->attach($user, ['role' => 'owner']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Owner added.']);

        return back();
    }

    public function update(Request $request, int $user): RedirectResponse
    {
        $tenant = Tenant::currentOrFail();
        abort_unless($tenant->users()->whereKey($user)->exists(), 404);

        $model = User::findOrFail($user);

        $model->update($request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($model->getKey())],
        ]));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Owner saved.']);

        return back();
    }

    public function destroy(Request $request, int $user): RedirectResponse
    {
        $tenant = Tenant::currentOrFail();
        abort_unless($tenant->users()->whereKey($user)->exists(), 404);

        if ((int) ($request->user()?->getAuthIdentifier() ?? 0) === $user) {
            throw ValidationException::withMessages(['owner' => 'You cannot remove yourself.']);
        }

        if ($tenant->users()->count() <= 1) {
            throw ValidationException::withMessages(['owner' => 'A store needs at least one owner.']);
        }

        $tenant->users()->detach($user);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Owner removed.']);

        return back();
    }
}
