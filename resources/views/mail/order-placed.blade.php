@component('mail::message')
# Thank you for your order

Hi {{ $order->customer_name }}, your order **#{{ $order->number }}** is confirmed.

@component('mail::table')
| Item | Qty | Subtotal |
|:-----|:---:|---------:|
@foreach ($order->lines as $line)
| {{ $line->product_title }} — {{ $line->variant_name }} | {{ $line->quantity }} | {{ $line->subtotal }} {{ $symbol }} |
@endforeach
@endcomponent

- Subtotal: {{ $order->subtotal }} {{ $symbol }}
- Shipping: {{ $order->shipping_total }} {{ $symbol }}
@if (bccomp($order->tax_total, '0', 2) > 0)
- Tax: {{ $order->tax_total }} {{ $symbol }}
@endif
- **Total: {{ $order->total }} {{ $symbol }}**

**Ships to:** {{ $order->shipping_address['line1'] ?? '' }}, {{ $order->shipping_address['postal_code'] ?? '' }} {{ $order->shipping_address['city'] ?? '' }}, {{ $order->shipping_address['country'] ?? '' }}

Payment is due on delivery.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
