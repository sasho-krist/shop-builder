import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
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
};

export default function StoreSettings({ settings }: Props) {
    const form = useForm({
        currency: settings.currency,
        currency_symbol: settings.currency_symbol,
        store_email: settings.store_email ?? '',
        shipping_flat: settings.shipping_flat,
        free_shipping_over: settings.free_shipping_over ?? '',
        tax_rate: settings.tax_rate,
        tax_included: settings.tax_included,
    });

    function submit(event: React.FormEvent) {
        event.preventDefault();
        form.put(update().url, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Store settings" />

            <form
                onSubmit={submit}
                className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4"
            >
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Store settings</h1>
                    <Button type="submit" disabled={form.processing}>
                        {form.processing && <Spinner />}
                        Save
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>General</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="currency">Currency code</Label>
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
                                    Currency symbol
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
                                Store email{' '}
                                <span className="text-muted-foreground font-normal">
                                    (order notifications)
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
                        <CardTitle>Shipping</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="shipping_flat">Flat rate</Label>
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
                                Free shipping over{' '}
                                <span className="text-muted-foreground font-normal">
                                    (blank = never)
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
                        <CardTitle>Tax</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="grid gap-2 sm:max-w-40">
                            <Label htmlFor="tax_rate">Rate (%)</Label>
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
                            Prices already include tax
                        </label>
                    </CardContent>
                </Card>
            </form>
        </>
    );
}

StoreSettings.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Settings', href: edit() },
    ],
};
