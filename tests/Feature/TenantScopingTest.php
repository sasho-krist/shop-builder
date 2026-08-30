<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Tenant;
use App\Support\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantScopingTest extends TestCase
{
    use RefreshDatabase;

    public function test_queries_only_return_the_current_tenants_rows(): void
    {
        $a = Tenant::factory()->create();
        $b = Tenant::factory()->create();

        Product::factory()->for($a)->count(2)->create();
        Product::factory()->for($b)->count(3)->create();

        Tenant::setCurrent($a);
        $this->assertSame(2, Product::count());

        Tenant::setCurrent($b);
        $this->assertSame(3, Product::count());
    }

    public function test_new_models_inherit_the_current_tenant_id(): void
    {
        $tenant = Tenant::factory()->create();
        Tenant::setCurrent($tenant);

        $product = Product::create([
            'title' => 'Scoped',
            'slug' => 'scoped',
            'status' => 'draft',
        ]);

        $this->assertSame($tenant->id, $product->tenant_id);
    }

    public function test_without_a_current_tenant_no_scope_is_applied(): void
    {
        app(TenantContext::class)->forget();

        Product::factory()->for(Tenant::factory())->count(2)->create();
        Product::factory()->for(Tenant::factory())->count(2)->create();

        $this->assertSame(4, Product::count());
    }
}
