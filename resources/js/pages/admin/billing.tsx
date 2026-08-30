import { Head, router } from '@inertiajs/react';
import { Check, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type Translator, useT } from '@/lib/i18n';
import { dashboard } from '@/routes';
import { checkout, portal, show as billingShow } from '@/routes/billing';

type Limits = {
    products: number | null;
    staff: number | null;
    custom_domain: boolean;
    card_payments: boolean;
};

type PlanCard = {
    key: string;
    name: string;
    price: number;
    subscribable: boolean;
    limits: Limits;
};

type Props = {
    currentPlan: string;
    billingEnabled: boolean;
    subscriptionActive: boolean;
    onGracePeriod: boolean;
    endsAt: string | null;
    usage: Record<string, { used: number; limit: number | null }>;
    plans: PlanCard[];
};

function cap(limit: number | null, t: Translator): string {
    return limit === null ? t('Unlimited') : String(limit);
}

function UsageBar({
    used,
    limit,
    t,
}: {
    used: number;
    limit: number | null;
    t: Translator;
}) {
    const pct =
        limit === null || limit === 0
            ? 0
            : Math.min(100, Math.round((used / limit) * 100));

    return (
        <div>
            <div className="mb-1 flex justify-between text-sm">
                <span className="text-muted-foreground">
                    {used} / {cap(limit, t)}
                </span>
            </div>
            {limit !== null && (
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                        className="bg-primary h-full rounded-full transition-[width]"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            )}
        </div>
    );
}

export default function Billing({
    currentPlan,
    billingEnabled,
    subscriptionActive,
    onGracePeriod,
    endsAt,
    usage,
    plans,
}: Props) {
    const { t } = useT();

    function subscribe(plan: string) {
        router.post(checkout().url, { plan });
    }

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4">
            <Head title={t('Billing')} />

            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">{t('Billing & plan')}</h1>
                {billingEnabled && subscriptionActive && (
                    <Button
                        variant="outline"
                        onClick={() => router.get(portal().url)}
                    >
                        {t('Manage subscription')}
                    </Button>
                )}
            </div>

            {onGracePeriod && endsAt && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                    {t(
                        'Your subscription is cancelled and will end on :date. You can resume it any time from "Manage subscription".',
                        { date: endsAt },
                    )}
                </div>
            )}

            {!billingEnabled && (
                <div className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
                    {t(
                        'Online billing is not configured on this environment. Plans below are shown for reference; contact us to change your plan.',
                    )}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>{t('Current usage')}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <p className="mb-1 text-sm font-medium">
                            {t('Products')}
                        </p>
                        <UsageBar
                            used={usage.products?.used ?? 0}
                            limit={usage.products?.limit ?? null}
                            t={t}
                        />
                    </div>
                    <div>
                        <p className="mb-1 text-sm font-medium">
                            {t('Team members')}
                        </p>
                        <UsageBar
                            used={usage.staff?.used ?? 0}
                            limit={usage.staff?.limit ?? null}
                            t={t}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
                {plans.map((plan) => {
                    const isCurrent = plan.key === currentPlan;

                    return (
                        <Card
                            key={plan.key}
                            className={
                                isCurrent
                                    ? 'border-primary border-2'
                                    : undefined
                            }
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    {plan.name}
                                    {isCurrent && (
                                        <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                                            {t('Current')}
                                        </span>
                                    )}
                                </CardTitle>
                                <p className="text-2xl font-bold">
                                    {plan.price === 0
                                        ? t('Free')
                                        : `$${plan.price}`}
                                    {plan.price > 0 && (
                                        <span className="text-muted-foreground text-sm font-normal">
                                            {' '}
                                            {t('/ mo')}
                                        </span>
                                    )}
                                </p>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3">
                                <ul className="flex flex-col gap-1.5 text-sm">
                                    <li>
                                        {t(':limit products', {
                                            limit: cap(plan.limits.products, t),
                                        })}
                                    </li>
                                    <li>
                                        {t(':limit team members', {
                                            limit: cap(plan.limits.staff, t),
                                        })}
                                    </li>
                                    <li className="flex items-center gap-1.5">
                                        {plan.limits.custom_domain ? (
                                            <Check className="size-4" />
                                        ) : (
                                            <Minus className="text-muted-foreground size-4" />
                                        )}
                                        {t('Custom domain')}
                                    </li>
                                    <li className="flex items-center gap-1.5">
                                        {plan.limits.card_payments ? (
                                            <Check className="size-4" />
                                        ) : (
                                            <Minus className="text-muted-foreground size-4" />
                                        )}
                                        {t('Card payments')}
                                    </li>
                                </ul>

                                {!isCurrent && plan.subscribable && (
                                    <Button
                                        disabled={!billingEnabled}
                                        onClick={() => subscribe(plan.key)}
                                    >
                                        {t('Choose :plan', { plan: plan.name })}
                                    </Button>
                                )}
                                {!isCurrent && !plan.subscribable && (
                                    <Button variant="outline" disabled>
                                        {plan.price === 0
                                            ? t('Downgrade via support')
                                            : t('Unavailable')}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

Billing.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Billing', href: billingShow() },
    ],
};
