import { Head, router, useForm } from '@inertiajs/react';
import { Check, Copy, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useT } from '@/lib/i18n';
import { dashboard } from '@/routes';
import { update as updateDomain } from '@/routes/store-domain';
import { edit, update } from '@/routes/store-settings';

type Props = {
    settings: {
        currency: string;
        currency_symbol: string;
        store_email: string | null;
        shipping_flat: string;
        free_shipping_over: string | null;
        tax_rate: string;
        tax_included: boolean;
    };
    logoUrl: string | null;
    stripe: {
        connected: boolean;
        webhook_secret_set: boolean;
        webhook_url: string;
    };
    domain: {
        subdomain: string;
        custom_domain: string | null;
        target: string;
    };
};

function CopyField({ value }: { value: string }) {
    const { t } = useT();
    const [copied, setCopied] = useState(false);

    function copy() {
        void navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }

    return (
        <div className="flex items-center gap-2">
            <code className="bg-muted flex-1 truncate rounded px-2 py-1.5 text-sm">
                {value}
            </code>
            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copy}
                aria-label={t('Copy')}
            >
                {copied ? (
                    <Check className="size-4" />
                ) : (
                    <Copy className="size-4" />
                )}
            </Button>
        </div>
    );
}

export default function StoreSettings({
    settings,
    logoUrl,
    stripe,
    domain,
}: Props) {
    const { t } = useT();
    const logoInput = useRef<HTMLInputElement>(null);
    const [logoUploading, setLogoUploading] = useState(false);

    function uploadLogo(file: File | undefined) {
        if (!file) return;
        router.post(
            '/store-settings/logo',
            { logo: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onStart: () => setLogoUploading(true),
                onFinish: () => {
                    setLogoUploading(false);
                    if (logoInput.current) logoInput.current.value = '';
                },
            },
        );
    }

    function removeLogo() {
        if (!confirm(t('Remove the logo?'))) return;
        router.delete('/store-settings/logo', { preserveScroll: true });
    }

    const form = useForm({
        currency: settings.currency,
        currency_symbol: settings.currency_symbol,
        store_email: settings.store_email ?? '',
        shipping_flat: settings.shipping_flat,
        free_shipping_over: settings.free_shipping_over ?? '',
        tax_rate: settings.tax_rate,
        tax_included: settings.tax_included,
        stripe_secret: '',
        stripe_webhook_secret: '',
    });

    function disconnectStripe() {
        if (!confirm(t('Disconnect Stripe? Card payments will stop.'))) return;
        router.delete('/store-settings/stripe', { preserveScroll: true });
    }

    const domainForm = useForm({
        custom_domain: domain.custom_domain ?? '',
    });

    function submit(event: React.FormEvent) {
        event.preventDefault();
        form.put(update().url, {
            preserveScroll: true,
            onSuccess: () =>
                form.reset('stripe_secret', 'stripe_webhook_secret'),
        });
    }

    function submitDomain(event: React.FormEvent) {
        event.preventDefault();
        domainForm.put(updateDomain().url, { preserveScroll: true });
    }

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4">
            <Head title={t('Store settings')} />

            <form onSubmit={submit} className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">
                        {t('Store settings')}
                    </h1>
                    <Button type="submit" disabled={form.processing}>
                        {form.processing && <Spinner />}
                        {t('Save')}
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('General')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="currency">
                                    {t('Currency code')}
                                </Label>
                                <Input
                                    id="currency"
                                    maxLength={3}
                                    value={form.data.currency}
                                    onChange={(e) =>
                                        form.setData(
                                            'currency',
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                />
                                <InputError message={form.errors.currency} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="currency_symbol">
                                    {t('Currency symbol')}
                                </Label>
                                <Input
                                    id="currency_symbol"
                                    value={form.data.currency_symbol}
                                    onChange={(e) =>
                                        form.setData(
                                            'currency_symbol',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={form.errors.currency_symbol}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="store_email">
                                {t('Store email')}{' '}
                                <span className="text-muted-foreground font-normal">
                                    {t('(order notifications)')}
                                </span>
                            </Label>
                            <Input
                                id="store_email"
                                type="email"
                                value={form.data.store_email}
                                onChange={(e) =>
                                    form.setData('store_email', e.target.value)
                                }
                            />
                            <InputError message={form.errors.store_email} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('Logo')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <p className="text-muted-foreground text-sm">
                            {t(
                                'Shown in the storefront header instead of the store name. PNG, JPG or WebP, up to 2 MB.',
                            )}
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="border-border bg-muted/40 flex h-16 w-40 items-center justify-center overflow-hidden rounded-md border">
                                {logoUrl ? (
                                    <img
                                        src={logoUrl}
                                        alt={t('Logo')}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                ) : (
                                    <span className="text-muted-foreground text-xs">
                                        {t('No logo')}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={logoUploading}
                                    onClick={() => logoInput.current?.click()}
                                >
                                    {logoUploading ? (
                                        <Spinner />
                                    ) : (
                                        <Upload className="size-4" />
                                    )}
                                    {logoUrl
                                        ? t('Replace logo')
                                        : t('Upload logo')}
                                </Button>
                                {logoUrl && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={removeLogo}
                                    >
                                        {t('Remove')}
                                    </Button>
                                )}
                            </div>
                        </div>
                        <input
                            ref={logoInput}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            hidden
                            onChange={(e) => uploadLogo(e.target.files?.[0])}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('Shipping')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="shipping_flat">
                                {t('Flat rate')}
                            </Label>
                            <Input
                                id="shipping_flat"
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.data.shipping_flat}
                                onChange={(e) =>
                                    form.setData(
                                        'shipping_flat',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError message={form.errors.shipping_flat} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="free_shipping_over">
                                {t('Free shipping over')}{' '}
                                <span className="text-muted-foreground font-normal">
                                    {t('(blank = never)')}
                                </span>
                            </Label>
                            <Input
                                id="free_shipping_over"
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.data.free_shipping_over}
                                onChange={(e) =>
                                    form.setData(
                                        'free_shipping_over',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError
                                message={form.errors.free_shipping_over}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('Tax')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="grid gap-2 sm:max-w-40">
                            <Label htmlFor="tax_rate">{t('Rate (%)')}</Label>
                            <Input
                                id="tax_rate"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={form.data.tax_rate}
                                onChange={(e) =>
                                    form.setData('tax_rate', e.target.value)
                                }
                            />
                            <InputError message={form.errors.tax_rate} />
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={form.data.tax_included}
                                onCheckedChange={(checked) =>
                                    form.setData(
                                        'tax_included',
                                        checked === true,
                                    )
                                }
                            />
                            {t('Prices already include tax')}
                        </label>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {t('Card payments (Stripe)')}
                            {stripe.connected ? (
                                <Badge variant="secondary">
                                    {t('Connected')}
                                </Badge>
                            ) : (
                                <Badge variant="outline">
                                    {t('Not connected')}
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <p className="text-muted-foreground text-sm">
                            {t(
                                'Connect your own Stripe account so card payments go straight to you. Find these in the Stripe dashboard under Developers → API keys.',
                            )}
                        </p>
                        <div className="grid gap-2">
                            <Label htmlFor="stripe_secret">
                                {t('Secret key')}
                            </Label>
                            <PasswordInput
                                id="stripe_secret"
                                autoComplete="off"
                                placeholder={
                                    stripe.connected
                                        ? t(
                                              '•••••••• saved — leave blank to keep',
                                          )
                                        : 'sk_live_…'
                                }
                                value={form.data.stripe_secret}
                                onChange={(e) =>
                                    form.setData(
                                        'stripe_secret',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError message={form.errors.stripe_secret} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="stripe_webhook_secret">
                                {t('Webhook signing secret')}
                            </Label>
                            <PasswordInput
                                id="stripe_webhook_secret"
                                autoComplete="off"
                                placeholder={
                                    stripe.webhook_secret_set
                                        ? t(
                                              '•••••••• saved — leave blank to keep',
                                          )
                                        : 'whsec_…'
                                }
                                value={form.data.stripe_webhook_secret}
                                onChange={(e) =>
                                    form.setData(
                                        'stripe_webhook_secret',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError
                                message={form.errors.stripe_webhook_secret}
                            />
                            <p className="text-muted-foreground text-xs">
                                {t(
                                    'In Stripe → Developers → Webhooks, add an endpoint for the "checkout.session.completed" event pointing to:',
                                )}
                            </p>
                            <CopyField value={stripe.webhook_url} />
                        </div>
                        {stripe.connected && (
                            <div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={disconnectStripe}
                                >
                                    {t('Disconnect Stripe')}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </form>

            <form onSubmit={submitDomain}>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Domain')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label>{t('Your store address')}</Label>
                            <CopyField value={`https://${domain.subdomain}`} />
                            <p className="text-muted-foreground text-xs">
                                {t(
                                    'Always available. A custom domain is optional.',
                                )}
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="custom_domain">
                                {t('Custom domain')}
                            </Label>
                            <Input
                                id="custom_domain"
                                placeholder="shop.example.com"
                                value={domainForm.data.custom_domain}
                                onChange={(e) =>
                                    domainForm.setData(
                                        'custom_domain',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError
                                message={domainForm.errors.custom_domain}
                            />
                        </div>

                        {domainForm.data.custom_domain.trim() !== '' && (
                            <div className="border-muted grid gap-2 rounded-md border border-dashed p-3">
                                <p className="text-sm font-medium">
                                    {t('DNS setup')}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    {t(
                                        'At your domain registrar, add a CNAME record pointing your domain to:',
                                    )}
                                </p>
                                <CopyField value={domain.target} />
                                <p className="text-muted-foreground text-xs">
                                    {t(
                                        'DNS changes can take up to 24h to propagate. HTTPS is issued automatically once the record resolves.',
                                    )}
                                </p>
                            </div>
                        )}

                        <div>
                            <Button
                                type="submit"
                                variant="outline"
                                disabled={domainForm.processing}
                            >
                                {domainForm.processing && <Spinner />}
                                {t('Save domain')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}

StoreSettings.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Settings', href: edit() },
    ],
};
