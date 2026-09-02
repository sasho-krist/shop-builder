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
import PasswordInput from '@/components/password-input';
import { Spinner } from '@/components/ui/spinner';
import { useT } from '@/lib/i18n';

type Owner = {
    id: number;
    name: string;
    email: string;
    email_verified: boolean;
    created_at: string | null;
    stores: { id: number; name: string }[];
};

type Props = {
    owners: Owner[];
    filters: { search: string };
};

export default function SuperAdminOwners({ owners, filters }: Props) {
    const { t } = useT();
    const [search, setSearch] = useState(filters.search);
    const [editing, setEditing] = useState<Owner | null>(null);
    const [resetting, setResetting] = useState<Owner | null>(null);

    const editForm = useForm({ name: '', email: '' });
    const pwForm = useForm({ password: '', password_confirmation: '' });

    function runSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(
            '/super-admin/owners',
            { search },
            { preserveState: true, replace: true },
        );
    }

    function openEdit(owner: Owner) {
        setEditing(owner);
        editForm.clearErrors();
        editForm.setData({ name: owner.name, email: owner.email });
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editing) return;
        editForm.put(`/super-admin/owners/${editing.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    }

    function openReset(owner: Owner) {
        setResetting(owner);
        pwForm.clearErrors();
        pwForm.reset();
    }

    function submitReset(e: React.FormEvent) {
        e.preventDefault();
        if (!resetting) return;
        pwForm.patch(`/super-admin/owners/${resetting.id}/password`, {
            preserveScroll: true,
            onSuccess: () => {
                setResetting(null);
                pwForm.reset();
            },
        });
    }

    function remove(owner: Owner) {
        if (
            !confirm(
                t(
                    'Delete :name? They are removed from every store they manage. Past orders are kept.',
                    { name: owner.name },
                ),
            )
        )
            return;
        router.delete(`/super-admin/owners/${owner.id}`, {
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title={t('Owners')} />

            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold">{t('Owners')}</h1>
                    <p className="text-muted-foreground text-sm">
                        {t(':count platform accounts', {
                            count: owners.length,
                        })}
                    </p>
                </div>
                <form onSubmit={runSearch} className="flex gap-2">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('Search name or email')}
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
                                {t('Name')}
                            </th>
                            <th className="px-4 py-2 font-medium">
                                {t('Email')}
                            </th>
                            <th className="px-4 py-2 font-medium">
                                {t('Stores')}
                            </th>
                            <th className="px-4 py-2 font-medium">
                                {t('Joined')}
                            </th>
                            <th className="px-4 py-2" />
                        </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                        {owners.map((owner) => (
                            <tr key={owner.id}>
                                <td className="px-4 py-3 font-medium">
                                    {owner.name}
                                </td>
                                <td className="px-4 py-3">
                                    <span>{owner.email}</span>
                                    {!owner.email_verified && (
                                        <Badge
                                            variant="outline"
                                            className="ml-2"
                                        >
                                            {t('unverified')}
                                        </Badge>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {owner.stores.length === 0 && (
                                            <span className="text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                        {owner.stores.map((s) => (
                                            <Badge
                                                key={s.id}
                                                variant="secondary"
                                            >
                                                {s.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </td>
                                <td className="text-muted-foreground px-4 py-3">
                                    {owner.created_at}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEdit(owner)}
                                        >
                                            {t('Edit')}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openReset(owner)}
                                        >
                                            {t('Reset password')}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => remove(owner)}
                                        >
                                            {t('Delete')}
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {owners.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="text-muted-foreground px-4 py-8 text-center"
                                >
                                    {t('No accounts match your search.')}
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
                        <DialogTitle>{t('Edit account')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="o-name">{t('Name')}</Label>
                            <Input
                                id="o-name"
                                value={editForm.data.name}
                                onChange={(e) =>
                                    editForm.setData('name', e.target.value)
                                }
                            />
                            <InputError message={editForm.errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="o-email">{t('Email')}</Label>
                            <Input
                                id="o-email"
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
                open={resetting !== null}
                onOpenChange={(o) => !o && setResetting(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {t('Reset password for :name', {
                                name: resetting?.name ?? '',
                            })}
                        </DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={submitReset}
                        className="flex flex-col gap-4"
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="o-pw">{t('New password')}</Label>
                            <PasswordInput
                                id="o-pw"
                                autoComplete="new-password"
                                value={pwForm.data.password}
                                onChange={(e) =>
                                    pwForm.setData('password', e.target.value)
                                }
                            />
                            <InputError message={pwForm.errors.password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="o-pw2">
                                {t('Confirm password')}
                            </Label>
                            <PasswordInput
                                id="o-pw2"
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
                        <p className="text-muted-foreground text-xs">
                            {t(
                                'The owner is signed out everywhere and must use the new password next time.',
                            )}
                        </p>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setResetting(null)}
                            >
                                {t('Cancel')}
                            </Button>
                            <Button type="submit" disabled={pwForm.processing}>
                                {pwForm.processing && <Spinner />}
                                {t('Reset password')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
