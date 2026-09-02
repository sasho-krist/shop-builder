<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

/**
 * The admin panel, marketing site and auth screens are Bulgarian only.
 */
class SetUserLocale
{
    public const LOCALE = 'bg';

    public function handle(Request $request, Closure $next): Response
    {
        App::setLocale(self::LOCALE);

        return $next($request);
    }
}
