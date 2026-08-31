import { Head, Link, router, usePage } from '@inertiajs/react';
import StorefrontBlocks from '@/components/storefront-blocks';
import type { StorefrontShared } from '@/layouts/storefront-layout';
import StorefrontLayout from '@/layouts/storefront-layout';
import type { Block, PreviewContext } from '@/lib/blocks';
import { useT } from '@/lib/i18n';
import { money } from '@/lib/money';

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
    heading: string;
    description: string | null;
    products: Paginated<ProductRow>;
    /** Present on the "Shop" page — builder sections rendered above the grid. */
    blocks?: Block[];
    sections?: Omit<PreviewContext, 'hrefBase'>;
};

export default function StorefrontListing({
    heading,
    description,
    products,
    blocks,
    sections,
}: Props) {
    const { storefront } = usePage<StorefrontShared>().props;
    const symbol = storefront.currencySymbol;
    const { t } = useT();

    return (
        <StorefrontLayout
            ownerEdit={
                storefront.manage?.shopPage
                    ? {
                          href: storefront.manage.shopPage,
                          label: t('Edit shop'),
                      }
                    : undefined
            }
        >
            <Head title={heading} />

            {blocks && blocks.length > 0 && sections && (
                <StorefrontBlocks
                    blocks={blocks}
                    sections={sections}
                    editBase={storefront.manage?.shopPage ?? null}
                />
            )}

            <div
                className="mx-auto w-full px-5 py-10 sm:px-8"
                style={{ maxWidth: 'var(--sb-container)' }}
            >
                <h1
                    style={{ fontFamily: 'var(--sb-heading-font)' }}
                    className="text-3xl font-bold"
                >
                    {heading}
                </h1>
                {description && (
                    <p
                        style={{ color: 'var(--sb-muted-foreground)' }}
                        className="mt-2 max-w-2xl text-sm"
                    >
                        {description}
                    </p>
                )}

                {products.data.length === 0 ? (
                    <p
                        style={{ color: 'var(--sb-muted-foreground)' }}
                        className="mt-6"
                    >
                        {t('No products here yet.')}
                    </p>
                ) : (
                    <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
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
                                            {money(product.price, symbol)}
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
                            ← {t('Previous')}
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
                            {t('Next')} →
                        </button>
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}
