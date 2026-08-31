<?php

use App\Models\Page;
use App\Models\Tenant;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Give every store the Cart and Thank-you builder pages (sections render
     * around the cart contents / order confirmation).
     */
    public function up(): void
    {
        Tenant::query()->each(function (Tenant $tenant): void {
            Page::seedSystemPages($tenant->getKey());
        });
    }

    public function down(): void
    {
        Page::withoutGlobalScopes()
            ->whereIn('type', ['cart', 'thankyou'])
            ->delete();
    }
};
