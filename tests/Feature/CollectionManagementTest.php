<?php

namespace Tests\Feature;

use App\Models\Collection;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CollectionManagementTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->user = User::factory()->create();
        $this->tenant->users()->attach($this->user, ['role' => 'owner']);
        Tenant::setCurrent($this->tenant);
    }

    public function test_the_collections_index_renders(): void
    {
        $this->actingAs($this->user)->get(route('collections.index'))->assertOk();
    }

    public function test_a_collection_is_created_with_ordered_products(): void
    {
        $a = Product::factory()->for($this->tenant)->create();
        $b = Product::factory()->for($this->tenant)->create();

        $response = $this->actingAs($this->user)->post(route('collections.store'), [
            'title' => 'Summer Picks',
            'is_visible' => true,
            'product_ids' => [$b->id, $a->id],
        ]);

        $collection = Collection::firstWhere('slug', 'summer-picks');
        $this->assertNotNull($collection);
        $response->assertRedirect(route('collections.edit', $collection, absolute: false));

        $this->assertSame(
            [$b->id, $a->id],
            $collection->products()->pluck('products.id')->all(),
        );
        $this->assertSame($this->tenant->id, $collection->tenant_id);
    }

    public function test_slugs_are_unique_per_tenant(): void
    {
        Collection::factory()->for($this->tenant)->create(['slug' => 'sale']);

        $this->actingAs($this->user)
            ->post(route('collections.store'), ['title' => 'Sale', 'slug' => 'sale'])
            ->assertSessionHasErrors('slug');
    }

    public function test_updating_replaces_and_reorders_the_products(): void
    {
        $collection = Collection::factory()->for($this->tenant)->create();
        $one = Product::factory()->for($this->tenant)->create();
        $two = Product::factory()->for($this->tenant)->create();
        $three = Product::factory()->for($this->tenant)->create();
        $collection->products()->sync([$one->id => ['position' => 0], $two->id => ['position' => 1]]);

        $this->actingAs($this->user)
            ->put(route('collections.update', $collection), [
                'title' => $collection->title,
                'is_visible' => false,
                'product_ids' => [$three->id, $one->id],
            ])
            ->assertRedirect(route('collections.edit', $collection, absolute: false));

        $this->assertFalse($collection->fresh()->is_visible);
        $this->assertSame(
            [$three->id, $one->id],
            $collection->products()->pluck('products.id')->all(),
        );
    }

    public function test_a_collection_cannot_include_another_tenants_product(): void
    {
        $foreign = Product::factory()->for(Tenant::factory())->create();

        $this->actingAs($this->user)
            ->post(route('collections.store'), [
                'title' => 'Bad',
                'product_ids' => [$foreign->id],
            ])
            ->assertSessionHasErrors('product_ids.0');
    }

    public function test_a_user_cannot_delete_another_tenants_collection(): void
    {
        $foreign = Collection::factory()->for(Tenant::factory())->create();

        $this->actingAs($this->user)
            ->delete(route('collections.destroy', $foreign))
            ->assertNotFound();

        $this->assertDatabaseHas('collections', ['id' => $foreign->id]);
    }

    public function test_product_search_returns_only_the_current_tenants_products(): void
    {
        Product::factory()->for($this->tenant)->create(['title' => 'Green Tea']);
        Product::factory()->for($this->tenant)->create(['title' => 'Black Coffee']);
        Product::factory()->for(Tenant::factory())->create(['title' => 'Green Smoothie']);

        $response = $this->actingAs($this->user)->getJson(route('products.search', ['q' => 'green']));

        $response->assertOk();
        $titles = array_column($response->json(), 'title');
        $this->assertSame(['Green Tea'], $titles);
    }
}
