<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDomainRequest;
use App\Models\Tenant;
use App\Services\Billing\PlanGate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class StoreDomainController extends Controller
{
    public function update(StoreDomainRequest $request, PlanGate $planGate): RedirectResponse
    {
        $tenant = Tenant::currentOrFail();
        $data = $request->validated();

        if (($data['custom_domain'] ?? null) !== null && ! $planGate->allows($tenant, 'custom_domain')) {
            throw ValidationException::withMessages([
                'custom_domain' => __('Custom domains are available on the Pro plan and above.'),
            ]);
        }

        $tenant->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Domain updated.')]);

        return back();
    }
}
