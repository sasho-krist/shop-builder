import { Head, useForm } from '@inertiajs/react';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
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

export default function StoreSettings({ settings, domain }: Props) {
    const { t } = useT();
    const form = useForm({
        currency: settings.currency,
        currency_symbol: settings.currency_symbol,
        store_email: settings.store_email ?? '',
        shipping_flat: settings.shipping_flat,
        free_shipping_over: settings.free_shipping_over ?? '',
        tax_rate: settings.tax_rate,
        tax_included: settings.tax_included,
    });

    const domainForm = useForm({
        custom_domain: domain.custom_domain ?? '',
    });

    function submit(event: React.FormEvent) {
        event.preventDefault();
        form.put(update().url, { preserveScroll: true });
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
