<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves the store for a storefront request from the request host — either a
 * `{slug}.central-domain` subdomain or a connected custom domain — and binds it
 * as the active tenant. Unknown or inactive stores 404.
 */
class ResolveStorefrontTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $host = $request->getHost();
        $central = (string) config('app.central_domain');

        $tenant = str_ends_with($host, '.'.$central)
            ? Tenant::query()->where('slug', substr($host, 0, -strlen('.'.$central)))->first()
            : Tenant::query()->where('custom_domain', $host)->first();

        abort_if($tenant === null, 404);
        abort_unless($tenant->status === 'active', 404);

        Tenant::setCurrent($tenant);

        // Drop the domain param so controllers bind only their path params.
        $request->route()?->forgetParameter('store');

        return $next($request);
    }
}
