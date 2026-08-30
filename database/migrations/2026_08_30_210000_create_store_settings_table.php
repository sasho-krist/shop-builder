<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('currency', 3)->default('BGN');
            $table->string('currency_symbol', 8)->default('лв.');
            $table->string('store_email')->nullable();
            $table->decimal('shipping_flat', 10, 2)->default(0);
            $table->decimal('free_shipping_over', 10, 2)->nullable();
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->boolean('tax_included')->default(true);
            $table->timestamps();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('tax_total', 10, 2)->default(0)->after('shipping_total');
        });
    }

    public function down(): void
    {
        Schema::table('orders', fn (Blueprint $table) => $table->dropColumn('tax_total'));
        Schema::dropIfExists('store_settings');
    }
};
