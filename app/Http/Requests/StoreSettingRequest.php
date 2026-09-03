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
            'stripe_secret' => ['nullable', 'string', 'max:255', 'regex:/^(sk|rk)_(test|live)_[A-Za-z0-9]+$/'],
            'stripe_webhook_secret' => ['nullable', 'string', 'max:255', 'regex:/^whsec_[A-Za-z0-9]+$/'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'stripe_secret.regex' => __('That does not look like a Stripe secret key (it starts with sk_live_ or sk_test_).'),
            'stripe_webhook_secret.regex' => __('That does not look like a Stripe webhook signing secret (it starts with whsec_).'),
        ];
    }
}
