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
import pageRoutes from '@/routes/pages';

type PageRow = {
    id: number;
    type: string;
    title: string;
    slug: string;
    is_published: boolean;
    blocks_count: number;
};

type Props = {
    pages: PageRow[];
};

export default function PagesIndex({ pages }: Props) {
    const { t } = useT();
    const [open, setOpen] = useState(false);
    const form = useForm({ title: '' });

    function create(event: React.FormEvent) {
        event.preventDefault();
        form.post(pageRoutes.store().url, { onSuccess: () => setOpen(false) });
    }

    function destroy(page: PageRow) {
        if (confirm(t('Delete ":title"?', { title: page.title }))) {
            router.delete(pageRoutes.destroy(page.id).url, {
                preserveScroll: true,
            });
        }
    }

    return (
        <>
            <Head title={t('Pages')} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">{t('Pages')}</h1>
                        <p className="text-muted-foreground text-sm">
                            {t('Build your storefront pages from sections.')}
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            form.reset();
                            form.clearErrors();
                            setOpen(true);
                        }}
                    >
                        {t('New page')}
                    </Button>
                </div>

                <div className="border-border divide-border divide-y rounded-xl border">
                    {pages.map((page) => (
                        <div
                            key={page.id}
                            className="flex items-center gap-3 px-4 py-3"
                        >
                            <button
                                type="button"
                                className="font-medium hover:underline"
                                onClick={() =>
                                    router.get(pageRoutes.edit(page.id).url)
                                }
                            >
                                {page.title}
                            </button>
                            {page.type === 'home' && (
                                <Badge variant="secondary">{t('Home')}</Badge>
                            )}
                            {page.is_published ? (
                                <Badge>{t('Published')}</Badge>
                            ) : (
                                <Badge variant="outline">{t('Draft')}</Badge>
                            )}
                            <span className="text-muted-foreground text-sm">
                                {t(':count sections', {
                                    count: page.blocks_count,
                                })}
                            </span>
                            {page.type !== 'home' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-auto"
                                    onClick={() => destroy(page)}
                                >
                                    {t('Delete')}
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('New page')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={create} className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="page-title">{t('Title')}</Label>
                            <Input
                                id="page-title"
                                value={form.data.title}
                                autoFocus
                                onChange={(e) =>
                                    form.setData('title', e.target.value)
                                }
                            />
                            <InputError message={form.errors.title} />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                {t('Cancel')}
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing && <Spinner />}
                                {t('Create')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

PagesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Pages', href: pageRoutes.index() },
    ],
};
