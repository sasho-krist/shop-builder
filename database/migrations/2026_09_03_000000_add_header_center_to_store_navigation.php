<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('store_navigation', function (Blueprint $table) {
            // { type: none|search|contact|text, text, phone, email }
            $table->json('header_center')->nullable()->after('footer_note');
        });
    }

    public function down(): void
    {
        Schema::table('store_navigation', function (Blueprint $table) {
            $table->dropColumn('header_center');
        });
    }
};
