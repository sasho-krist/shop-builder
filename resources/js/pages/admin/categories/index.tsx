import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import categoryRoutes from '@/routes/categories';

type Category = {
    id: number;
    parent_id: number | null;
    name: string;
    slug: string;
    description: string | null;
    position: number;
    products_count: number;
};

type Props = {
    categories: Category[];
};

const NO_PARENT = 'none';

function descendantIds(all: Category[], id: number): number[] {
    const out = [id];
    for (const child of all.filter((c) => c.parent_id === id)) {
        out.push(...descendantIds(all, child.id));
    }
    return out;
}

function orderedTree(all: Category[]): { category: Category; depth: number }[] {
    const rows: { category: Category; depth: number }[] = [];
    const walk = (parentId: number | null, depth: number) => {
        for (const category of all.filter((c) => c.parent_id === parentId)) {
            rows.push({ category, depth });
            walk(category.id, depth + 1);
        }
    };
    walk(null, 0);
    return rows;
}

export default function CategoriesIndex({ categories }: Props) {
    const [editing, setEditing] = useState<Category | null>(null);
    const [open, setOpen] = useState(false);

    const form = useForm({
        name: '',
        slug: '',
        description: '',
        parent_id: NO_PARENT,
    });

    const rows = useMemo(() => orderedTree(categories), [categories]);

    const parentChoices = useMemo(() => {
        const blocked = editing
            ? new Set(descendantIds(categories, editing.id))
            : new Set<number>();
        return orderedTree(categories).filter(
            ({ category }) => !blocked.has(category.id),
        );
    }, [categories, editing]);

    function openCreate(parentId: number | null) {
        setEditing(null);
        form.clearErrors();
        form.setData({
            name: '',
            slug: '',
            description: '',
            parent_id: parentId === null ? NO_PARENT : String(parentId),
        });
        setOpen(true);
    }

    function openEdit(category: Category) {
        setEditing(category);
        form.clearErrors();
        form.setData({
            name: category.name,
            slug: category.slug,
            description: category.description ?? '',
            parent_id:
                category.parent_id === null
                    ? NO_PARENT
                    : String(category.parent_id),
        });
        setOpen(true);
    }

    function submit(event: React.FormEvent) {
        event.preventDefault();

        const options = {
            onSuccess: () => setOpen(false),
            preserveScroll: true,
        };

        form.transform((data) => ({
            ...data,
            parent_id: data.parent_id === NO_PARENT ? null : data.parent_id,
        }));

        if (editing) {
            form.put(categoryRoutes.update(editing.id).url, options);
        } else {
            form.post(categoryRoutes.store().url, options);
        }
    }

    function destroy(category: Category) {
        if (
            confirm(
                `Delete "${category.name}"? Subcategories move up one level; products stay.`,
            )
        ) {
            router.delete(categoryRoutes.destroy(category.id).url, {
                preserveScroll: true,
            });
        }
    }

    return (
        <>
            <Head title="Categories" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Categories</h1>
                        <p className="text-muted-foreground text-sm">
                            {categories.length}{' '}
                            {categories.length === 1
                                ? 'category'
                                : 'categories'}
                        </p>
                    </div>
                    <Button onClick={() => openCreate(null)}>
                        New category
                    </Button>
                </div>

                {rows.length === 0 ? (
                    <div className="border-border text-muted-foreground rounded-xl border border-dashed p-12 text-center text-sm">
                        No categories yet.
                    </div>
                ) : (
                    <div className="border-border divide-border divide-y rounded-xl border">
                        {rows.map(({ category, depth }) => (
                            <div
                                key={category.id}
                                className="flex items-center gap-3 px-4 py-2"
                            >
                                <span
                                    className="flex items-center gap-2"
                                    style={{ paddingLeft: `${depth * 20}px` }}
                                >
                                    {depth > 0 && (
                                        <span className="text-muted-foreground">
                                            ↳
                                        </span>
                                    )}
                                    <span className="font-medium">
                                        {category.name}
                                    </span>
                                </span>
                                <Badge variant="secondary">
                                    {category.products_count}
                                </Badge>
                                <div className="ml-auto flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openCreate(category.id)}
                                    >
                                        Add sub
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openEdit(category)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => destroy(category)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Edit category' : 'New category'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={submit} className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="cat-name">Name</Label>
                            <Input
                                id="cat-name"
                                value={form.data.name}
                                autoFocus
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                            />
                            <InputError message={form.errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="cat-slug">
                                Slug{' '}
                                <span className="text-muted-foreground font-normal">
                                    (blank = from name)
                                </span>
                            </Label>
                            <Input
                                id="cat-slug"
                                value={form.data.slug}
                                placeholder="auto"
                                onChange={(e) =>
                                    form.setData('slug', e.target.value)
                                }
                            />
                            <InputError message={form.errors.slug} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="cat-parent">Parent</Label>
                            <Select
                                value={form.data.parent_id}
                                onValueChange={(value) =>
                                    form.setData('parent_id', value)
                                }
                            >
                                <SelectTrigger id="cat-parent">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NO_PARENT}>
                                        — Top level —
                                    </SelectItem>
                                    {parentChoices.map(
                                        ({ category, depth }) => (
                                            <SelectItem
                                                key={category.id}
                                                value={String(category.id)}
                                            >
                                                {' '.repeat(depth * 2)}
                                                {category.name}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.parent_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="cat-description">Description</Label>
                            <Textarea
                                id="cat-description"
                                rows={3}
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                            />
                            <InputError message={form.errors.description} />
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
                                {editing ? 'Save' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

CategoriesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Categories', href: categoryRoutes.index() },
    ],
};
