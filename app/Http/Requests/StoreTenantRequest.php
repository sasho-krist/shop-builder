<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreTenantRequest extends FormRequest
{
    /** Subdomains that can never be used as a store slug. */
    public const RESERVED_SLUGS = [
        'www', 'app', 'admin', 'api', 'mail', 'smtp', 'imap', 'ftp', 'ns1', 'ns2',
        'blog', 'help', 'support', 'status', 'docs', 'assets', 'cdn', 'static',
        'dashboard', 'account', 'billing', 'login', 'register', 'onboarding',
    ];

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('slug')) {
            $this->merge(['slug' => Str::slug((string) $this->input('slug'))]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'slug' => [
                'required', 'string', 'min:3', 'max:40',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::notIn(self::RESERVED_SLUGS),
                Rule::unique('tenants', 'slug'),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'slug.regex' => 'The store address may only contain lowercase letters, numbers and hyphens.',
            'slug.not_in' => 'That store address is reserved. Please choose another.',
        ];
    }
}
