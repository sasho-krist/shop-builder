import { Head, router } from '@inertiajs/react';
import { CreditCard, Lock } from 'lucide-react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useT } from '@/lib/i18n';
import { dashboard } from '@/routes';
import { show as billingShow } from '@/routes/billing';

type Props = {
    plan: { key: string; name: string; price: number };
};

function formatCardNumber(value: string): string {
    return value
        .replace(/\D/g, '')
        .slice(0, 16)
        .replace(/(.{4})/g, '$1 ')
        .trim();
}

function formatExpiry(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    return digits.length <= 2
        ? digits
        : `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

export default function BillingMock({ plan }: Props) {
    const { t } = useT();

    const [name, setName] = useState('');
    const [number, setNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const digits = number.replace(/\s/g, '');
    const expiryDigits = expiry.replace(/\D/g, '');
    const mm = expiryDigits.slice(0, 2);

    const complete = useMemo(
        () =>
            name.trim().length > 1 &&
            digits.length === 16 &&
            expiryDigits.length === 4 &&
            Number(mm) >= 1 &&
            Number(mm) <= 12 &&
            cvc.length >= 3,
        [name, digits, expiryDigits, mm, cvc],
    );

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!complete || processing) return;

        // The Stripe test card. Any other number is "declined" so the failure
        // path is demoable too.
        if (digits !== '4242424242424242') {
            setError(
                t('Card declined. Use the test card 4242 4242 4242 4242.'),
            );
            return;
        }

        setError(null);
        setProcessing(true);
        router.post(
            '/billing/mock-checkout',
            { plan: plan.key },
            { onFinish: () => setProcessing(false) },
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 p-4 py-12">
            <Head title={t('Checkout')} />

            <form
                onSubmit={submit}
                className="border-border bg-card rounded-xl border p-6 shadow-sm"
            >
                <div className="text-muted-foreground mb-6 flex items-center gap-2 text-sm">
                    <Lock className="size-4" />
                    {t('Test checkout — no real card is charged')}
                </div>

                <h1 className="text-lg font-semibold">
                    {t('Subscribe to :plan', { plan: plan.name })}
                </h1>
                <div className="border-border my-4 flex items-center justify-between border-y py-4">
                    <span className="font-medium">{plan.name}</span>
                    <span className="text-lg font-semibold">
                        ${plan.price}
                        <span className="text-muted-foreground text-sm font-normal">
                            {' '}
                            {t('/ mo')}
                        </span>
                    </span>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="cc-name">{t('Name on card')}</Label>
                        <Input
                            id="cc-name"
                            autoComplete="cc-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="cc-number">{t('Card number')}</Label>
                        <Input
                            id="cc-number"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            placeholder="4242 4242 4242 4242"
                            value={number}
                            onChange={(e) =>
                                setNumber(formatCardNumber(e.target.value))
                            }
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="cc-exp">
                                {t('Expiry (MM / YY)')}
                            </Label>
                            <Input
                                id="cc-exp"
                                inputMode="numeric"
                                autoComplete="cc-exp"
                                placeholder="12 / 34"
                                value={expiry}
                                onChange={(e) =>
                                    setExpiry(formatExpiry(e.target.value))
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="cc-cvc">{t('CVC')}</Label>
                            <Input
                                id="cc-cvc"
                                inputMode="numeric"
                                autoComplete="cc-csc"
                                placeholder="123"
                                value={cvc}
                                onChange={(e) =>
                                    setCvc(
                                        e.target.value
                                            .replace(/\D/g, '')
                                            .slice(0, 4),
                                    )
                                }
                            />
                        </div>
                    </div>

                    <InputError message={error ?? undefined} />

                    <Button
                        type="submit"
                        className="mt-2 w-full"
                        disabled={!complete || processing}
                    >
                        {processing ? (
                            <Spinner />
                        ) : (
                            <CreditCard className="size-4" />
                        )}
                        {t('Pay :amount', { amount: `$${plan.price}` })}
                    </Button>

                    <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground w-full text-center text-sm"
                        onClick={() =>
                            router.post('/billing/mock-checkout/cancel')
                        }
                    >
                        {t('Cancel and go back')}
                    </button>
                </div>
            </form>

            <p className="text-muted-foreground text-center text-xs">
                {t(
                    'Mock payment — enter 4242 4242 4242 4242, any future date and CVC.',
                )}
            </p>
        </div>
    );
}

BillingMock.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Billing', href: billingShow() },
    ],
};
