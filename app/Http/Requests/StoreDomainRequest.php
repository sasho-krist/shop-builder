<?php

namespace App\Http\Requests;

use App\Models\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDomainRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $domain = $this->string('custom_domain')->trim()->lower()->value();
        $domain = preg_replace('#^https?://#', '', $domain) ?? '';
        $domain = rtrim($domain, '/');

        $this->merge(['custom_domain' => $domain === '' ? null : $domain]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $central = (string) config('app.central_domain');

        return [
            'custom_domain' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/',
                'not_regex:/'.preg_quote($central, '/').'$/',
                Rule::unique('tenants', 'custom_domain')->ignore(Tenant::currentOrFail()->id),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'custom_domain.regex' => __('Enter a bare domain like shop.example.com (no https://, no path).'),
            'custom_domain.not_regex' => __('Use your own domain here, not a :domain subdomain.', ['domain' => (string) config('app.central_domain')]),
            'custom_domain.unique' => __('That domain is already connected to another store.'),
        ];
    }
}
