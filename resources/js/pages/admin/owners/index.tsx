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
import { Spinner } from '@/components/ui/spinner';
import { useT } from '@/lib/i18n';
import { dashboard } from '@/routes';
import owners from '@/routes/owners';

type Owner = {
    id: number;
    name: string | null;
    email: string | null;
    role: string;
    is_you: boolean;
    joined_at: string | null;
};

type Props = {
    owners: Owner[];
};

export default function OwnersIndex({ owners: list }: Props) {
    const { t } = useT();
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<Owner | null>(null);

    const addForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const editForm = useForm({ name: '', email: '' });

    function submitAdd(e: React.FormEvent) {
        e.preventDefault();
        addForm.post(owners.store().url, {
            preserveScroll: true,
            onSuccess: () => {
                setAdding(false);
                addForm.reset();
            },
        });
    }

    function openEdit(o: Owner) {
        setEditing(o);
        editForm.clearErrors();
        editForm.setData({ name: o.name ?? '', email: o.email ?? '' });
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editing) return;
        editForm.put(owners.update(editing.id).url, {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    }

    function remove(o: Owner) {
        if (
            confirm(
                t('Remove :name from this store?', {
                    name: o.name ?? o.email ?? '',
                }),
            )
        ) {
            router.delete(owners.destroy(o.id).url, { preserveScroll: true });
        }
    }

    return (
        <>
            <Head title={t('Owners')} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">{t('Owners')}</h1>
                        <p className="text-muted-foreground text-sm">
                            {t('People with full admin access to this store')}
                        </p>
                    </div>
                    <Button onClick={() => setAdding(true)}>
                        {t('Add owner')}
                    </Button>
                </div>

                <div className="border-border divide-border divide-y rounded-xl border">
                    {list.map((o) => (
                        <div
                            key={o.id}
                            className="flex flex-wrap items-center gap-3 px-4 py-3"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {o.name ?? '—'}
                                    </span>
                                    {o.is_you && (
                                        <Badge variant="secondary">
                                            {t('You')}
                                        </Badge>
                                    )}
                                    <Badge variant="outline">
                                        {t(`role.${o.role}`)}
                                    </Badge>
                                </div>
                                <div className="text-muted-foreground text-sm">
                                    {o.email}
                                    {o.joined_at
                                        ? ` · ${t('joined :date', { date: o.joined_at })}`
                                        : ''}
                                </div>
                            </div>
                            <div className="ml-auto flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEdit(o)}
                                >
                                    {t('Edit')}
                                </Button>
                                {!o.is_you && list.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => remove(o)}
                                    >
                                        {t('Remove')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <p className="text-muted-foreground text-xs">
                    {t(
                        "An owner's password is set once — when they register or are added here — and can only be changed by that owner from their own profile settings.",
                    )}
                </p>
            </div>

            <Dialog open={adding} onOpenChange={setAdding}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Add an owner')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitAdd} className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="o-name">{t('Name')}</Label>
                            <Input
                                id="o-name"
                                value={addForm.data.name}
                                autoFocus
                                onChange={(e) =>
                                    addForm.setData('name', e.target.value)
                                }
                            />
                            <InputError message={addForm.errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="o-email">{t('Email')}</Label>
                            <Input
                                id="o-email"
                                type="email"
                                value={addForm.data.email}
                                onChange={(e) =>
                                    addForm.setData('email', e.target.value)
                                }
                            />
                            <InputError message={addForm.errors.email} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="o-pw">
                                {t('Password')}{' '}
                                <span className="text-muted-foreground font-normal">
                                    {t('(they can change it later)')}
                                </span>
                            </Label>
                            <Input
                                id="o-pw"
                                type="password"
                                autoComplete="new-password"
                                value={addForm.data.password}
                                onChange={(e) =>
                                    addForm.setData('password', e.target.value)
                                }
                            />
                            <InputError message={addForm.errors.password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="o-pw2">
                                {t('Confirm password')}
                            </Label>
                            <Input
                                id="o-pw2"
                                type="password"
                                autoComplete="new-password"
                                value={addForm.data.password_confirmation}
                                onChange={(e) =>
                                    addForm.setData(
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
                                onClick={() => setAdding(false)}
                            >
                                {t('Cancel')}
                            </Button>
                            <Button type="submit" disabled={addForm.processing}>
                                {addForm.processing && <Spinner />}
                                {t('Add owner')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={editing !== null}
                onOpenChange={(o) => !o && setEditing(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Edit owner')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="oe-name">{t('Name')}</Label>
                            <Input
                                id="oe-name"
                                value={editForm.data.name}
                                autoFocus
                                onChange={(e) =>
                                    editForm.setData('name', e.target.value)
                                }
                            />
                            <InputError message={editForm.errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="oe-email">{t('Email')}</Label>
                            <Input
                                id="oe-email"
                                type="email"
                                value={editForm.data.email}
                                onChange={(e) =>
                                    editForm.setData('email', e.target.value)
                                }
                            />
                            <InputError message={editForm.errors.email} />
                        </div>
                        <p className="text-muted-foreground text-xs">
                            {t(
                                "Password can't be changed here — only by this owner from their profile.",
                            )}
                        </p>
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
        </>
    );
}

OwnersIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Owners', href: owners.index() },
    ],
};
