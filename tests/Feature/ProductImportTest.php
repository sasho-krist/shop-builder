<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Testing\File;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ProductImportTest extends TestCase
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

    private function csv(string $contents): File
    {
        return UploadedFile::fake()->createWithContent('products.csv', $contents);
    }

    public function test_preview_returns_headers_and_rows(): void
    {
        $file = $this->csv("Name,Price,Stock\nGreen Tea,12.50,10\nBlack Coffee,9.00,5\n");

        $this->actingAs($this->user)
            ->post(route('products.import.preview'), ['file' => $file])
            ->assertOk()
            ->assertJson([
                'headers' => ['Name', 'Price', 'Stock'],
                'rows' => [['Green Tea', '12.50', '10'], ['Black Coffee', '9.00', '5']],
            ]);
    }

    public function test_products_are_created_from_a_mapped_csv(): void
    {
        Category::factory()->for($this->tenant)->create(['name' => 'Drinks']);

        $file = $this->csv(
            "Name,Price,Stock,SKU,Cat\n".
            "Green Tea,12.50,10,GT-1,Drinks\n".
            "Black Coffee,9.00,5,BC-1,Drinks\n".
            ",1,1,BAD,Drinks\n"
        );

        $this->actingAs($this->user)
            ->post(route('products.import.store'), [
                'file' => $file,
                'mapping' => [
                    'title' => 'Name',
                    'price' => 'Price',
                    'stock' => 'Stock',
                    'sku' => 'SKU',
                    'category' => 'Cat',
                ],
            ])
            ->assertRedirect(route('products.index', absolute: false));

        $this->assertDatabaseCount('products', 2);

        $tea = Product::firstWhere('slug', 'green-tea');
        $this->assertNotNull($tea);
        $variant = $tea->variants()->firstWhere('name', 'Default');
        $this->assertSame('12.50', $variant->price);
        $this->assertSame(10, $variant->stock_quantity);
        $this->assertSame(1, $tea->categories()->where('name', 'Drinks')->count());
    }

    public function test_re_importing_updates_existing_products_by_slug(): void
    {
        $this->actingAs($this->user)->post(route('products.import.store'), [
            'file' => $this->csv("Name,Price\nGreen Tea,10.00\n"),
            'mapping' => ['title' => 'Name', 'price' => 'Price'],
        ]);

        $this->actingAs($this->user)->post(route('products.import.store'), [
            'file' => $this->csv("Name,Price\nGreen Tea,14.00\n"),
            'mapping' => ['title' => 'Name', 'price' => 'Price'],
        ]);

        $this->assertDatabaseCount('products', 1);
        $this->assertSame(
            '14.00',
            Product::firstWhere('slug', 'green-tea')->variants()->first()->price,
        );
    }

    public function test_a_mapping_without_a_title_column_is_rejected(): void
    {
        $this->actingAs($this->user)->post(route('products.import.store'), [
            'file' => $this->csv("Name,Price\nGreen Tea,10.00\n"),
            'mapping' => ['price' => 'Price'],
        ])->assertSessionHasErrors('mapping.title');
    }
}
