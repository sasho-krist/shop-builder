<?php

namespace App\Http\Middleware;

use App\Models\Cart;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves (or creates) the visitor's cart for storefront requests and binds
 * it into the container. The cart is keyed by a long-lived `sb_cart` cookie.
 */
class ResolveCart
{
    public const COOKIE = 'sb_cart';

    public function handle(Request $request, Closure $next): Response
    {
        $cookie = $request->cookie(self::COOKIE);
        $token = is_string($cookie) ? $cookie : '';

        $cart = $token !== ''
            ? Cart::query()->where('token', $token)->first()
            : null;

        if ($cart === null) {
            $token = Str::random(40);
            $cart = Cart::create(['token' => $token]);
            Cookie::queue(self::COOKIE, $token, 60 * 24 * 30);
        }

        app()->instance(Cart::class, $cart);

        return $next($request);
    }
}
