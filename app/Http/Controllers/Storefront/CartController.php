<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('storefront/cart', ['cart' => $this->payload()]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'variant_id' => ['required', 'integer'],
            'quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        $variant = ProductVariant::query()->findOrFail((int) $data['variant_id']);
        $cart = $this->cart();

        $item = $cart->items()->firstOrNew(['product_variant_id' => $variant->id]);
        $item->quantity = min(99, ($item->quantity ?? 0) + $data['quantity']);
        $item->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Added to cart.']);

        return back();
    }

    public function update(Request $request, int $item): RedirectResponse
    {
        $data = $request->validate(['quantity' => ['required', 'integer', 'min:0', 'max:99']]);

        $model = $this->cart()->items()->findOrFail($item);

        if ($data['quantity'] === 0) {
            $model->delete();
        } else {
            $model->update(['quantity' => $data['quantity']]);
        }

        return back();
    }

    public function destroy(int $item): RedirectResponse
    {
        $this->cart()->items()->findOrFail($item)->delete();

        return back();
    }

    private function cart(): Cart
    {
        return app(Cart::class);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(): array
    {
        $cart = $this->cart();
        $cart->load(['items.variant.product.images']);

        return [
            'items' => $cart->items->map(function (CartItem $item): array {
                $variant = $item->variant;
                $product = $variant->product;

                return [
                    'id' => $item->id,
                    'quantity' => $item->quantity,
                    'unit_price' => $variant->price,
                    'subtotal' => $item->subtotal(),
                    'variant_name' => $variant->name,
                    'product_title' => $product->title,
                    'product_slug' => $product->slug,
                    'image' => $product->images->first()?->url(),
                ];
            })->all(),
            'subtotal' => $cart->subtotal(),
            'count' => $cart->itemCount(),
        ];
    }
}
