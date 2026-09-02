<?php

namespace App\Http\Requests;

use App\Support\Storefront\NavLinks;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreNavigationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'header_links' => $this->cleanLinks($this->input('header_links')),
            'footer_links' => $this->cleanLinks($this->input('footer_links')),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'header_links' => ['array', 'max:12'],
            'header_links.*.label' => ['required', 'string', 'max:60'],
            'header_links.*.type' => ['required', Rule::in(NavLinks::TYPES)],
            'header_links.*.value' => ['nullable', 'string', 'max:255'],
            'footer_links' => ['array', 'max:20'],
            'footer_links.*.label' => ['required', 'string', 'max:60'],
            'footer_links.*.type' => ['required', Rule::in(NavLinks::TYPES)],
            'footer_links.*.value' => ['nullable', 'string', 'max:255'],
            'footer_note' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Drop rows the editor left completely blank.
     *
     * @return array<int, mixed>
     */
    private function cleanLinks(mixed $links): array
    {
        if (! is_array($links)) {
            return [];
        }

        return array_values(array_filter($links, function (mixed $link): bool {
            return is_array($link) && trim((string) ($link['label'] ?? '')) !== '';
        }));
    }
}
