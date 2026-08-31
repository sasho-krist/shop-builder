<?php

use App\Models\Page;
use App\Models\Tenant;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Give every store a builder-backed "Shop" page (sections render above the
     * product listing). New stores get one at onboarding; this backfills the
     * rest.
     */
    public function up(): void
    {
        Tenant::query()->each(function (Tenant $tenant): void {
            $exists = Page::withoutGlobalScopes()
                ->where('tenant_id', $tenant->getKey())
                ->where('type', 'shop')
                ->exists();

            if ($exists) {
                return;
            }

            $page = new Page([
                'type' => 'shop',
                'title' => 'Shop',
                'slug' => 'shop',
                'blocks' => [],
                'is_published' => true,
            ]);
            $page->tenant_id = $tenant->getKey();
            $page->save();
        });
    }

    public function down(): void
    {
        Page::withoutGlobalScopes()->where('type', 'shop')->delete();
    }
};
