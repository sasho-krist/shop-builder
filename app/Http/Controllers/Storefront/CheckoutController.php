<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Mail\OrderPlaced;
use App\Models\Cart;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\Tenant;
use App\Services\Payments\PaymentGateway;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function show(): Response|RedirectResponse
    {
        $cart = app(Cart::class);
        $cart->loadMissing('items');

        if ($cart->items->isEmpty()) {
            return redirect('/cart');
        }

        $customer = Auth::guard('customer')->user();

        return Inertia::render('storefront/checkout', [
            'cart' => $cart->presentation(Tenant::currentOrFail()->storeSettings()),
            'customer' => $customer instanceof Customer
                ? ['name' => $customer->name, 'email' => $customer->email]
                : null,
            'cardPaymentsEnabled' => app(PaymentGateway::class)->enabled(),
        ]);
    }

    public function store(CheckoutRequest $request): RedirectResponse
    {
        $cart = app(Cart::class);
        $cart->load('items.variant.product');

        if ($cart->items->isEmpty()) {
            return redirect('/cart');
        }

        $settings = Tenant::currentOrFail()->storeSettings();
        $data = $request->validated();
        $payWithCard = $data['payment_method'] === 'card' && app(PaymentGateway::class)->enabled();

        $order = DB::transaction(function () use ($cart, $data, $settings, $payWithCard): Order {
            $nextNumber = (int) Order::query()->lockForUpdate()->max('number') ?: 1000;
            $totals = $cart->totals($settings);

            $order = Order::create([
                'customer_id' => Auth::guard('customer')->id(),
                'number' => $nextNumber + 1,
                'token' => Str::random(40),
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'payment_method' => $payWithCard ? 'card' : 'offline',
                'email' => $data['email'],
                'customer_name' => $data['customer_name'],
                'phone' => $data['phone'] ?? null,
                'shipping_address' => $data['address'],
                'notes' => $data['notes'] ?? null,
                'subtotal' => $totals['subtotal'],
                'shipping_total' => $totals['shipping'],
                'tax_total' => $totals['tax'],
                'total' => $totals['total'],
                'currency' => $settings->currency,
            ]);

            foreach ($cart->items as $item) {
                $variant = $item->variant;

                $order->lines()->create([
                    'product_variant_id' => $variant->id,
                    'product_title' => $variant->product->title,
                    'variant_name' => $variant->name,
                    'sku' => $variant->sku,
                    'unit_price' => $variant->price,
                    'quantity' => $item->quantity,
                    'subtotal' => $item->subtotal(),
                ]);
            }

            $cart->items()->delete();

            return $order;
        });

        if ($payWithCard) {
            return $this->startCardPayment($order);
        }

        Mail::to($order->email)->send(new OrderPlaced($order, $settings));

        return redirect("/order/{$order->token}");
    }

    private function startCardPayment(Order $order): RedirectResponse
    {
        $gateway = app(PaymentGateway::class);
        $base = Tenant::currentOrFail()->storefrontUrl();

        $payment = $order->payments()->create([
            'provider' => 'stripe',
            'status' => 'pending',
            'amount' => $order->total,
            'currency' => $order->currency,
        ]);

        $session = $gateway->createCheckoutSession(
            $order,
            "{$base}/order/{$order->token}",
            "{$base}/checkout",
        );

        $payment->update(['provider_ref' => $session->id]);

        // Leave the Inertia app for Stripe's hosted checkout page.
        return redirect()->away($session->url);
    }

    public function confirmation(string $token): Response
    {
        $order = Order::query()->where('token', $token)->with('lines')->firstOrFail();
        $settings = Tenant::currentOrFail()->storeSettings();

        return Inertia::render('storefront/order', [
            'order' => [
                'number' => $order->number,
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'payment_method' => $order->payment_method,
                'email' => $order->email,
                'customer_name' => $order->customer_name,
                'shipping_address' => $order->shipping_address,
                'subtotal' => $order->subtotal,
                'shipping_total' => $order->shipping_total,
                'tax_total' => $order->tax_total,
                'total' => $order->total,
                'currency' => $order->currency,
                'currency_symbol' => $settings->currency_symbol,
                'lines' => $order->lines->map(fn (OrderLine $line): array => [
                    'product_title' => $line->product_title,
                    'variant_name' => $line->variant_name,
                    'unit_price' => $line->unit_price,
                    'quantity' => $line->quantity,
                    'subtotal' => $line->subtotal,
                ]),
            ],
        ]);
    }
}
