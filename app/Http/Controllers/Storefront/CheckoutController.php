<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Mail\OrderPlaced;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
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

        return Inertia::render('storefront/checkout', [
            'cart' => $cart->presentation(Tenant::currentOrFail()->storeSettings()),
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

        $order = DB::transaction(function () use ($cart, $data, $settings): Order {
            $nextNumber = (int) Order::query()->lockForUpdate()->max('number') ?: 1000;
            $totals = $cart->totals($settings);

            $order = Order::create([
                'number' => $nextNumber + 1,
                'token' => Str::random(40),
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'payment_method' => 'offline',
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

        Mail::to($order->email)->send(new OrderPlaced($order, $settings));

        return redirect("/order/{$order->token}");
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
                'email' => $order->email,
                'customer_name' => $order->customer_name,
                'shipping_address' => $order->shipping_address,
                'subtotal' => $order->subtotal,
                'shipping_total' => $order->shipping_total,
                'tax_total' => $order->tax_total,
                'total' => $order->total,
                'currency' => $order->currency,
                'currency_symbol' => $settings->currency_symbol,
                'lines' => $order->lines->map(fn ($line): array => [
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
