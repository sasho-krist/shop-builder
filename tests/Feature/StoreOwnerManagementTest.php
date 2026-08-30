<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StoreOwnerManagementTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->owner = User::factory()->create(['name' => 'First Owner']);
        $this->tenant->users()->attach($this->owner, ['role' => 'owner']);
        Tenant::setCurrent($this->tenant);
    }

    public function test_the_owners_page_lists_store_members(): void
    {
        $this->actingAs($this->owner)->get(route('owners.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/owners/index')
                ->where('owners.0.email', $this->owner->email)
                ->where('owners.0.is_you', true)
            );
    }

    public function test_an_owner_can_add_a_brand_new_owner(): void
    {
        $this->actingAs($this->owner)->post(route('owners.store'), [
            'name' => 'Second Owner',
            'email' => 'second@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertRedirect();

        $user = User::query()->where('email', 'second@example.com')->firstOrFail();
        $this->assertTrue(Hash::check('password123', $user->password));
        $this->assertTrue($this->tenant->users()->whereKey($user->id)->exists());
    }

    public function test_adding_an_existing_user_attaches_them_without_a_new_account(): void
    {
        $existing = User::factory()->create(['email' => 'existing@example.com']);

        $this->actingAs($this->owner)->post(route('owners.store'), [
            'name' => 'Existing Person',
            'email' => 'existing@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertRedirect();

        $this->assertSame(1, User::query()->where('email', 'existing@example.com')->count());
        $this->assertTrue($this->tenant->users()->whereKey($existing->id)->exists());
    }

    public function test_adding_someone_who_already_manages_the_store_is_rejected(): void
    {
        $this->actingAs($this->owner)->post(route('owners.store'), [
            'name' => 'First Owner',
            'email' => $this->owner->email,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertSessionHasErrors('email');
    }

    public function test_editing_an_owner_changes_name_and_email_but_not_password(): void
    {
        $other = User::factory()->create(['password' => Hash::make('original-pass')]);
        $this->tenant->users()->attach($other, ['role' => 'owner']);

        $this->actingAs($this->owner)->put(route('owners.update', $other), [
            'name' => 'Renamed',
            'email' => 'renamed@example.com',
            'password' => 'hacked-attempt',
        ])->assertRedirect();

        $other->refresh();
        $this->assertSame('Renamed', $other->name);
        $this->assertSame('renamed@example.com', $other->email);
        $this->assertTrue(Hash::check('original-pass', $other->password));
    }

    public function test_an_owner_cannot_remove_themselves(): void
    {
        $other = User::factory()->create();
        $this->tenant->users()->attach($other, ['role' => 'owner']);

        $this->actingAs($this->owner)
            ->delete(route('owners.destroy', $this->owner))
            ->assertSessionHasErrors('owner');

        $this->assertTrue($this->tenant->users()->whereKey($this->owner->id)->exists());
    }

    public function test_the_last_owner_cannot_be_removed(): void
    {
        $second = User::factory()->create();
        $this->tenant->users()->attach($second, ['role' => 'owner']);

        // Removing the second owner is fine.
        $this->actingAs($this->owner)->delete(route('owners.destroy', $second))->assertRedirect();
        $this->assertSame(1, $this->tenant->users()->count());

        // Now the store has one owner; a self-remove would leave none.
        $this->actingAs($this->owner)
            ->delete(route('owners.destroy', $this->owner))
            ->assertSessionHasErrors('owner');
    }

    public function test_owners_of_other_stores_are_not_reachable(): void
    {
        $otherStore = Tenant::factory()->create();
        $stranger = User::factory()->create();
        $otherStore->users()->attach($stranger, ['role' => 'owner']);

        $this->actingAs($this->owner)
            ->put(route('owners.update', $stranger), ['name' => 'x', 'email' => 'x@x.test'])
            ->assertNotFound();

        $this->actingAs($this->owner)
            ->delete(route('owners.destroy', $stranger))
            ->assertNotFound();
    }
}
