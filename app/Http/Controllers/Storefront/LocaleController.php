<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Middleware\SetStorefrontLocale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LocaleController extends Controller
{
    public function __invoke(Request $request, string $locale): RedirectResponse
    {
        if (! in_array($locale, SetStorefrontLocale::SUPPORTED, true)) {
            $locale = SetStorefrontLocale::DEFAULT;
        }

        return redirect(
            $request->headers->get('referer') ?? '/'
        )->withCookie(cookie('sb_locale', $locale, 60 * 24 * 365));
    }
}
