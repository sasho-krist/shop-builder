<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Category links are now added to the menu as explicit, editable rows (the nav
 * editor's "Add all categories" button) instead of an auto-append toggle. Before
 * dropping the flag, bake the categories it was auto-showing into real rows so
 * every store's current menu stays the same.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (DB::table('store_navigation')->where('show_category_nav', true)->get() as $nav) {
            $links = json_decode((string) $nav->header_links, true) ?: [];
            $present = array_column(
                array_filter($links, fn ($l): bool => is_array($l) && ($l['type'] ?? null) === 'category'),
                'value',
            );

            $categories = DB::table('categories')
                ->where('tenant_id', $nav->tenant_id)
                ->whereNull('parent_id')
                ->orderBy('position')
                ->orderBy('name')
                ->get(['name', 'slug']);

            foreach ($categories as $category) {
                if (! in_array($category->slug, $present, true)) {
                    $links[] = ['label' => $category->name, 'type' => 'category', 'value' => $category->slug];
                }
            }

            DB::table('store_navigation')
                ->where('id', $nav->id)
                ->update(['header_links' => json_encode($links)]);
        }

        Schema::table('store_navigation', function (Blueprint $table) {
            $table->dropColumn('show_category_nav');
        });
    }

    public function down(): void
    {
        Schema::table('store_navigation', function (Blueprint $table) {
            $table->boolean('show_category_nav')->default(true);
        });
    }
};
