<?php

namespace Tests\Feature;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class StorefrontTenantTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_store_subdomain_resolves_its_tenant(): void
    {
        Tenant::factory()->create(['slug' => 'acme', 'name' => 'Acme Supplies']);

        $this->get('http://acme.shop-builder.localhost/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('storefront/coming-soon')
                ->where('store.name', 'Acme Supplies')
            );
    }

    public function test_an_unknown_store_subdomain_returns_404(): void
    {
        $this->get('http://nope.shop-builder.localhost/')->assertNotFound();
    }

    public function test_a_suspended_store_returns_404(): void
    {
        Tenant::factory()->create(['slug' => 'acme', 'status' => 'suspended']);

        $this->get('http://acme.shop-builder.localhost/')->assertNotFound();
    }

    public function test_the_central_domain_still_serves_the_marketing_page(): void
    {
        $this->get('http://shop-builder.localhost/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->component('welcome'));
    }
}
