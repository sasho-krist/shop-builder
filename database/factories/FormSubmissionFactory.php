<?php

namespace Database\Factories;

use App\Models\FormSubmission;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FormSubmission>
 */
class FormSubmissionFactory extends Factory
{
    protected $model = FormSubmission::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'page_id' => null,
            'form_name' => 'Contact form',
            'data' => [
                ['label' => 'Name', 'value' => fake()->name()],
                ['label' => 'Email', 'value' => fake()->safeEmail()],
                ['label' => 'Message', 'value' => fake()->sentence()],
            ],
            'is_read' => false,
        ];
    }
}
