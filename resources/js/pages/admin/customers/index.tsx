import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
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
import { Spinner } from '@/components/ui/spinner';
import { useT } from '@/lib/i18n';
import { dashboard } from '@/routes';
import customers from '@/routes/customers';

type CustomerRow = {
    id: number;
    name: string;
    email: string;
    orders_count: number;
    created_at: string | null;
};

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
};

type Props = {
    customers: Paginated<CustomerRow>;
    filters: { search: string };
};

export default function CustomersIndex({ customers: page, filters }: Props) {
    const { t } = useT();
    const [search, setSearch] = useState(filters.search);
    const [editing, setEditing] = useState<CustomerRow | null>(null);
    const [pwFor, setPwFor] = useState<CustomerRow | null>(null);

    const editForm = useForm({ name: '', email: '' });
    const pwForm = useForm({ password: '', password_confirmation: '' });

    function runSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(
            customers.index().url,
            { search },
            { preserveState: true, replace: true },
        );
    }

    function openEdit(c: CustomerRow) {
        setEditing(c);
        editForm.clearErrors();
        editForm.setData({ name: c.name, email: c.email });
    }

    function saveEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editing) return;
        editForm.put(customers.update(editing.id).url, {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    }

    function openPw(c: CustomerRow) {
        setPwFor(c);
        pwForm.clearErrors();
        pwForm.setData({ password: '', password_confirmation: '' });
    }

    function savePw(e: React.FormEvent) {
        e.preventDefault();
        if (!pwFor) return;
        pwForm.put(customers.password(pwFor.id).url, {
            preserveScroll: true,
            onSuccess: () => setPwFor(null),
        });
    }

    function destroy(c: CustomerRow) {
        if (
            confirm(
                t('Delete customer ":name"? Their past orders are kept.', {
                    name: c.name,
                }),
            )
        ) {
            router.delete(customers.destroy(c.id).url, {
                preserveScroll: true,
            });
        }
    }

    return (
        <>
            <Head title={t('Customers')} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">
                            {t('Customers')}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {page.total === 1
                                ? t(':count customer — store account holders', {
                                      count: page.total,
                                  })
                                : t(
                                      ':count customers — store account holders',
                                      { count: page.total },
                                  )}
                        </p>
                    </div>
                    <form onSubmit={runSearch} className="flex gap-2">
                        <Input
                            value={search}
                            placeholder={t('Search name or email')}
                            className="w-56"
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button type="submit" variant="outline">
                            {t('Search')}
                        </Button>
                    </form>
                </div>

                {page.data.length === 0 ? (
                    <div className="border-border text-muted-foreground rounded-xl border border-dashed p-12 text-center text-sm">
                        {t('No customers yet.')}
                    </div>
                ) : (
                    <div className="border-border overflow-x-auto rounded-xl border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground text-left">
                                <tr>
                                    <th className="px-4 py-2 font-medium">
                                        {t('Name')}
                                    </th>
                                    <th className="px-4 py-2 font-medium">
                                        {t('Email')}
                                    </th>
                                    <th className="px-4 py-2 font-medium">
                                        {t('Orders')}
                                    </th>
                                    <th className="px-4 py-2 font-medium">
                                        {t('Joined')}
                                    </th>
                                    <th className="px-4 py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {page.data.map((c) => (
                                    <tr
                                        key={c.id}
                                        className="border-border border-t"
                                    >
                                        <td className="px-4 py-2 font-medium">
                                            {c.name}
                                        </td>
                                        <td className="text-muted-foreground px-4 py-2">
                                            {c.email}
                                        </td>
                                        <td className="px-4 py-2">
                                            {c.orders_count}
                                        </td>
                                        <td className="text-muted-foreground px-4 py-2">
                                            {c.created_at ?? '—'}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEdit(c)}
                                                >
                                                    {t('Edit')}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openPw(c)}
                                                >
                                                    {t('Password')}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => destroy(c)}
                                                >
                                                    {t('Delete')}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {page.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            {t('Page :current of :last', {
                                current: page.current_page,
                                last: page.last_page,
                            })}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!page.prev_page_url}
                                onClick={() =>
                                    page.prev_page_url &&
                                    router.visit(page.prev_page_url)
                                }
                            >
                                {t('Previous')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!page.next_page_url}
                                onClick={() =>
                                    page.next_page_url &&
                                    router.visit(page.next_page_url)
                                }
                            >
                                {t('Next')}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <Dialog
                open={editing !== null}
                onOpenChange={(o) => !o && setEditing(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Edit customer')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={saveEdit} className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="c-name">{t('Name')}</Label>
                            <Input
                                id="c-name"
                                value={editForm.data.name}
                                autoFocus
                                onChange={(e) =>
                                    editForm.setData('name', e.target.value)
                                }
                            />
                            <InputError message={editForm.errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="c-email">{t('Email')}</Label>
                            <Input
                                id="c-email"
                                type="email"
                                value={editForm.data.email}
                                onChange={(e) =>
                                    editForm.setData('email', e.target.value)
                                }
                            />
                            <InputError message={editForm.errors.email} />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditing(null)}
                            >
                                {t('Cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={editForm.processing}
                            >
                                {editForm.processing && <Spinner />}
                                {t('Save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={pwFor !== null}
                onOpenChange={(o) => !o && setPwFor(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {pwFor
                                ? t('Set a new password for :name', {
                                      name: pwFor.name,
                                  })
                                : t('Set a new password')}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={savePw} className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="c-pw">{t('New password')}</Label>
                            <Input
                                id="c-pw"
                                type="password"
                                autoComplete="new-password"
                                value={pwForm.data.password}
                                autoFocus
                                onChange={(e) =>
                                    pwForm.setData('password', e.target.value)
                                }
                            />
                            <InputError message={pwForm.errors.password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="c-pw2">
                                {t('Confirm password')}
                            </Label>
                            <Input
                                id="c-pw2"
                                type="password"
                                autoComplete="new-password"
                                value={pwForm.data.password_confirmation}
                                onChange={(e) =>
                                    pwForm.setData(
                                        'password_confirmation',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setPwFor(null)}
                            >
                                {t('Cancel')}
                            </Button>
                            <Button type="submit" disabled={pwForm.processing}>
                                {pwForm.processing && <Spinner />}
                                {t('Update password')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

CustomersIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Customers', href: customers.index() },
    ],
};
