<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StoreCustomerManagementTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $owner;

    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->owner = User::factory()->create();
        $this->tenant->users()->attach($this->owner, ['role' => 'owner']);
        Tenant::setCurrent($this->tenant);

        $this->customer = Customer::create([
            'name' => 'Jane Shopper',
            'email' => 'jane@example.com',
            'password' => 'original-pass',
        ]);
    }

    public function test_the_customers_page_lists_store_customers(): void
    {
        $this->actingAs($this->owner)->get(route('customers.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/customers/index')
                ->where('customers.data.0.email', 'jane@example.com')
            );
    }

    public function test_an_owner_can_edit_a_customer(): void
    {
        $this->actingAs($this->owner)->put(route('customers.update', $this->customer), [
            'name' => 'Jane R. Shopper',
            'email' => 'jane.r@example.com',
        ])->assertRedirect();

        $this->customer->refresh();
        $this->assertSame('Jane R. Shopper', $this->customer->name);
        $this->assertSame('jane.r@example.com', $this->customer->email);
    }

    public function test_an_owner_can_reset_a_customer_password(): void
    {
        $this->actingAs($this->owner)->put(route('customers.password', $this->customer), [
            'password' => 'brand-new-pass',
            'password_confirmation' => 'brand-new-pass',
        ])->assertRedirect();

        $this->assertTrue(Hash::check('brand-new-pass', $this->customer->refresh()->password));
    }

    public function test_an_owner_can_delete_a_customer(): void
    {
        $this->actingAs($this->owner)
            ->delete(route('customers.destroy', $this->customer))
            ->assertRedirect();

        Tenant::setCurrent($this->tenant);
        $this->assertSame(0, Customer::query()->count());
    }

    public function test_customers_of_other_stores_are_not_reachable(): void
    {
        $otherStore = Tenant::factory()->create();
        Tenant::setCurrent($otherStore);
        $otherCustomer = Customer::create([
            'name' => 'Someone Else',
            'email' => 'else@example.com',
            'password' => 'pass1234',
        ]);
        Tenant::setCurrent($this->tenant);

        $this->actingAs($this->owner)
            ->put(route('customers.update', $otherCustomer), ['name' => 'x', 'email' => 'x@x.test'])
            ->assertNotFound();
    }
}
