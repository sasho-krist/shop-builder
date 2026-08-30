<?php

namespace App\Http\Requests;

use App\Models\Collection;
use App\Models\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CollectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $slug = $this->filled('slug') ? $this->input('slug') : $this->input('title');

        $this->merge([
            'slug' => Str::slug((string) $slug),
            'is_visible' => $this->boolean('is_visible'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $collectionId = $this->route('collection') instanceof Collection
            ? $this->route('collection')->id
            : $this->route('collection');

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required', 'string', 'max:255',
                Rule::unique('collections', 'slug')
                    ->where('tenant_id', Tenant::currentOrFail()->id)
                    ->ignore($collectionId),
            ],
            'description' => ['nullable', 'string'],
            'is_visible' => ['boolean'],
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => [
                'integer',
                Rule::exists('products', 'id')->where('tenant_id', Tenant::currentOrFail()->id),
            ],
        ];
    }
}
