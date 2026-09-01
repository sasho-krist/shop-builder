<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Models\Tenant;
use App\Models\Theme;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PageBuilderTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    private Page $home;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->user = User::factory()->create();
        $this->tenant->users()->attach($this->user, ['role' => 'owner']);
        Tenant::setCurrent($this->tenant);

        Theme::factory()->for($this->tenant)->active()->create();
        $this->home = Page::factory()->for($this->tenant)->home()->create();
    }

    public function test_the_pages_index_and_editor_render(): void
    {
        $this->actingAs($this->user)->get(route('pages.index'))->assertOk();
        $this->actingAs($this->user)->get(route('pages.edit', $this->home))->assertOk();
    }

    public function test_a_page_is_created_with_a_unique_slug(): void
    {
        Page::factory()->for($this->tenant)->create(['slug' => 'about']);

        $this->actingAs($this->user)
            ->post(route('pages.store'), ['title' => 'About'])
            ->assertRedirect();

        $this->assertDatabaseHas('pages', ['tenant_id' => $this->tenant->id, 'title' => 'About', 'slug' => 'about-2']);
    }

    public function test_blocks_are_saved(): void
    {
        $blocks = [
            ['id' => 'a1', 'type' => 'hero', 'props' => ['heading' => 'Hi']],
            ['id' => 'b2', 'type' => 'productGrid', 'props' => ['columns' => 3]],
        ];

        $this->actingAs($this->user)
            ->put(route('pages.update', $this->home), [
                'title' => 'Home',
                'slug' => 'home',
                'is_published' => true,
                'blocks' => $blocks,
            ])
            ->assertRedirect();

        $fresh = $this->home->fresh();
        $this->assertCount(2, $fresh->blocks);
        $this->assertSame('hero', $fresh->blocks[0]['type']);
        $this->assertTrue($fresh->is_published);
    }

    public function test_repeater_sections_save_and_render_on_the_storefront(): void
    {
        $blocks = [
            [
                'id' => 'f1',
                'type' => 'features',
                'props' => [
                    'heading' => 'Why us',
                    'columns' => 3,
                    'items' => [
                        ['icon' => 'leaf', 'title' => 'Natural', 'body' => 'Clean.'],
                        ['icon' => 'truck', 'title' => 'Fast', 'body' => 'Quick.'],
                    ],
                ],
            ],
            [
                'id' => 'a1',
                'type' => 'accordion',
                'props' => [
                    'items' => [
                        ['title' => 'Q1', 'content' => 'A1'],
                        ['title' => 'Q2', 'content' => 'A2'],
                    ],
                ],
            ],
            ['id' => 'h1', 'type' => 'heading', 'props' => ['text' => 'Hello', 'tag' => 'h2']],
        ];

        $this->actingAs($this->user)
            ->put(route('pages.update', $this->home), [
                'title' => 'Home',
                'slug' => 'home',
                'is_published' => true,
                'blocks' => $blocks,
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $fresh = $this->home->fresh();
        $this->assertSame('features', $fresh->blocks[0]['type']);
        $this->assertCount(2, $fresh->blocks[0]['props']['items']);

        $this->get("http://{$this->tenant->slug}.shop-builder.localhost/")
            ->assertOk();
    }

    public function test_unknown_block_types_are_rejected(): void
    {
        $this->actingAs($this->user)
            ->put(route('pages.update', $this->home), [
                'title' => 'Home',
                'slug' => 'home',
                'blocks' => [['id' => 'x', 'type' => 'evil', 'props' => []]],
            ])
            ->assertSessionHasErrors('blocks.0.type');
    }

    public function test_column_containers_nest_blocks_and_reject_bad_nested_types(): void
    {
        $good = [
            [
                'id' => 'k1',
                'type' => 'columns',
                'props' => ['layout' => '1-2', 'gap' => 'md'],
                'columns' => [
                    [
                        ['id' => 'k1a', 'type' => 'heading', 'props' => ['text' => 'Left', 'tag' => 'h3']],
                    ],
                    [
                        ['id' => 'k1b', 'type' => 'image', 'props' => ['image' => '']],
                        ['id' => 'k1c', 'type' => 'button', 'props' => ['label' => 'Go', 'url' => '/products']],
                    ],
                ],
            ],
        ];

        $this->actingAs($this->user)
            ->put(route('pages.update', $this->home), [
                'title' => 'Home',
                'slug' => 'home',
                'is_published' => true,
                'blocks' => $good,
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $fresh = $this->home->fresh();
        $this->assertSame('columns', $fresh->blocks[0]['type']);
        $this->assertCount(2, $fresh->blocks[0]['columns']);
        $this->assertCount(2, $fresh->blocks[0]['columns'][1]);

        $this->get("http://{$this->tenant->slug}.shop-builder.localhost/")
            ->assertOk();

        // a bad type nested in a column is rejected
        $bad = $good;
        $bad[0]['columns'][0][0]['type'] = 'evil';

        $this->actingAs($this->user)
            ->put(route('pages.update', $this->home), [
                'title' => 'Home',
                'slug' => 'home',
                'blocks' => $bad,
            ])
            ->assertSessionHasErrors('blocks');
    }

    public function test_the_home_page_slug_is_locked_and_it_cannot_be_deleted(): void
    {
        $this->actingAs($this->user)
            ->put(route('pages.update', $this->home), [
                'title' => 'Home',
                'slug' => 'landing',
                'blocks' => [],
            ])
            ->assertSessionHasErrors('slug');

        $this->actingAs($this->user)
            ->delete(route('pages.destroy', $this->home))
            ->assertSessionHasErrors('page');

        $this->assertDatabaseHas('pages', ['id' => $this->home->id]);
    }

    public function test_the_shop_page_is_editable_but_not_deletable(): void
    {
        $shop = Page::factory()->for($this->tenant)->shop()->create();

        $this->actingAs($this->user)
            ->get(route('pages.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where(
                'pages',
                fn ($rows) => collect($rows)->contains(
                    fn ($r) => $r['type'] === 'shop',
                ),
            ));

        // sections save, slug stays locked
        $this->actingAs($this->user)
            ->put(route('pages.update', $shop), [
                'title' => 'Our products',
                'slug' => 'anything-else',
                'is_published' => true,
                'blocks' => [
                    ['id' => 'x1', 'type' => 'heading', 'props' => ['text' => 'Browse', 'tag' => 'h2']],
                ],
            ])
            ->assertSessionHasErrors('slug');

        $this->actingAs($this->user)
            ->put(route('pages.update', $shop), [
                'title' => 'Our products',
                'slug' => 'shop',
                'is_published' => true,
                'blocks' => [
                    ['id' => 'x1', 'type' => 'heading', 'props' => ['text' => 'Browse', 'tag' => 'h2']],
                ],
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->actingAs($this->user)
            ->delete(route('pages.destroy', $shop))
            ->assertSessionHasErrors('page');

        // its sections render on /products, with the store heading
        $this->get("http://{$this->tenant->slug}.shop-builder.localhost/products")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('storefront/listing')
                ->where('heading', 'Our products')
                ->where('blocks.0.type', 'heading')
            );
    }

    public function test_cart_and_thankyou_are_system_pages_with_editable_sections(): void
    {
        $cart = Page::factory()->for($this->tenant)->system('cart', 'Cart')->create();
        Page::factory()->for($this->tenant)->system('thankyou', 'Thank you')->create();

        $this->actingAs($this->user)
            ->get(route('pages.index'))
            ->assertInertia(fn ($page) => $page->where(
                'pages',
                fn ($rows) => collect($rows)->pluck('type')->contains('cart')
                    && collect($rows)->pluck('type')->contains('thankyou'),
            ));

        $this->actingAs($this->user)
            ->delete(route('pages.destroy', $cart))
            ->assertSessionHasErrors('page');

        $this->actingAs($this->user)
            ->put(route('pages.update', $cart), [
                'title' => 'Cart',
                'slug' => 'cart',
                'is_published' => true,
                'blocks' => [
                    ['id' => 'c1', 'type' => 'alert', 'props' => ['kind' => 'info', 'title' => 'Note', 'body' => 'x']],
                ],
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->get("http://{$this->tenant->slug}.shop-builder.localhost/cart")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('storefront/cart')
                ->where('blocks.0.type', 'alert'),
            );
    }

    public function test_a_user_cannot_edit_another_tenants_page(): void
    {
        $foreign = Page::factory()->for(Tenant::factory())->create();

        $this->actingAs($this->user)
            ->get(route('pages.edit', $foreign))
            ->assertNotFound();
    }

    public function test_onboarding_creates_a_published_home_page(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('onboarding.store'), [
            'name' => 'New Store',
            'slug' => 'new-store',
        ]);

        $tenant = Tenant::firstWhere('slug', 'new-store');
        $this->assertDatabaseHas('pages', [
            'tenant_id' => $tenant->id,
            'type' => 'home',
            'slug' => 'home',
            'is_published' => true,
        ]);
    }

    public function test_media_upload_returns_a_url(): void
    {
        Storage::fake('public');

        $response = $this->actingAs($this->user)->post(route('media.store'), [
            'file' => UploadedFile::fake()->image('banner.jpg'),
        ]);

        $response->assertOk();
        $this->assertStringContainsString('/storage/tenants/', $response->json('url'));
    }
}
