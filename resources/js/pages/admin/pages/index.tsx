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
    const [open, setOpen] = useState(false);
    const form = useForm({ title: '' });

    function create(event: React.FormEvent) {
        event.preventDefault();
        form.post(pageRoutes.store().url, { onSuccess: () => setOpen(false) });
    }

    function destroy(page: PageRow) {
        if (confirm(`Delete "${page.title}"?`)) {
            router.delete(pageRoutes.destroy(page.id).url, {
                preserveScroll: true,
            });
        }
    }

    return (
        <>
            <Head title="Pages" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Pages</h1>
                        <p className="text-muted-foreground text-sm">
                            Build your storefront pages from sections.
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            form.reset();
                            form.clearErrors();
                            setOpen(true);
                        }}
                    >
                        New page
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
                                <Badge variant="secondary">Home</Badge>
                            )}
                            {page.is_published ? (
                                <Badge>Published</Badge>
                            ) : (
                                <Badge variant="outline">Draft</Badge>
                            )}
                            <span className="text-muted-foreground text-sm">
                                {page.blocks_count} sections
                            </span>
                            {page.type !== 'home' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-auto"
                                    onClick={() => destroy(page)}
                                >
                                    Delete
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New page</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={create} className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="page-title">Title</Label>
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
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing && <Spinner />}
                                Create
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
