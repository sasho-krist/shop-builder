import { Head, Link, router } from '@inertiajs/react';
import { useT } from '@/lib/i18n';
import StorefrontLayout from '@/layouts/storefront-layout';
import { money } from '@/lib/money';

type Order = {
    number: number;
    token: string;
    status: string;
    total: string;
    currency_symbol: string;
    placed_at: string | null;
};

type Props = {
    customer: { name: string; email: string };
    orders: Order[];
};

export default function StorefrontAccount({ customer, orders }: Props) {
    const { t } = useT();

    function logout() {
        router.post('/account/logout');
    }

    return (
        <StorefrontLayout>
            <Head title={t('My account')} />

            <div
                className="mx-auto w-full px-5 py-10 sm:px-8"
                style={{ maxWidth: 'var(--sb-container)' }}
            >
                <div className="mb-8 flex items-start justify-between gap-4">
                    <div>
                        <h1
                            style={{ fontFamily: 'var(--sb-heading-font)' }}
                            className="text-3xl font-bold"
                        >
                            {customer.name}
                        </h1>
                        <p
                            style={{ color: 'var(--sb-muted-foreground)' }}
                            className="text-sm"
                        >
                            {customer.email}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={logout}
                        style={{ borderColor: 'var(--sb-border)' }}
                        className="rounded-md border px-3 py-1.5 text-sm"
                    >
                        {t('Sign out')}
                    </button>
                </div>

                <h2 className="mb-3 font-semibold">{t('Order history')}</h2>

                {orders.length === 0 ? (
                    <p style={{ color: 'var(--sb-muted-foreground)' }}>
                        {t('No orders yet.')}{' '}
                        <Link href="/products" className="underline">
                            {t('Start shopping')}
                        </Link>
                    </p>
                ) : (
                    <div
                        style={{
                            borderColor: 'var(--sb-border)',
                            borderRadius: 'var(--sb-radius)',
                        }}
                        className="overflow-hidden border"
                    >
                        <table className="w-full text-sm">
                            <thead>
                                <tr
                                    style={{
                                        background: 'var(--sb-muted)',
                                        color: 'var(--sb-muted-foreground)',
                                    }}
                                >
                                    <th className="px-4 py-2 text-left font-medium">
                                        {t('Order')}
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium">
                                        {t('Date')}
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium">
                                        {t('Status')}
                                    </th>
                                    <th className="px-4 py-2 text-right font-medium">
                                        {t('Total')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr
                                        key={order.token}
                                        style={{
                                            borderColor: 'var(--sb-border)',
                                        }}
                                        className="border-t"
                                    >
                                        <td className="px-4 py-2">
                                            <Link
                                                href={`/order/${order.token}`}
                                                className="underline"
                                            >
                                                #{order.number}
                                            </Link>
                                        </td>
                                        <td
                                            className="px-4 py-2"
                                            style={{
                                                color: 'var(--sb-muted-foreground)',
                                            }}
                                        >
                                            {order.placed_at ?? '—'}
                                        </td>
                                        <td className="px-4 py-2 capitalize">
                                            {t(order.status)}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            {money(
                                                order.total,
                                                order.currency_symbol,
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}
