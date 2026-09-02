<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Middleware\EnsureSuperAdmin;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Sign-in for the platform operator panel. Credentials come from
 * `config/super-admin.php` (env-overridable); success is a single session
 * flag, checked by the EnsureSuperAdmin middleware.
 */
class SessionController extends Controller
{
    public function create(Request $request): Response|RedirectResponse
    {
        if ($request->session()->get(EnsureSuperAdmin::SESSION_KEY) === true) {
            return redirect()->route('super-admin.stores');
        }

        return Inertia::render('super-admin/login');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $key = 'super-admin-login|'.$request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw ValidationException::withMessages([
                'username' => __('Too many attempts. Try again in :seconds seconds.', [
                    'seconds' => RateLimiter::availableIn($key),
                ]),
            ]);
        }

        if (! $this->credentialsMatch($data['username'], $data['password'])) {
            RateLimiter::hit($key, 60);

            throw ValidationException::withMessages([
                'username' => __('Those credentials do not match.'),
            ]);
        }

        RateLimiter::clear($key);
        $request->session()->regenerate();
        $request->session()->put(EnsureSuperAdmin::SESSION_KEY, true);

        return redirect()->intended(route('super-admin.stores'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->session()->forget(EnsureSuperAdmin::SESSION_KEY);

        return redirect()->route('super-admin.login');
    }

    private function credentialsMatch(string $username, string $password): bool
    {
        if (! hash_equals((string) config('super-admin.username'), $username)) {
            return false;
        }

        $plain = config('super-admin.password');

        if (is_string($plain) && $plain !== '') {
            return hash_equals($plain, $password);
        }

        return Hash::check($password, (string) config('super-admin.password_hash'));
    }
}
