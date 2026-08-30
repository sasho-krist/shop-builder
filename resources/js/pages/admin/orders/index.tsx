import { Head, Link, router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';
import { dashboard } from '@/routes';
import orders from '@/routes/orders';

type OrderRow = {
    id: number;
    number: number;
    customer_name: string;
    status: string;
    payment_status: string;
    total: string;
    currency: string;
    lines_count: number;
    created_at: string | null;
};

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
};

type Props = {
    orders: Paginated<OrderRow>;
};

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    pending: 'secondary',
    paid: 'default',
    fulfilled: 'default',
    cancelled: 'outline',
};

export default function OrdersIndex({ orders: page }: Props) {
    const { t } = useT();

    return (
        <>
            <Head title={t('Orders')} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-xl font-semibold">{t('Orders')}</h1>
                    <p className="text-muted-foreground text-sm">
                        {page.total === 1
                            ? t(':count order', { count: page.total })
                            : t(':count orders', { count: page.total })}
                    </p>
                </div>

                {page.data.length === 0 ? (
                    <div className="border-border text-muted-foreground rounded-xl border border-dashed p-12 text-center text-sm">
                        {t('No orders yet.')}
                    </div>
                ) : (
                    <div className="border-border overflow-x-auto rounded-xl border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground text-left">
                                <tr>
                                    <th className="px-4 py-2 font-medium">
                                        {t('Order')}
                                    </th>
                                    <th className="px-4 py-2 font-medium">
                                        {t('Customer')}
                                    </th>
                                    <th className="px-4 py-2 font-medium">
                                        {t('Status')}
                                    </th>
                                    <th className="px-4 py-2 font-medium">
                                        {t('Payment')}
                                    </th>
                                    <th className="px-4 py-2 font-medium">
                                        {t('Total')}
                                    </th>
                                    <th className="px-4 py-2 font-medium">
                                        {t('Placed')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {page.data.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="border-border border-t"
                                    >
                                        <td className="px-4 py-2">
                                            <Link
                                                href={orders.show(order.id).url}
                                                className="font-medium hover:underline"
                                            >
                                                #{order.number}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2">
                                            {order.customer_name}
                                        </td>
                                        <td className="px-4 py-2">
                                            <Badge
                                                variant={
                                                    statusVariant[
                                                        order.status
                                                    ] ?? 'secondary'
                                                }
                                            >
                                                {t(`status.${order.status}`)}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-2">
                                            {t(
                                                `payment.${order.payment_status}`,
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            {order.total} {order.currency}
                                        </td>
                                        <td className="text-muted-foreground px-4 py-2">
                                            {order.created_at ?? '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {page.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            {t('Page :current of :last', {
                                current: page.current_page,
                                last: page.last_page,
                            })}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!page.prev_page_url}
                                onClick={() =>
                                    page.prev_page_url &&
                                    router.visit(page.prev_page_url)
                                }
                            >
                                {t('Previous')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!page.next_page_url}
                                onClick={() =>
                                    page.next_page_url &&
                                    router.visit(page.next_page_url)
                                }
                            >
                                {t('Next')}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

OrdersIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Orders', href: orders.index() },
    ],
};
