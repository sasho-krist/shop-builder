<?php

namespace App\Http\Requests;

use App\Models\Category;
use App\Models\Tenant;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $slug = $this->filled('slug') ? $this->input('slug') : $this->input('name');

        $this->merge(['slug' => Str::slug((string) $slug)]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $categoryId = $this->currentCategoryId();

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required', 'string', 'max:255',
                Rule::unique('categories', 'slug')
                    ->where('tenant_id', Tenant::currentOrFail()->id)
                    ->ignore($categoryId),
            ],
            'description' => ['nullable', 'string'],
            'parent_id' => [
                'nullable', 'integer',
                Rule::exists('categories', 'id')->where('tenant_id', Tenant::currentOrFail()->id),
            ],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $categoryId = $this->currentCategoryId();
            $parentId = $this->input('parent_id');

            if ($categoryId === null || $parentId === null) {
                return;
            }

            if ((int) $parentId === $categoryId) {
                $validator->errors()->add('parent_id', 'A category cannot be its own parent.');

                return;
            }

            $all = Category::query()->get(['id', 'parent_id']);
            $category = $all->firstWhere('id', $categoryId);

            if ($category !== null && in_array((int) $parentId, $category->descendantIds($all), true)) {
                $validator->errors()->add('parent_id', 'A category cannot be moved under one of its own subcategories.');
            }
        });
    }

    private function currentCategoryId(): ?int
    {
        $route = $this->route('category');

        return $route instanceof Category ? $route->id : ($route === null ? null : (int) $route);
    }
}
