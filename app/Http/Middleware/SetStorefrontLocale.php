<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

/**
 * The storefront is Bulgarian only.
 */
class SetStorefrontLocale
{
    public const LOCALE = 'bg';

    public function handle(Request $request, Closure $next): Response
    {
        App::setLocale(self::LOCALE);

        return $next($request);
    }
}
