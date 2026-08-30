<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductImageTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->tenant = Tenant::factory()->create();
        $this->user = User::factory()->create();
        $this->tenant->users()->attach($this->user, ['role' => 'owner']);
        Tenant::setCurrent($this->tenant);

        $this->product = Product::factory()->for($this->tenant)->create();
    }

    public function test_images_can_be_uploaded_to_a_product(): void
    {
        $this->actingAs($this->user)
            ->post(route('products.images.store', $this->product), [
                'images' => [
                    UploadedFile::fake()->image('one.jpg', 640, 480),
                    UploadedFile::fake()->image('two.jpg', 800, 800),
                ],
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('product_images', 2);

        $images = $this->product->images()->get();
        $this->assertSame([0, 1], $images->pluck('position')->all());
        $this->assertSame($this->tenant->id, $images->first()->tenant_id);

        foreach ($images as $image) {
            Storage::disk('public')->assertExists($image->path);
        }
    }

    public function test_non_images_are_rejected(): void
    {
        $this->actingAs($this->user)
            ->post(route('products.images.store', $this->product), [
                'images' => [UploadedFile::fake()->create('notes.pdf', 20, 'application/pdf')],
            ])
            ->assertSessionHasErrors('images.0');

        $this->assertDatabaseCount('product_images', 0);
    }

    public function test_images_can_be_reordered(): void
    {
        $this->actingAs($this->user)->post(route('products.images.store', $this->product), [
            'images' => [
                UploadedFile::fake()->image('a.jpg'),
                UploadedFile::fake()->image('b.jpg'),
                UploadedFile::fake()->image('c.jpg'),
            ],
        ]);

        $ids = $this->product->images()->pluck('id')->all();
        $reversed = array_reverse($ids);

        $this->actingAs($this->user)
            ->put(route('products.images.reorder', $this->product), ['ids' => $reversed])
            ->assertRedirect();

        $this->assertSame($reversed, $this->product->images()->orderBy('position')->pluck('id')->all());
    }

    public function test_alt_text_can_be_updated(): void
    {
        $this->actingAs($this->user)->post(route('products.images.store', $this->product), [
            'images' => [UploadedFile::fake()->image('a.jpg')],
        ]);
        $image = $this->product->images()->first();

        $this->actingAs($this->user)
            ->patch(route('products.images.update', [$this->product, $image]), ['alt' => 'Front label'])
            ->assertRedirect();

        $this->assertSame('Front label', $image->fresh()->alt);
    }

    public function test_deleting_an_image_removes_the_row_and_the_file(): void
    {
        $this->actingAs($this->user)->post(route('products.images.store', $this->product), [
            'images' => [UploadedFile::fake()->image('a.jpg')],
        ]);
        $image = $this->product->images()->first();

        $this->actingAs($this->user)
            ->delete(route('products.images.destroy', [$this->product, $image]))
            ->assertRedirect();

        $this->assertDatabaseMissing('product_images', ['id' => $image->id]);
        Storage::disk('public')->assertMissing($image->path);
    }

    public function test_images_cannot_be_uploaded_to_another_tenants_product(): void
    {
        $foreign = Product::factory()->for(Tenant::factory())->create();

        $this->actingAs($this->user)
            ->post(route('products.images.store', $foreign), [
                'images' => [UploadedFile::fake()->image('a.jpg')],
            ])
            ->assertNotFound();

        $this->assertDatabaseCount('product_images', 0);
    }
}
