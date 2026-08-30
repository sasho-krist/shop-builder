<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(): Response
    {
        $orders = Order::query()
            ->withCount('lines')
            ->latest()
            ->paginate(20)
            ->through(fn (Order $order): array => [
                'id' => $order->id,
                'number' => $order->number,
                'customer_name' => $order->customer_name,
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'total' => $order->total,
                'currency' => $order->currency,
                'lines_count' => $order->lines_count,
                'created_at' => $order->created_at?->diffForHumans(),
            ]);

        return Inertia::render('admin/orders/index', ['orders' => $orders]);
    }

    public function show(int $order): Response
    {
        $model = Order::with('lines')->findOrFail($order);

        return Inertia::render('admin/orders/show', [
            'order' => [
                'id' => $model->id,
                'number' => $model->number,
                'status' => $model->status,
                'payment_status' => $model->payment_status,
                'payment_method' => $model->payment_method,
                'email' => $model->email,
                'customer_name' => $model->customer_name,
                'phone' => $model->phone,
                'shipping_address' => $model->shipping_address,
                'notes' => $model->notes,
                'subtotal' => $model->subtotal,
                'shipping_total' => $model->shipping_total,
                'total' => $model->total,
                'currency' => $model->currency,
                'created_at' => $model->created_at?->toDayDateTimeString(),
                'lines' => $model->lines->map(fn ($line): array => [
                    'product_title' => $line->product_title,
                    'variant_name' => $line->variant_name,
                    'sku' => $line->sku,
                    'unit_price' => $line->unit_price,
                    'quantity' => $line->quantity,
                    'subtotal' => $line->subtotal,
                ]),
            ],
            'statuses' => Order::STATUSES,
        ]);
    }

    public function update(Request $request, int $order): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(Order::STATUSES)],
            'payment_status' => ['required', Rule::in(['unpaid', 'paid', 'refunded'])],
        ]);

        Order::findOrFail($order)->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Order updated.']);

        return back();
    }
}
