import { Head, Link } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import StorefrontLayout from '@/layouts/storefront-layout';

type Props = {
    order: {
        number: number;
        status: string;
        payment_status: string;
        email: string;
        customer_name: string;
        shipping_address: Record<string, string>;
        subtotal: string;
        shipping_total: string;
        total: string;
        currency: string;
        lines: {
            product_title: string;
            variant_name: string;
            unit_price: string;
            quantity: number;
            subtotal: string;
        }[];
    };
};

export default function StorefrontOrder({ order }: Props) {
    const address = order.shipping_address;

    return (
        <StorefrontLayout>
            <Head title={`Order #${order.number}`} />

            <div
                className="mx-auto w-full max-w-xl px-4 py-14"
                style={{ maxWidth: '640px' }}
            >
                <div className="flex flex-col items-center gap-2 text-center">
                    <CheckCircle2
                        className="size-10"
                        style={{ color: 'var(--sb-primary)' }}
                    />
                    <h1
                        style={{ fontFamily: 'var(--sb-heading-font)' }}
                        className="text-2xl font-bold"
                    >
                        Thank you, {order.customer_name}!
                    </h1>
                    <p style={{ color: 'var(--sb-muted-foreground)' }}>
                        Order #{order.number} is confirmed. A copy was sent to{' '}
                        {order.email}.
                    </p>
                </div>

                <div
                    style={{
                        borderColor: 'var(--sb-border)',
                        borderRadius: 'var(--sb-radius)',
                    }}
                    className="mt-8 border p-5"
                >
                    <ul className="flex flex-col gap-2 text-sm">
                        {order.lines.map((line, index) => (
                            <li
                                key={index}
                                className="flex justify-between gap-2"
                            >
                                <span>
                                    {line.product_title}
                                    <span
                                        style={{
                                            color: 'var(--sb-muted-foreground)',
                                        }}
                                    >
                                        {' '}
                                        · {line.variant_name} × {line.quantity}
                                    </span>
                                </span>
                                <span>{line.subtotal}</span>
                            </li>
                        ))}
                    </ul>
                    <div
                        style={{ borderColor: 'var(--sb-border)' }}
                        className="mt-3 flex flex-col gap-1 border-t pt-3 text-sm"
                    >
                        <div className="flex justify-between">
                            <span
                                style={{ color: 'var(--sb-muted-foreground)' }}
                            >
                                Subtotal
                            </span>
                            <span>{order.subtotal}</span>
                        </div>
                        <div className="flex justify-between">
                            <span
                                style={{ color: 'var(--sb-muted-foreground)' }}
                            >
                                Shipping
                            </span>
                            <span>{order.shipping_total}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                            <span>Total ({order.currency})</span>
                            <span>{order.total}</span>
                        </div>
                    </div>
                </div>

                <div
                    className="mt-6 text-sm"
                    style={{ color: 'var(--sb-muted-foreground)' }}
                >
                    <p className="font-medium text-[color:var(--sb-foreground)]">
                        Ships to
                    </p>
                    <p>
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ''}
                    </p>
                    <p>
                        {address.postal_code} {address.city}, {address.country}
                    </p>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/products" className="underline">
                        Continue shopping
                    </Link>
                </div>
            </div>
        </StorefrontLayout>
    );
}
