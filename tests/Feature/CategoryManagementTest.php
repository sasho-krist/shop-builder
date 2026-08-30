<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryManagementTest extends TestCase
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

    public function test_the_categories_index_renders(): void
    {
        $this->actingAs($this->user)->get(route('categories.index'))->assertOk();
    }

    public function test_a_category_is_created_with_an_auto_slug(): void
    {
        $this->actingAs($this->user)
            ->post(route('categories.store'), ['name' => 'Vitamins & Supplements'])
            ->assertRedirect();

        $this->assertDatabaseHas('categories', [
            'tenant_id' => $this->tenant->id,
            'name' => 'Vitamins & Supplements',
            'slug' => 'vitamins-supplements',
            'parent_id' => null,
        ]);
    }

    public function test_a_subcategory_can_be_nested_under_a_parent(): void
    {
        $parent = Category::factory()->for($this->tenant)->create();

        $this->actingAs($this->user)
            ->post(route('categories.store'), [
                'name' => 'Vitamin D',
                'parent_id' => $parent->id,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('categories', [
            'name' => 'Vitamin D',
            'parent_id' => $parent->id,
        ]);
    }

    public function test_slugs_are_unique_per_tenant(): void
    {
        Category::factory()->for($this->tenant)->create(['slug' => 'herbs']);

        $this->actingAs($this->user)
            ->post(route('categories.store'), ['name' => 'Herbs', 'slug' => 'herbs'])
            ->assertSessionHasErrors('slug');
    }

    public function test_a_category_cannot_be_its_own_parent(): void
    {
        $category = Category::factory()->for($this->tenant)->create();

        $this->actingAs($this->user)
            ->put(route('categories.update', $category), [
                'name' => $category->name,
                'parent_id' => $category->id,
            ])
            ->assertSessionHasErrors('parent_id');
    }

    public function test_a_category_cannot_be_moved_under_its_own_descendant(): void
    {
        $root = Category::factory()->for($this->tenant)->create();
        $child = Category::factory()->for($this->tenant)->create(['parent_id' => $root->id]);

        $this->actingAs($this->user)
            ->put(route('categories.update', $root), [
                'name' => $root->name,
                'parent_id' => $child->id,
            ])
            ->assertSessionHasErrors('parent_id');
    }

    public function test_deleting_a_parent_promotes_its_children_to_the_root(): void
    {
        $root = Category::factory()->for($this->tenant)->create();
        $child = Category::factory()->for($this->tenant)->create(['parent_id' => $root->id]);

        $this->actingAs($this->user)
            ->delete(route('categories.destroy', $root))
            ->assertRedirect();

        $this->assertDatabaseMissing('categories', ['id' => $root->id]);
        $this->assertDatabaseHas('categories', ['id' => $child->id, 'parent_id' => null]);
    }

    public function test_a_user_cannot_parent_a_category_to_another_tenants_category(): void
    {
        $foreign = Category::factory()->for(Tenant::factory())->create();

        $this->actingAs($this->user)
            ->post(route('categories.store'), [
                'name' => 'Sneaky',
                'parent_id' => $foreign->id,
            ])
            ->assertSessionHasErrors('parent_id');
    }

    public function test_a_user_cannot_delete_another_tenants_category(): void
    {
        $foreign = Category::factory()->for(Tenant::factory())->create();

        $this->actingAs($this->user)
            ->delete(route('categories.destroy', $foreign))
            ->assertNotFound();

        $this->assertDatabaseHas('categories', ['id' => $foreign->id]);
    }

    public function test_products_can_be_assigned_to_categories(): void
    {
        $a = Category::factory()->for($this->tenant)->create();
        $b = Category::factory()->for($this->tenant)->create();

        $this->actingAs($this->user)->post(route('products.store'), [
            'title' => 'Multivitamin',
            'status' => 'active',
            'variants' => [['name' => 'Default', 'price' => '15.00', 'stock_quantity' => '5']],
            'category_ids' => [$a->id, $b->id],
        ])->assertRedirect(route('products.index', absolute: false));

        $product = Product::firstWhere('title', 'Multivitamin');
        $this->assertEqualsCanonicalizing([$a->id, $b->id], $product->categories->pluck('id')->all());
    }

    public function test_a_product_cannot_be_assigned_another_tenants_category(): void
    {
        $foreign = Category::factory()->for(Tenant::factory())->create();

        $this->actingAs($this->user)->post(route('products.store'), [
            'title' => 'Nope',
            'status' => 'draft',
            'variants' => [['name' => 'Default', 'price' => '1.00', 'stock_quantity' => '0']],
            'category_ids' => [$foreign->id],
        ])->assertSessionHasErrors('category_ids.0');
    }
}
