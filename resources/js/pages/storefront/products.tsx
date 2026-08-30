import { Head, Link, router } from '@inertiajs/react';
import StorefrontLayout from '@/layouts/storefront-layout';

type ProductRow = {
    id: number;
    title: string;
    slug: string;
    price: string | null;
    image: string | null;
};

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type Props = {
    products: Paginated<ProductRow>;
};

export default function StorefrontProducts({ products }: Props) {
    return (
        <StorefrontLayout>
            <Head title="Shop" />

            <div
                className="mx-auto w-full px-4 py-10"
                style={{ maxWidth: 'var(--sb-container)' }}
            >
                <h1
                    style={{ fontFamily: 'var(--sb-heading-font)' }}
                    className="mb-6 text-3xl font-bold"
                >
                    Shop
                </h1>

                {products.data.length === 0 ? (
                    <p style={{ color: 'var(--sb-muted-foreground)' }}>
                        No products yet.
                    </p>
                ) : (
                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                        {products.data.map((product) => (
                            <Link
                                key={product.id}
                                href={`/p/${product.slug}`}
                                className="block"
                            >
                                <div
                                    style={{
                                        background: 'var(--sb-muted)',
                                        borderRadius: 'var(--sb-radius)',
                                    }}
                                    className="aspect-square overflow-hidden"
                                >
                                    {product.image && (
                                        <img
                                            src={product.image}
                                            alt={product.title}
                                            className="size-full object-cover"
                                        />
                                    )}
                                </div>
                                <div className="mt-2">
                                    <div
                                        style={{
                                            fontFamily:
                                                'var(--sb-heading-font)',
                                        }}
                                        className="text-sm font-semibold"
                                    >
                                        {product.title}
                                    </div>
                                    {product.price && (
                                        <div
                                            style={{
                                                color: 'var(--sb-muted-foreground)',
                                            }}
                                            className="text-sm"
                                        >
                                            {product.price}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {products.last_page > 1 && (
                    <div className="mt-8 flex justify-center gap-3 text-sm">
                        <button
                            type="button"
                            disabled={!products.prev_page_url}
                            className="disabled:opacity-40"
                            onClick={() =>
                                products.prev_page_url &&
                                router.visit(products.prev_page_url)
                            }
                        >
                            ← Previous
                        </button>
                        <span style={{ color: 'var(--sb-muted-foreground)' }}>
                            {products.current_page} / {products.last_page}
                        </span>
                        <button
                            type="button"
                            disabled={!products.next_page_url}
                            className="disabled:opacity-40"
                            onClick={() =>
                                products.next_page_url &&
                                router.visit(products.next_page_url)
                            }
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}
