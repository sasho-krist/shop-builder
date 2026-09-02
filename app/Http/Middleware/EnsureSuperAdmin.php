<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates the platform operator panel. Access is a single session flag set by
 * SuperAdmin\SessionController after a successful sign-in — the operator is
 * not a `users` record and has no Laravel auth guard.
 */
class EnsureSuperAdmin
{
    public const SESSION_KEY = 'super_admin';

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->session()->get(self::SESSION_KEY) !== true) {
            if ($request->isMethod('GET') && ! $request->expectsJson()) {
                $request->session()->put('url.intended', $request->fullUrl());
            }

            return redirect()->route('super-admin.login');
        }

        return $next($request);
    }
}
