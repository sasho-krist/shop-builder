<?php

namespace App\Http\Requests;

use App\Services\Payments\PaymentGateway;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('payment_method')) {
            $this->merge(['payment_method' => 'offline']);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $methods = ['offline'];

        if (app(PaymentGateway::class)->enabled()) {
            $methods[] = 'card';
        }

        return [
            'payment_method' => ['required', Rule::in($methods)],
            'email' => ['required', 'email', 'max:255'],
            'customer_name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'address.line1' => ['required', 'string', 'max:255'],
            'address.line2' => ['nullable', 'string', 'max:255'],
            'address.city' => ['required', 'string', 'max:120'],
            'address.postal_code' => ['required', 'string', 'max:20'],
            'address.country' => ['required', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
