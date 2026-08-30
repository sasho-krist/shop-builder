import { Head, Link } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { useT } from '@/lib/i18n';
import StorefrontLayout from '@/layouts/storefront-layout';
import { money } from '@/lib/money';

type Props = {
    order: {
        number: number;
        status: string;
        payment_status: string;
        payment_method: string;
        email: string;
        customer_name: string;
        shipping_address: Record<string, string>;
        subtotal: string;
        shipping_total: string;
        tax_total: string;
        total: string;
        currency: string;
        currency_symbol: string;
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
    const { t } = useT();
    const address = order.shipping_address;

    return (
        <StorefrontLayout>
            <Head title={`${t('Order')} #${order.number}`} />

            <div
                className="mx-auto w-full max-w-xl px-5 py-14 sm:px-8"
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
                        {t('Thank you, :name!', { name: order.customer_name })}
                    </h1>
                    <p style={{ color: 'var(--sb-muted-foreground)' }}>
                        {t(
                            'Order #:number is confirmed. A copy was sent to :email.',
                            {
                                number: order.number,
                                email: order.email,
                            },
                        )}
                    </p>
                    <span
                        style={{
                            background:
                                order.payment_status === 'paid'
                                    ? 'var(--sb-primary)'
                                    : 'var(--sb-muted)',
                            color:
                                order.payment_status === 'paid'
                                    ? 'var(--sb-primary-foreground)'
                                    : 'var(--sb-muted-foreground)',
                        }}
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    >
                        {order.payment_status === 'paid'
                            ? t('Paid')
                            : order.payment_method === 'card'
                              ? t('Awaiting payment confirmation')
                              : t('Payment on delivery')}
                    </span>
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
                                <span>
                                    {money(
                                        line.subtotal,
                                        order.currency_symbol,
                                    )}
                                </span>
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
                                {t('Subtotal')}
                            </span>
                            <span>
                                {money(order.subtotal, order.currency_symbol)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span
                                style={{ color: 'var(--sb-muted-foreground)' }}
                            >
                                {t('Shipping')}
                            </span>
                            <span>
                                {money(
                                    order.shipping_total,
                                    order.currency_symbol,
                                )}
                            </span>
                        </div>
                        {order.tax_total !== '0.00' && (
                            <div className="flex justify-between">
                                <span
                                    style={{
                                        color: 'var(--sb-muted-foreground)',
                                    }}
                                >
                                    {t('Tax')}
                                </span>
                                <span>
                                    {money(
                                        order.tax_total,
                                        order.currency_symbol,
                                    )}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between font-semibold">
                            <span>
                                {t('Total')} ({order.currency})
                            </span>
                            <span>
                                {money(order.total, order.currency_symbol)}
                            </span>
                        </div>
                    </div>
                </div>

                <div
                    className="mt-6 text-sm"
                    style={{ color: 'var(--sb-muted-foreground)' }}
                >
                    <p className="font-medium text-[color:var(--sb-foreground)]">
                        {t('Ships to')}
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
                        {t('Continue shopping')}
                    </Link>
                </div>
            </div>
        </StorefrontLayout>
    );
}
