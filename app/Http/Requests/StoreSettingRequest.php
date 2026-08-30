<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['tax_included' => $this->boolean('tax_included')]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'currency' => ['required', 'string', 'size:3'],
            'currency_symbol' => ['required', 'string', 'max:8'],
            'store_email' => ['nullable', 'email', 'max:255'],
            'shipping_flat' => ['required', 'numeric', 'min:0', 'max:99999'],
            'free_shipping_over' => ['nullable', 'numeric', 'min:0', 'max:99999'],
            'tax_rate' => ['required', 'numeric', 'between:0,100'],
            'tax_included' => ['boolean'],
        ];
    }
}
