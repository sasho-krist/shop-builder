<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

/**
 * Applies the signed-in admin user's language preference to the whole panel.
 * Storefront requests are handled separately by SetStorefrontLocale, which runs
 * after this and wins there.
 */
class SetUserLocale
{
    public const SUPPORTED = ['bg', 'en'];

    public const DEFAULT = 'bg';

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user instanceof User) {
            $locale = in_array($user->locale, self::SUPPORTED, true)
                ? $user->locale
                : self::DEFAULT;

            App::setLocale($locale);
        }

        return $next($request);
    }
}
