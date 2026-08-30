@component('mail::message')
# {{ __('Thank you for your order') }}

{{ __('Hi :name, your order #:number is confirmed.', ['name' => $order->customer_name, 'number' => $order->number]) }}

@component('mail::table')
| {{ __('Item') }} | {{ __('Qty') }} | {{ __('Subtotal') }} |
|:-----|:---:|---------:|
@foreach ($order->lines as $line)
| {{ $line->product_title }} — {{ $line->variant_name }} | {{ $line->quantity }} | {{ $line->subtotal }} {{ $symbol }} |
@endforeach
@endcomponent

- {{ __('Subtotal') }}: {{ $order->subtotal }} {{ $symbol }}
- {{ __('Shipping') }}: {{ $order->shipping_total }} {{ $symbol }}
@if (bccomp($order->tax_total, '0', 2) > 0)
- {{ __('Tax') }}: {{ $order->tax_total }} {{ $symbol }}
@endif
- **{{ __('Total') }}: {{ $order->total }} {{ $symbol }}**

**{{ __('Ships to') }}:** {{ $order->shipping_address['line1'] ?? '' }}, {{ $order->shipping_address['postal_code'] ?? '' }} {{ $order->shipping_address['city'] ?? '' }}, {{ $order->shipping_address['country'] ?? '' }}

@if ($order->payment_method === 'card')
{{ __('Payment received — thank you.') }}
@else
{{ __('Payment is due on delivery.') }}
@endif

{{ __('Thanks,') }}<br>
{{ $order->tenant->name ?? config('app.name') }}
@endcomponent
