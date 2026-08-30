<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

/**
 * Picks the storefront language from the `sb_locale` cookie. Bulgarian is the
 * default; English is available via the header switcher.
 */
class SetStorefrontLocale
{
    public const SUPPORTED = ['bg', 'en'];

    public const DEFAULT = 'bg';

    public function handle(Request $request, Closure $next): Response
    {
        $cookie = $request->cookie('sb_locale');
        $locale = is_string($cookie) && in_array($cookie, self::SUPPORTED, true)
            ? $cookie
            : self::DEFAULT;

        App::setLocale($locale);

        return $next($request);
    }
}
