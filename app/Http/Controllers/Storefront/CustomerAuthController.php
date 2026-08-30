<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\CustomerRegisterRequest;
use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CustomerAuthController extends Controller
{
    public function showRegister(): Response|RedirectResponse
    {
        return $this->redirectIfAuthed() ?? Inertia::render('storefront/auth/register');
    }

    public function register(CustomerRegisterRequest $request): RedirectResponse
    {
        $customer = Customer::create($request->validated());
        Auth::guard('customer')->login($customer, remember: true);
        $request->session()->regenerate();

        return redirect('/account');
    }

    public function showLogin(): Response|RedirectResponse
    {
        return $this->redirectIfAuthed() ?? Inertia::render('storefront/auth/login');
    }

    public function login(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['boolean'],
        ]);

        if (! Auth::guard('customer')->attempt(
            ['email' => $data['email'], 'password' => $data['password']],
            (bool) ($data['remember'] ?? false),
        )) {
            throw ValidationException::withMessages([
                'email' => __('Those credentials do not match our records.'),
            ]);
        }

        $request->session()->regenerate();

        return redirect('/account');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('customer')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    private function redirectIfAuthed(): ?RedirectResponse
    {
        return Auth::guard('customer')->check() ? redirect('/account') : null;
    }
}
