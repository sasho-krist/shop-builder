import { Head, Link, router } from '@inertiajs/react';
import { ImageIcon, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes';
import products from '@/routes/products';

type ProductRow = {
    id: number;
    title: string;
    slug: string;
    status: string;
    variants_count: number;
    price_from: string | null;
    thumbnail: string | null;
    updated_at: string | null;
};

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type Filters = {
    search: string;
    status: string;
    sort: string;
};

type Props = {
    products: Paginated<ProductRow>;
    statuses: string[];
    filters: Filters;
};

const STATUS_ANY = 'all';

const sortLabels: Record<string, string> = {
    latest: 'Newest first',
    oldest: 'Oldest first',
    title: 'Title A–Z',
    title_desc: 'Title Z–A',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    active: 'default',
    draft: 'secondary',
    archived: 'outline',
};

export default function ProductsIndex({
    products: page,
    statuses,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const firstRender = useRef(true);

    function navigate(params: Partial<Filters>) {
        const merged = { ...filters, search, ...params };
        router.get(
            products.index().url,
            {
                search: merged.search || undefined,
                status: merged.status || undefined,
                sort: merged.sort === 'latest' ? undefined : merged.sort,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['products', 'filters'],
            },
        );
    }

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        if (search === filters.search) {
            return;
        }
        const timer = setTimeout(() => {
            router.get(
                products.index().url,
                {
                    search: search || undefined,
                    status: filters.status || undefined,
                    sort: filters.sort === 'latest' ? undefined : filters.sort,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['products', 'filters'],
                },
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [search, filters.search, filters.status, filters.sort]);

    const hasFilters =
        filters.search !== '' ||
        filters.status !== '' ||
        filters.sort !== 'latest';

    function destroy(product: ProductRow) {
        if (confirm(`Delete "${product.title}"? This cannot be undone.`)) {
            router.delete(products.destroy(product.id).url, {
                preserveScroll: true,
            });
        }
    }

    return (
        <>
            <Head title="Products" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Products</h1>
                        <p className="text-muted-foreground text-sm">
                            {page.total}{' '}
                            {page.total === 1 ? 'product' : 'products'}
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={products.create().url}>New product</Link>
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-56 flex-1">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            value={search}
                            placeholder="Search products…"
                            className="pl-9"
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <Select
                        value={filters.status || STATUS_ANY}
                        onValueChange={(value) =>
                            navigate({
                                status: value === STATUS_ANY ? '' : value,
                            })
                        }
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={STATUS_ANY}>
                                All statuses
                            </SelectItem>
                            {statuses.map((status) => (
                                <SelectItem
                                    key={status}
                                    value={status}
                                    className="capitalize"
                                >
                                    {status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.sort}
                        onValueChange={(value) => navigate({ sort: value })}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(sortLabels).map(
                                ([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ),
                            )}
                        </SelectContent>
                    </Select>

                    {hasFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSearch('');
                                router.get(
                                    products.index().url,
                                    {},
                                    {
                                        preserveScroll: true,
                                        replace: true,
                                        only: ['products', 'filters'],
                                    },
                                );
                            }}
                        >
                            Clear
                        </Button>
                    )}
                </div>

                {page.data.length === 0 ? (
                    <div className="border-border text-muted-foreground rounded-xl border border-dashed p-12 text-center text-sm">
                        {hasFilters
                            ? 'No products match these filters.'
                            : 'No products yet. Create your first one.'}
                    </div>
                ) : (
                    <div className="border-border overflow-x-auto rounded-xl border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground text-left">
                                <tr>
                                    <th className="w-14 px-4 py-2"></th>
                                    <th className="px-4 py-2 font-medium">
                                        Title
                                    </th>
                                    <th className="px-4 py-2 font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-2 font-medium">
                                        Variants
                                    </th>
                                    <th className="px-4 py-2 font-medium">
                                        Price from
                                    </th>
                                    <th className="px-4 py-2 font-medium">
                                        Updated
                                    </th>
                                    <th className="px-4 py-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {page.data.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="border-border animate-in fade-in border-t duration-300"
                                    >
                                        <td className="px-4 py-2">
                                            <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center overflow-hidden rounded-md">
                                                {product.thumbnail ? (
                                                    <img
                                                        src={product.thumbnail}
                                                        alt=""
                                                        className="size-full object-cover"
                                                    />
                                                ) : (
                                                    <ImageIcon className="size-4" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <Link
                                                href={
                                                    products.edit(product.id)
                                                        .url
                                                }
                                                className="font-medium hover:underline"
                                            >
                                                {product.title}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2">
                                            <Badge
                                                variant={
                                                    statusVariant[
                                                        product.status
                                                    ] ?? 'secondary'
                                                }
                                                className="capitalize"
                                            >
                                                {product.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-2">
                                            {product.variants_count}
                                        </td>
                                        <td className="px-4 py-2">
                                            {product.price_from ?? '—'}
                                        </td>
                                        <td className="text-muted-foreground px-4 py-2">
                                            {product.updated_at ?? '—'}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => destroy(product)}
                                            >
                                                Delete
                                            </Button>
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
                            Page {page.current_page} of {page.last_page}
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
                                Previous
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
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

ProductsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Products', href: products.index() },
    ],
};
