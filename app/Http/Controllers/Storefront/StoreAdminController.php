<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOwnerRegisterRequest;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * `{store}.domain/admin` — where a store owner signs in to (or claims) the
 * store. On success the browser is sent to the central admin panel; the shared
 * session (see SESSION_DOMAIN) carries the login across. The redirect uses
 * `Inertia::location` because the admin lives on a different origin.
 */
class StoreAdminController extends Controller
{
    public function show(Request $request): Response|InertiaResponse
    {
        $tenant = Tenant::currentOrFail();

        if ($this->manages($request->user(), $tenant)) {
            return Inertia::location($this->dashboardUrl());
        }

        return Inertia::render('storefront/admin-entry', [
            'storeName' => $tenant->name,
        ]);
    }

    public function login(Request $request): Response
    {
        $tenant = Tenant::currentOrFail();

        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt(['email' => $data['email'], 'password' => $data['password']], remember: true)) {
            throw ValidationException::withMessages([
                'email' => 'Those credentials do not match our records.',
            ]);
        }

        if (! $this->manages($request->user(), $tenant)) {
            Auth::logout();

            throw ValidationException::withMessages([
                'email' => "This account doesn't manage {$tenant->name}.",
            ]);
        }

        $request->session()->regenerate();
        $request->session()->put('active_tenant_id', $tenant->getKey());

        return Inertia::location($this->dashboardUrl());
    }

    public function register(StoreOwnerRegisterRequest $request): Response
    {
        $tenant = Tenant::currentOrFail();
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        $tenant->users()->attach($user, ['role' => 'owner']);

        Auth::login($user, remember: true);
        $request->session()->regenerate();
        $request->session()->put('active_tenant_id', $tenant->getKey());

        return Inertia::location($this->dashboardUrl());
    }

    /**
     * Leave the owner session while staying on the storefront (the "exit owner
     * view" action in the editing bar).
     */
    public function logout(Request $request): Response
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    private function manages(?object $user, Tenant $tenant): bool
    {
        return $user instanceof User
            && $user->tenants()->whereKey($tenant->getKey())->exists();
    }

    private function dashboardUrl(): string
    {
        return rtrim((string) config('app.url'), '/').'/dashboard';
    }
}
