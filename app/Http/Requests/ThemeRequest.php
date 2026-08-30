<?php

namespace App\Http\Requests;

use App\Support\Theme\ThemePresets;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ThemeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'tokens' => ['required', 'array'],
            'tokens.colors' => ['required', 'array'],
            'tokens.typography' => ['required', 'array'],
            'tokens.typography.headingFont' => ['required', Rule::in(ThemePresets::FONTS)],
            'tokens.typography.bodyFont' => ['required', Rule::in(ThemePresets::FONTS)],
            'tokens.typography.baseSize' => ['required', 'integer', 'between:12,24'],
            'tokens.typography.scale' => ['required', 'numeric', 'between:1,1.7'],
            'tokens.radius' => ['required', 'integer', 'between:0,32'],
            'tokens.spacing' => ['required', 'integer', 'between:8,40'],
            'tokens.container' => ['required', 'integer', 'between:900,1800'],
            'tokens.buttonStyle' => ['required', Rule::in(ThemePresets::BUTTON_STYLES)],
        ];

        foreach (ThemePresets::COLOR_KEYS as $key) {
            $rules["tokens.colors.{$key}"] = ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'];
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'tokens.colors.*.regex' => 'Colours must be 6-digit hex values like #1a2b3c.',
        ];
    }
}
