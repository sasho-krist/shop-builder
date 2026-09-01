<?php

namespace Tests\Feature;

use App\Models\FormSubmission;
use App\Models\Page;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Theme\ThemePresets;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class FormSubmissionTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $store;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Tenant::factory()->create(['slug' => 'acme']);
        $this->user = User::factory()->create();
        $this->store->users()->attach($this->user, ['role' => 'owner']);

        Page::factory()->for($this->store)->home()->create(['blocks' => []]);
        $this->store->themes()->create([
            'name' => 'Default',
            'tokens' => ThemePresets::minimal(),
            'is_active' => true,
        ]);
    }

    private function url(string $path = ''): string
    {
        return "http://acme.shop-builder.localhost/{$path}";
    }

    public function test_a_contact_page_can_hold_a_contact_form_section(): void
    {
        Tenant::setCurrent($this->store);
        $page = Page::factory()->for($this->store)->create(['slug' => 'contact', 'title' => 'Contact']);

        $this->actingAs($this->user)
            ->put(route('pages.update', $page), [
                'title' => 'Contact',
                'slug' => 'contact',
                'is_published' => true,
                'blocks' => [
                    [
                        'id' => 'f1',
                        'type' => 'contactForm',
                        'props' => [
                            'title' => 'Write to us',
                            'fields' => [
                                ['label' => 'Name', 'type' => 'text', 'options' => '', 'width' => 'half', 'required' => true],
                                ['label' => 'Method', 'type' => 'radio', 'options' => "Email\nPhone", 'width' => 'full', 'required' => false],
                            ],
                        ],
                    ],
                ],
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertSame('contactForm', $page->fresh()->blocks[0]['type']);
    }

    public function test_a_storefront_form_submission_is_stored(): void
    {
        Tenant::setCurrent($this->store);
        $page = Page::factory()->for($this->store)->create([
            'slug' => 'contact', 'title' => 'Contact', 'is_published' => true,
        ]);
        Tenant::forgetCurrent();

        $this->postJson($this->url('forms'), [
            'page' => 'contact',
            'form_name' => 'Write to us',
            'fields' => [
                ['label' => 'Name', 'value' => 'Ada'],
                ['label' => 'Subscribe', 'value' => true],
            ],
        ])->assertOk()->assertJson(['ok' => true]);

        $submission = FormSubmission::withoutGlobalScopes()->firstOrFail();
        $this->assertSame($this->store->id, $submission->tenant_id);
        $this->assertSame($page->id, $submission->page_id);
        $this->assertSame('Write to us', $submission->form_name);
        $this->assertSame('Ada', $submission->data[0]['value']);
        $this->assertSame('Yes', $submission->data[1]['value']);
    }

    public function test_the_honeypot_silently_drops_bot_submissions(): void
    {
        $this->postJson($this->url('forms'), [
            'company_website' => 'http://spam.example',
            'fields' => [['label' => 'Name', 'value' => 'bot']],
        ])->assertOk();

        $this->assertSame(0, FormSubmission::withoutGlobalScopes()->count());
    }

    public function test_the_messages_screen_lists_marks_and_deletes(): void
    {
        Tenant::setCurrent($this->store);
        $message = FormSubmission::factory()->for($this->store)->create(['is_read' => false]);
        Tenant::forgetCurrent();

        $this->actingAs($this->user)
            ->get(route('messages.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('admin/messages/index')
                ->where('unread', 1)
                ->where('messages.data', fn ($rows) => count($rows) === 1)
            );

        $this->actingAs($this->user)
            ->patch(route('messages.update', $message), ['is_read' => true])
            ->assertRedirect();
        $this->assertTrue($message->fresh()->is_read);

        $this->actingAs($this->user)
            ->delete(route('messages.destroy', $message))
            ->assertRedirect();
        $this->assertSame(0, FormSubmission::withoutGlobalScopes()->count());
    }

    public function test_a_tenant_cannot_see_another_stores_messages(): void
    {
        $other = Tenant::factory()->create(['slug' => 'other']);
        Tenant::setCurrent($other);
        FormSubmission::factory()->for($other)->create();
        Tenant::forgetCurrent();

        $this->actingAs($this->user)
            ->get(route('messages.index'))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('messages.data', fn ($rows) => count($rows) === 0)
            );
    }
}
