import { Head, useForm } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { edit, update } from '@/routes/navigation';

type LinkType =
    | 'home'
    | 'shop'
    | 'cart'
    | 'category'
    | 'collection'
    | 'page'
    | 'url';

type NavRow = { label: string; type: LinkType; value: string };

type Target = { label: string; value: string };

type Props = {
    navigation: {
        header_links: NavRow[];
        footer_links: NavRow[];
        footer_note: string;
        show_category_nav: boolean;
    };
    targets: {
        categories: Target[];
        collections: Target[];
        pages: Target[];
    };
};

const TYPE_LABELS: Record<LinkType, string> = {
    home: 'Home page',
    shop: 'All products',
    cart: 'Cart',
    category: 'Category',
    collection: 'Collection',
    page: 'Page',
    url: 'Custom URL',
};

const NEEDS_TARGET: LinkType[] = ['category', 'collection', 'page', 'url'];

function move<T>(list: T[], from: number, to: number): T[] {
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
}

function LinkRows({
    rows,
    targets,
    onChange,
    errorKey,
    errors,
}: {
    rows: NavRow[];
    targets: Props['targets'];
    onChange: (rows: NavRow[]) => void;
    errorKey: string;
    errors: Record<string, string>;
}) {
    function patch(i: number, patch: Partial<NavRow>) {
        onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
    }

    function targetOptions(type: LinkType): Target[] {
        if (type === 'category') return targets.categories;
        if (type === 'collection') return targets.collections;
        if (type === 'page') return targets.pages;
        return [];
    }

    return (
        <div className="flex flex-col gap-3">
            {rows.map((row, i) => (
                <div
                    key={i}
                    className="border-border grid items-start gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_150px_1fr_auto]"
                >
                    <div className="grid gap-1">
                        <Input
                            value={row.label}
                            placeholder="Label"
                            onChange={(e) =>
                                patch(i, { label: e.target.value })
                            }
                        />
                        <InputError
                            message={errors[`${errorKey}.${i}.label`]}
                        />
                    </div>

                    <Select
                        value={row.type}
                        onValueChange={(v) =>
                            patch(i, { type: v as LinkType, value: '' })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {(Object.keys(TYPE_LABELS) as LinkType[]).map(
                                (t) => (
                                    <SelectItem key={t} value={t}>
                                        {TYPE_LABELS[t]}
                                    </SelectItem>
                                ),
                            )}
                        </SelectContent>
                    </Select>

                    <div className="grid gap-1">
                        {row.type === 'url' ? (
                            <Input
                                value={row.value}
                                placeholder="https://…"
                                onChange={(e) =>
                                    patch(i, { value: e.target.value })
                                }
                            />
                        ) : NEEDS_TARGET.includes(row.type) ? (
                            <Select
                                value={row.value}
                                onValueChange={(v) => patch(i, { value: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {targetOptions(row.type).map((o) => (
                                        <SelectItem
                                            key={o.value}
                                            value={o.value}
                                        >
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <span className="text-muted-foreground py-2 text-sm">
                                —
                            </span>
                        )}
                        <InputError
                            message={errors[`${errorKey}.${i}.value`]}
                        />
                    </div>

                    <div className="flex gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            disabled={i === 0}
                            onClick={() => onChange(move(rows, i, i - 1))}
                        >
                            <ArrowUp className="size-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            disabled={i === rows.length - 1}
                            onClick={() => onChange(move(rows, i, i + 1))}
                        >
                            <ArrowDown className="size-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground size-8"
                            onClick={() =>
                                onChange(rows.filter((_, idx) => idx !== i))
                            }
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() =>
                    onChange([...rows, { label: '', type: 'shop', value: '' }])
                }
            >
                <Plus className="size-4" />
                Add link
            </Button>
        </div>
    );
}

export default function NavigationEditor({ navigation, targets }: Props) {
    const form = useForm({
        header_links: navigation.header_links,
        footer_links: navigation.footer_links,
        footer_note: navigation.footer_note,
        show_category_nav: navigation.show_category_nav,
    });

    const errors = form.errors as Record<string, string>;

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.put(update().url, { preserveScroll: true });
    }

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
            <Head title="Navigation" />

            <form onSubmit={submit} className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">
                            Navigation &amp; footer
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            The links in your storefront header and footer.
                        </p>
                    </div>
                    <Button type="submit" disabled={form.processing}>
                        {form.processing && <Spinner />}
                        Save
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Header menu</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <LinkRows
                            rows={form.data.header_links}
                            targets={targets}
                            errorKey="header_links"
                            errors={errors}
                            onChange={(rows) =>
                                form.setData('header_links', rows)
                            }
                        />
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={form.data.show_category_nav}
                                onCheckedChange={(c) =>
                                    form.setData(
                                        'show_category_nav',
                                        c === true,
                                    )
                                }
                            />
                            Also show top-level category links
                        </label>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Footer</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="footer-note">
                                Footer text{' '}
                                <span className="text-muted-foreground font-normal">
                                    (a short line about the store)
                                </span>
                            </Label>
                            <Textarea
                                id="footer-note"
                                rows={2}
                                value={form.data.footer_note}
                                onChange={(e) =>
                                    form.setData('footer_note', e.target.value)
                                }
                            />
                            <InputError message={errors.footer_note} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Footer links</Label>
                            <LinkRows
                                rows={form.data.footer_links}
                                targets={targets}
                                errorKey="footer_links"
                                errors={errors}
                                onChange={(rows) =>
                                    form.setData('footer_links', rows)
                                }
                            />
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}

NavigationEditor.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Navigation', href: edit() },
    ],
};
