<?php

namespace App\Http\Requests;

use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $slug = $this->filled('slug') ? $this->input('slug') : $this->input('title');

        $this->merge(['slug' => Str::slug((string) $slug)]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $productId = $this->route('product') instanceof Product
            ? $this->route('product')->id
            : $this->route('product');

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required', 'string', 'max:255',
                Rule::unique('products', 'slug')
                    ->where('tenant_id', Tenant::currentOrFail()->id)
                    ->ignore($productId),
            ],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(Product::STATUSES)],
            'seo_title' => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string', 'max:500'],

            'options' => ['nullable', 'array', 'max:3'],
            'options.*.name' => ['required', 'string', 'max:60'],
            'options.*.values' => ['required', 'array', 'min:1', 'max:20'],
            'options.*.values.*' => ['required', 'string', 'max:60'],

            'variants' => ['required', 'array', 'min:1'],
            'variants.*.id' => ['nullable', 'integer'],
            'variants.*.name' => ['required', 'string', 'max:255'],
            'variants.*.options' => ['nullable', 'array'],
            'variants.*.sku' => ['nullable', 'string', 'max:255'],
            'variants.*.price' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'variants.*.compare_at_price' => ['nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'variants.*.stock_quantity' => ['required', 'integer', 'min:0'],

            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => [
                'integer',
                Rule::exists('categories', 'id')->where('tenant_id', Tenant::currentOrFail()->id),
            ],
        ];
    }
}
