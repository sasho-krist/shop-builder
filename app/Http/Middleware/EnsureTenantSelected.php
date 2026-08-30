<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Binds the authenticated user's active store for admin routes. Until
 * multi-store support lands, a user has exactly one store; if they have
 * none they are sent to onboarding to create it.
 */
class EnsureTenantSelected
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = $request->user()?->tenants()->first();

        if ($tenant === null) {
            return redirect()->route('onboarding.create');
        }

        Tenant::setCurrent($tenant);

        return $next($request);
    }
}
