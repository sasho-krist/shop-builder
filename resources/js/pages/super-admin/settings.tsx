import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useT } from '@/lib/i18n';

type SecretField = { set: boolean };
type PlainField = { value: string };

type Props = {
    fields: {
        stripe_key: PlainField;
        stripe_secret: SecretField;
        stripe_webhook_secret: SecretField;
        stripe_price_pro: PlainField;
        stripe_price_business: PlainField;
    };
    live: { billing: boolean };
};

export default function SuperAdminSettings({ fields, live }: Props) {
    const { t } = useT();

    const form = useForm({
        stripe_key: fields.stripe_key.value,
        stripe_secret: '',
        stripe_webhook_secret: '',
        stripe_price_pro: fields.stripe_price_pro.value,
        stripe_price_business: fields.stripe_price_business.value,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.put('/super-admin/settings', {
            preserveScroll: true,
            onSuccess: () =>
                form.reset('stripe_secret', 'stripe_webhook_secret'),
        });
    }

    const savedPlaceholder = t('•••••••• saved — leave blank to keep');

    return (
        <>
            <Head title={t('Settings')} />

            <div className="mb-6">
                <h1 className="text-xl font-semibold">{t('Settings')}</h1>
                <p className="text-muted-foreground text-sm">
                    {t(
                        "The platform's own Stripe account — used only to bill store owners for their subscription plan. Each store connects its own Stripe for storefront payments.",
                    )}
                </p>
            </div>

            <div className="mb-6">
                <Badge variant={live.billing ? 'secondary' : 'outline'}>
                    {t('Subscription billing')}:{' '}
                    {live.billing ? t('on') : t('not configured')}
                </Badge>
            </div>

            <form
                onSubmit={submit}
                className="border-border bg-card max-w-xl space-y-5 rounded-xl border p-6"
            >
                <div className="grid gap-2">
                    <Label htmlFor="pk">{t('Publishable key')}</Label>
                    <Input
                        id="pk"
                        value={form.data.stripe_key}
                        placeholder="pk_live_…"
                        onChange={(e) =>
                            form.setData('stripe_key', e.target.value)
                        }
                    />
                    <InputError message={form.errors.stripe_key} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="sk">{t('Secret key')}</Label>
                    <PasswordInput
                        id="sk"
                        autoComplete="off"
                        value={form.data.stripe_secret}
                        placeholder={
                            fields.stripe_secret.set
                                ? savedPlaceholder
                                : 'sk_live_…'
                        }
                        onChange={(e) =>
                            form.setData('stripe_secret', e.target.value)
                        }
                    />
                    <InputError message={form.errors.stripe_secret} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="wh">
                        {t('Subscription webhook secret')}{' '}
                        <span className="text-muted-foreground font-normal">
                            /billing/webhook
                        </span>
                    </Label>
                    <PasswordInput
                        id="wh"
                        autoComplete="off"
                        value={form.data.stripe_webhook_secret}
                        placeholder={
                            fields.stripe_webhook_secret.set
                                ? savedPlaceholder
                                : 'whsec_…'
                        }
                        onChange={(e) =>
                            form.setData(
                                'stripe_webhook_secret',
                                e.target.value,
                            )
                        }
                    />
                    <InputError message={form.errors.stripe_webhook_secret} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="pp">{t('Pro plan price ID')}</Label>
                        <Input
                            id="pp"
                            value={form.data.stripe_price_pro}
                            placeholder="price_…"
                            onChange={(e) =>
                                form.setData('stripe_price_pro', e.target.value)
                            }
                        />
                        <InputError message={form.errors.stripe_price_pro} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="pb">
                            {t('Business plan price ID')}
                        </Label>
                        <Input
                            id="pb"
                            value={form.data.stripe_price_business}
                            placeholder="price_…"
                            onChange={(e) =>
                                form.setData(
                                    'stripe_price_business',
                                    e.target.value,
                                )
                            }
                        />
                        <InputError
                            message={form.errors.stripe_price_business}
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={form.processing}>
                        {form.processing && <Spinner />}
                        {t('Save')}
                    </Button>
                </div>
            </form>
        </>
    );
}
