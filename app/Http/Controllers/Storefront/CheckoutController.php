<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Storefront\Concerns\BuildsSectionContext;
use App\Http\Requests\CheckoutRequest;
use App\Models\Cart;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\Page;
use App\Models\Tenant;
use App\Services\Billing\PlanGate;
use App\Services\Payments\PaymentGateway;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class CheckoutController extends Controller
{
    use BuildsSectionContext;

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
            'cardPaymentsEnabled' => $this->cardPaymentsAvailable(),
        ]);
    }

    private function cardPaymentsAvailable(): bool
    {
        return app(PaymentGateway::class)->enabled()
            && app(PlanGate::class)->allows(Tenant::currentOrFail(), 'card_payments');
    }

    public function store(CheckoutRequest $request): HttpResponse
    {
        $cart = app(Cart::class);
        $cart->load('items.variant.product');

        if ($cart->items->isEmpty()) {
            return redirect('/cart');
        }

        $settings = Tenant::currentOrFail()->storeSettings();
        $data = $request->validated();
        $payWithCard = $data['payment_method'] === 'card' && $this->cardPaymentsAvailable();

        // Resume an unfinished card payment rather than duplicating the order
        // when the shopper comes back from Stripe and submits again.
        if ($payWithCard && ($resumed = $this->resumableCardOrder($request)) !== null) {
            return $this->startCardPayment($request, $resumed);
        }

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
                'locale' => App::getLocale(),
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

            // A card order keeps the cart until Stripe confirms payment, so
            // "cancel" on Stripe's page still leaves something to check out.
            if (! $payWithCard) {
                $cart->items()->delete();
            }

            return $order;
        });

        if ($payWithCard) {
            return $this->startCardPayment($request, $order);
        }

        $order->sendConfirmation($settings);

        return redirect("/order/{$order->token}");
    }

    private function resumableCardOrder(Request $request): ?Order
    {
        $token = $request->session()->get('card_checkout_order');

        if (! is_string($token)) {
            return null;
        }

        return Order::query()
            ->where('token', $token)
            ->where('payment_method', 'card')
            ->where('payment_status', 'unpaid')
            ->where('created_at', '>', now()->subMinutes(30))
            ->first();
    }

    private function startCardPayment(Request $request, Order $order): HttpResponse
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
        $request->session()->put('card_checkout_order', $order->token);

        // Stripe's hosted checkout is a different origin, so hand the Inertia
        // client a hard redirect rather than a follow-me XHR.
        return Inertia::location($session->url);
    }

    public function confirmation(Request $request, string $token): Response
    {
        $order = Order::query()->where('token', $token)->with('lines')->firstOrFail();
        $settings = Tenant::currentOrFail()->storeSettings();

        // Reaching this page for a recent card order means Stripe checkout
        // completed (cancel lands on /checkout), so the cart can be emptied.
        if ($order->payment_method === 'card' && $order->created_at?->gt(now()->subDay())) {
            app(Cart::class)->items()->delete();
            $request->session()->forget('card_checkout_order');
        }

        $page = Page::query()->where('type', 'thankyou')->first();

        return Inertia::render('storefront/order', [
            'blocks' => $page instanceof Page ? $page->blocks : [],
            'sections' => $this->sectionContext(),
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
