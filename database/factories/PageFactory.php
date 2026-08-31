<?php

namespace Database\Factories;

use App\Models\Page;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Page>
 */
class PageFactory extends Factory
{
    protected $model = Page::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = Str::title(rtrim(fake()->unique()->sentence(2), '.'));

        return [
            'tenant_id' => Tenant::factory(),
            'type' => 'page',
            'title' => $title,
            'slug' => Str::slug($title),
            'blocks' => [],
            'seo_title' => null,
            'seo_description' => null,
            'is_published' => false,
        ];
    }

    public function home(): static
    {
        return $this->state(['type' => 'home', 'title' => 'Home', 'slug' => 'home', 'is_published' => true]);
    }

    public function shop(): static
    {
        return $this->state(['type' => 'shop', 'title' => 'Shop', 'slug' => 'shop', 'is_published' => true]);
    }

    public function system(string $type, string $title): static
    {
        return $this->state(['type' => $type, 'title' => $title, 'slug' => $type, 'is_published' => true]);
    }
}
