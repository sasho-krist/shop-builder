import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useT } from '@/lib/i18n';

type Store = {
    id: number;
    name: string;
    slug: string;
    custom_domain: string | null;
    plan: string;
    status: string;
    url: string;
    users_count: number;
    products_count: number;
    orders_count: number;
    created_at: string | null;
};

type Props = {
    stores: Store[];
    filters: { search: string };
    plans: { key: string; name: string }[];
};

export default function SuperAdminStores({ stores, filters, plans }: Props) {
    const { t } = useT();
    const [search, setSearch] = useState(filters.search);
    const [editing, setEditing] = useState<Store | null>(null);

    const form = useForm({
        name: '',
        slug: '',
        custom_domain: '',
        plan: 'free',
    });

    function runSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(
            '/super-admin/stores',
            { search },
            { preserveState: true, replace: true },
        );
    }

    function openEdit(store: Store) {
        setEditing(store);
        form.clearErrors();
        form.setData({
            name: store.name,
            slug: store.slug,
            custom_domain: store.custom_domain ?? '',
            plan: store.plan,
        });
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editing) return;
        form.put(`/super-admin/stores/${editing.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    }

    function toggleStatus(store: Store) {
        const next = store.status === 'suspended' ? 'active' : 'suspended';
        const ask =
            next === 'suspended'
                ? t('Suspend :name? Its storefront will go offline.', {
                      name: store.name,
                  })
                : t('Reactivate :name?', { name: store.name });
        if (!confirm(ask)) return;
        router.patch(
            `/super-admin/stores/${store.id}/status`,
            { status: next },
            { preserveScroll: true },
        );
    }

    function remove(store: Store) {
        if (
            !confirm(
                t(
                    'Delete :name permanently? Products, orders and staff links are all removed. This cannot be undone.',
                    { name: store.name },
                ),
            )
        )
            return;
        router.delete(`/super-admin/stores/${store.id}`, {
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title={t('Stores')} />

            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold">{t('Stores')}</h1>
                    <p className="text-muted-foreground text-sm">
                        {t(':count stores on the platform', {
                            count: stores.length,
                        })}
                    </p>
                </div>
                <form onSubmit={runSearch} className="flex gap-2">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('Search name, slug or domain')}
                        className="w-64"
                    />
                    <Button type="submit" variant="secondary">
                        {t('Search')}
                    </Button>
                </form>
            </div>

            <div className="border-border overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground text-left">
                        <tr>
                            <th className="px-4 py-2 font-medium">
                                {t('Store')}
                            </th>
                            <th className="px-4 py-2 font-medium">
                                {t('Plan')}
                            </th>
                            <th className="px-4 py-2 font-medium">
                                {t('Status')}
                            </th>
                            <th className="px-4 py-2 text-right font-medium">
                                {t('Owners')}
                            </th>
                            <th className="px-4 py-2 text-right font-medium">
                                {t('Products')}
                            </th>
                            <th className="px-4 py-2 text-right font-medium">
                                {t('Orders')}
                            </th>
                            <th className="px-4 py-2 font-medium">
                                {t('Created')}
                            </th>
                            <th className="px-4 py-2" />
                        </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                        {stores.map((store) => (
                            <tr key={store.id}>
                                <td className="px-4 py-3">
                                    <div className="font-medium">
                                        {store.name}
                                    </div>
                                    <a
                                        href={store.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
                                    >
                                        {store.custom_domain ?? store.slug}
                                    </a>
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant="outline">
                                        {plans.find((p) => p.key === store.plan)
                                            ?.name ?? store.plan}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3">
                                    {store.status === 'active' ? (
                                        <Badge variant="secondary">
                                            {t('Active')}
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive">
                                            {t('Suspended')}
                                        </Badge>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums">
                                    {store.users_count}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums">
                                    {store.products_count}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums">
                                    {store.orders_count}
                                </td>
                                <td className="text-muted-foreground px-4 py-3">
                                    {store.created_at}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEdit(store)}
                                        >
                                            {t('Edit')}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleStatus(store)}
                                        >
                                            {store.status === 'suspended'
                                                ? t('Reactivate')
                                                : t('Suspend')}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => remove(store)}
                                        >
                                            {t('Delete')}
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {stores.length === 0 && (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="text-muted-foreground px-4 py-8 text-center"
                                >
                                    {t('No stores match your search.')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Dialog
                open={editing !== null}
                onOpenChange={(o) => !o && setEditing(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Edit store')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="s-name">{t('Name')}</Label>
                            <Input
                                id="s-name"
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="s-slug">
                                {t('Subdomain slug')}
                            </Label>
                            <Input
                                id="s-slug"
                                value={form.data.slug}
                                onChange={(e) =>
                                    form.setData('slug', e.target.value)
                                }
                            />
                            <InputError message={form.errors.slug} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="s-domain">
                                {t('Custom domain')}{' '}
                                <span className="text-muted-foreground font-normal">
                                    {t('(optional)')}
                                </span>
                            </Label>
                            <Input
                                id="s-domain"
                                value={form.data.custom_domain}
                                placeholder="shop.example.com"
                                onChange={(e) =>
                                    form.setData(
                                        'custom_domain',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError message={form.errors.custom_domain} />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('Plan')}</Label>
                            <Select
                                value={form.data.plan}
                                onValueChange={(v) => form.setData('plan', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {plans.map((p) => (
                                        <SelectItem key={p.key} value={p.key}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.plan} />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditing(null)}
                            >
                                {t('Cancel')}
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing && <Spinner />}
                                {t('Save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
