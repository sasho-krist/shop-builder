<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Middleware\SetUserLocale;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LocaleController extends Controller
{
    /**
     * Switch the signed-in user's admin-panel language.
     */
    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'locale' => ['required', 'string', 'in:'.implode(',', SetUserLocale::SUPPORTED)],
        ]);

        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $user->update(['locale' => $data['locale']]);

        return back();
    }
}
