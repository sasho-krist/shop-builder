import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';
import { dashboard } from '@/routes';
import { show as billingShow } from '@/routes/billing';

type Props = {
    planName: string;
    onGracePeriod: boolean;
    endsAt: string | null;
};

export default function BillingMockPortal({
    planName,
    onGracePeriod,
    endsAt,
}: Props) {
    const { t } = useT();

    return (
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 p-4 py-12">
            <Head title={t('Manage subscription')} />

            <div className="border-border bg-card rounded-xl border p-6 shadow-sm">
                <h1 className="text-lg font-semibold">
                    {t('Manage subscription')}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    {t('Current plan: :plan', { plan: planName })}
                </p>

                {onGracePeriod && endsAt ? (
                    <>
                        <p className="mt-4 text-sm">
                            {t('Cancelled — active until :date.', {
                                date: endsAt,
                            })}
                        </p>
                        <Button
                            className="mt-4 w-full"
                            onClick={() =>
                                router.post('/billing/mock-portal', {
                                    action: 'resume',
                                })
                            }
                        >
                            {t('Resume subscription')}
                        </Button>
                    </>
                ) : (
                    <Button
                        variant="outline"
                        className="mt-4 w-full"
                        onClick={() =>
                            router.post('/billing/mock-portal', {
                                action: 'cancel',
                            })
                        }
                    >
                        {t('Cancel subscription')}
                    </Button>
                )}

                <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground mt-3 w-full text-center text-sm"
                    onClick={() => router.get(billingShow().url)}
                >
                    {t('Back to billing')}
                </button>
            </div>
        </div>
    );
}

BillingMockPortal.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Billing', href: billingShow() },
    ],
};
