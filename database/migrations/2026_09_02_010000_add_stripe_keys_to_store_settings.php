<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('store_settings', function (Blueprint $table) {
            // Each store connects its own Stripe account for storefront card
            // payments, so money goes straight to the merchant.
            $table->text('stripe_secret')->nullable()->after('tax_included');
            $table->text('stripe_webhook_secret')->nullable()->after('stripe_secret');
        });
    }

    public function down(): void
    {
        Schema::table('store_settings', function (Blueprint $table) {
            $table->dropColumn(['stripe_secret', 'stripe_webhook_secret']);
        });
    }
};
