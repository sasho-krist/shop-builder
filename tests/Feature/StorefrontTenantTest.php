<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class StorefrontTenantTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_store_subdomain_resolves_its_tenant(): void
    {
        $tenant = Tenant::factory()->create(['slug' => 'acme', 'name' => 'Acme Supplies']);
        Page::factory()->for($tenant)->home()->create(['blocks' => []]);

        $this->get('http://acme.shop-builder.localhost/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('storefront/home')
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
