import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { useT } from '@/lib/i18n';

type Plan = { key: string; name: string; price: number; stores: number };

type Subscription = {
    id: number;
    store: string | null;
    type: string;
    status: string;
    price: string | null;
    quantity: number | null;
    trial_ends_at: string | null;
    ends_at: string | null;
    created_at: string | null;
};

type Props = {
    plans: Plan[];
    subscriptions: Subscription[];
};

export default function SuperAdminSubscriptions({
    plans,
    subscriptions,
}: Props) {
    const { t } = useT();

    return (
        <>
            <Head title={t('Subscriptions')} />

            <div className="mb-6">
                <h1 className="text-xl font-semibold">{t('Subscriptions')}</h1>
                <p className="text-muted-foreground text-sm">
                    {t(
                        'Plan breakdown across all stores. Billing rows are filled by Stripe once live.',
                    )}
                </p>
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-3">
                {plans.map((plan) => (
                    <div
                        key={plan.key}
                        className="border-border bg-card rounded-xl border p-4"
                    >
                        <div className="text-muted-foreground text-sm">
                            {plan.name}
                        </div>
                        <div className="mt-1 text-2xl font-semibold tabular-nums">
                            {plan.stores}
                        </div>
                        <div className="text-muted-foreground text-xs">
                            {plan.price === 0
                                ? t('free')
                                : t(':amount / mo', {
                                      amount: `$${plan.price}`,
                                  })}
                        </div>
                    </div>
                ))}
            </div>

            <h2 className="mb-2 text-sm font-semibold">
                {t('Billing records')}
            </h2>
            <div className="border-border overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground text-left">
                        <tr>
                            <th className="px-4 py-2 font-medium">
                                {t('Store')}
                            </th>
                            <th className="px-4 py-2 font-medium">
                                {t('Type')}
                            </th>
                            <th className="px-4 py-2 font-medium">
                                {t('Status')}
                            </th>
                            <th className="px-4 py-2 font-medium">
                                {t('Price ID')}
                            </th>
                            <th className="px-4 py-2 font-medium">
                                {t('Trial ends')}
                            </th>
                            <th className="px-4 py-2 font-medium">
                                {t('Ends')}
                            </th>
                            <th className="px-4 py-2 font-medium">
                                {t('Created')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                        {subscriptions.map((sub) => (
                            <tr key={sub.id}>
                                <td className="px-4 py-3 font-medium">
                                    {sub.store ?? '—'}
                                </td>
                                <td className="px-4 py-3">{sub.type}</td>
                                <td className="px-4 py-3">
                                    <Badge variant="outline">
                                        {sub.status}
                                    </Badge>
                                </td>
                                <td className="text-muted-foreground px-4 py-3">
                                    {sub.price ?? '—'}
                                </td>
                                <td className="text-muted-foreground px-4 py-3">
                                    {sub.trial_ends_at ?? '—'}
                                </td>
                                <td className="text-muted-foreground px-4 py-3">
                                    {sub.ends_at ?? '—'}
                                </td>
                                <td className="text-muted-foreground px-4 py-3">
                                    {sub.created_at ?? '—'}
                                </td>
                            </tr>
                        ))}
                        {subscriptions.length === 0 && (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="text-muted-foreground px-4 py-8 text-center"
                                >
                                    {t(
                                        'No billing records yet — subscriptions appear here once Stripe billing is connected.',
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
