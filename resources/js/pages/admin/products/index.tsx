import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { dashboard } from '@/routes';
import products from '@/routes/products';

type ProductRow = {
    id: number;
    title: string;
    slug: string;
    status: string;
    variants_count: number;
    price_from: string | null;
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

type Props = {
    products: Paginated<ProductRow>;
};

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    active: 'default',
    draft: 'secondary',
    archived: 'outline',
};

export default function ProductsIndex({ products: page }: Props) {
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

                {page.data.length === 0 ? (
                    <div className="border-border text-muted-foreground rounded-xl border border-dashed p-12 text-center text-sm">
                        No products yet. Create your first one.
                    </div>
                ) : (
                    <div className="border-border overflow-x-auto rounded-xl border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground text-left">
                                <tr>
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
                                        className="border-border border-t"
                                    >
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
