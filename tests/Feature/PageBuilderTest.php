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
