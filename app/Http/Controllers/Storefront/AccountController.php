<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function show(): Response|RedirectResponse
    {
        $customer = Auth::guard('customer')->user();

        if (! $customer instanceof Customer) {
            return redirect('/account/login');
        }

        $symbol = Tenant::currentOrFail()->storeSettings()->currency_symbol;

        return Inertia::render('storefront/account', [
            'customer' => [
                'name' => $customer->name,
                'email' => $customer->email,
            ],
            'orders' => $customer->orders()
                ->latest()
                ->get()
                ->map(fn (Order $order): array => [
                    'number' => $order->number,
                    'token' => $order->token,
                    'status' => $order->status,
                    'total' => $order->total,
                    'currency_symbol' => $symbol,
                    'placed_at' => $order->created_at?->toFormattedDateString(),
                ]),
        ]);
    }
}
