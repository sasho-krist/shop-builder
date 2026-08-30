import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useT } from '@/lib/i18n';
import { dashboard } from '@/routes';
import orderRoutes from '@/routes/orders';

type Line = {
    product_title: string;
    variant_name: string;
    sku: string | null;
    unit_price: string;
    quantity: number;
    subtotal: string;
};

type Props = {
    order: {
        id: number;
        number: number;
        status: string;
        payment_status: string;
        payment_method: string;
        email: string;
        customer_name: string;
        phone: string | null;
        shipping_address: Record<string, string>;
        notes: string | null;
        subtotal: string;
        shipping_total: string;
        tax_total: string;
        total: string;
        currency: string;
        currency_symbol: string;
        created_at: string | null;
        lines: Line[];
        payments: Payment[];
    };
    statuses: string[];
};

type Payment = {
    provider: string;
    status: string;
    amount: string;
    reference: string | null;
    created_at: string | null;
};

const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded'];

export default function OrderShow({ order, statuses }: Props) {
    const { t } = useT();
    const form = useForm({
        status: order.status,
        payment_status: order.payment_status,
    });

    const address = order.shipping_address;

    function save() {
        form.patch(orderRoutes.update(order.id).url, { preserveScroll: true });
    }

    return (
        <>
            <Head title={t('Order #:number', { number: order.number })} />

            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">
                            {t('Order #:number', { number: order.number })}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {order.created_at} ·{' '}
                            {t(`method.${order.payment_method}`)}
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('Items')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 text-sm">
                        {order.lines.map((line, index) => (
                            <div
                                key={index}
                                className="flex justify-between gap-2"
                            >
                                <span>
                                    {line.product_title}
                                    <span className="text-muted-foreground">
                                        {' '}
                                        · {line.variant_name} × {line.quantity}
                                    </span>
                                </span>
                                <span>{line.subtotal}</span>
                            </div>
                        ))}
                        <div className="mt-2 flex justify-between border-t pt-2">
                            <span className="text-muted-foreground">
                                {t('Subtotal')}
                            </span>
                            <span>{order.subtotal}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                {t('Shipping')}
                            </span>
                            <span>{order.shipping_total}</span>
                        </div>
                        {order.tax_total !== '0.00' && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    {t('Tax')}
                                </span>
                                <span>{order.tax_total}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-semibold">
                            <span>
                                {t('Total')} ({order.currency})
                            </span>
                            <span>{order.total}</span>
                        </div>
                    </CardContent>
                </Card>

                {order.payments.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Payments')}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2 text-sm">
                            {order.payments.map((payment, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between gap-2"
                                >
                                    <span>
                                        <span className="capitalize">
                                            {payment.provider}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {' '}
                                            · {payment.created_at}
                                        </span>
                                        {payment.reference && (
                                            <span className="text-muted-foreground block font-mono text-xs">
                                                {payment.reference}
                                            </span>
                                        )}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <span>{payment.amount}</span>
                                        <span className="bg-muted rounded-full px-2 py-0.5 text-xs">
                                            {t(`payment.${payment.status}`)}
                                        </span>
                                    </span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-6 sm:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Customer')}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <p className="font-medium">{order.customer_name}</p>
                            <p className="text-muted-foreground">
                                {order.email}
                            </p>
                            {order.phone && (
                                <p className="text-muted-foreground">
                                    {order.phone}
                                </p>
                            )}
                            <p className="mt-3">
                                {address.line1}
                                {address.line2 ? `, ${address.line2}` : ''}
                            </p>
                            <p>
                                {address.postal_code} {address.city},{' '}
                                {address.country}
                            </p>
                            {order.notes && (
                                <p className="text-muted-foreground mt-3 italic">
                                    “{order.notes}”
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Status')}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="grid gap-2">
                                <Label>{t('Order status')}</Label>
                                <Select
                                    value={form.data.status}
                                    onValueChange={(value) =>
                                        form.setData('status', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statuses.map((status) => (
                                            <SelectItem
                                                key={status}
                                                value={status}
                                            >
                                                {t(`status.${status}`)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>{t('Payment')}</Label>
                                <Select
                                    value={form.data.payment_status}
                                    onValueChange={(value) =>
                                        form.setData('payment_status', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAYMENT_STATUSES.map((status) => (
                                            <SelectItem
                                                key={status}
                                                value={status}
                                            >
                                                {t(`payment.${status}`)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                type="button"
                                onClick={save}
                                disabled={form.processing}
                            >
                                {form.processing && <Spinner />}
                                {t('Update')}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

OrderShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Orders', href: orderRoutes.index() },
    ],
};
