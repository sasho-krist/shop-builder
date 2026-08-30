<?php

namespace App\Http\Requests;

use App\Models\Page;
use App\Models\Tenant;
use App\Support\Blocks\BlockRegistry;
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
        $isHome = $page instanceof Page && $page->type === 'home';

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required', 'string', 'max:255',
                $isHome ? 'in:home' : 'string',
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
        ];
    }
}
