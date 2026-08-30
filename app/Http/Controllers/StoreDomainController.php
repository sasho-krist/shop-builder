<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDomainRequest;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class StoreDomainController extends Controller
{
    public function update(StoreDomainRequest $request): RedirectResponse
    {
        Tenant::currentOrFail()->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Domain updated.']);

        return back();
    }
}
