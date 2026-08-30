<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves the store for a storefront request from the `{store}` subdomain
 * route parameter (or a matched custom domain) and binds it as the active
 * tenant. Unknown stores 404.
 */
class ResolveStorefrontTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $slug = $request->route('store');

        $tenant = is_string($slug) && $slug !== ''
            ? Tenant::query()->where('slug', $slug)->first()
            : Tenant::query()->where('custom_domain', $request->getHost())->first();

        abort_if($tenant === null, 404);
        abort_unless($tenant->status === 'active', 404);

        Tenant::setCurrent($tenant);

        return $next($request);
    }
}
