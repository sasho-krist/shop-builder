<?php

namespace App\Http\Requests;

use App\Models\Page;
use App\Models\Tenant;
use App\Support\Blocks\BlockRegistry;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PageRequest extends FormRequest
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
            'is_published' => $this->boolean('is_published'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $routeParam = $this->route('page');
        $pageId = $routeParam instanceof Page ? $routeParam->id : (int) $routeParam;
        $page = $routeParam instanceof Page ? $routeParam : Page::find($pageId);
        $isSystem = $page instanceof Page && in_array($page->type, Page::SYSTEM_TYPES, true);

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required', 'string', 'max:255',
                $isSystem ? 'in:'.($page->slug ?? '') : 'string',
                Rule::unique('pages', 'slug')
                    ->where('tenant_id', Tenant::currentOrFail()->id)
                    ->ignore($pageId),
            ],
            'seo_title' => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string', 'max:500'],
            'is_published' => ['boolean'],
            'blocks' => ['present', 'array'],
            'blocks.*.id' => ['required', 'string', 'max:64'],
            'blocks.*.type' => ['required', Rule::in(BlockRegistry::TYPES)],
            'blocks.*.props' => ['present', 'array'],
            'blocks.*.columns' => ['sometimes', 'array'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $blocks = $this->input('blocks');

            if (! is_array($blocks)) {
                return;
            }

            if (! $this->blockTypesAreValid($blocks)) {
                $validator->errors()->add('blocks', 'A section has an unknown type.');
            }
        });
    }

    /**
     * Walk the block tree (blocks nest inside container columns) and check every
     * `type` against the registry.
     *
     * @param  array<int, mixed>  $blocks
     */
    private function blockTypesAreValid(array $blocks): bool
    {
        foreach ($blocks as $block) {
            if (! is_array($block)) {
                return false;
            }

            $type = $block['type'] ?? null;

            if (! is_string($type) || ! in_array($type, BlockRegistry::TYPES, true)) {
                return false;
            }

            foreach ($block['columns'] ?? [] as $column) {
                if (! is_array($column) || ! $this->blockTypesAreValid($column)) {
                    return false;
                }
            }
        }

        return true;
    }
}
