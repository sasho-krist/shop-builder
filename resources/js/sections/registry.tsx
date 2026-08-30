import {
    type PreviewContext,
    type PreviewProduct,
    prop,
    type PropValue,
    type SectionDef,
} from '@/lib/blocks';

function hrefFor(
    ctx: PreviewContext,
    product: PreviewProduct,
): string | undefined {
    return ctx.hrefBase && product.slug
        ? `${ctx.hrefBase}${product.slug}`
        : undefined;
}

function ProductCard({
    product,
    showPrice,
    href,
}: {
    product: PreviewProduct;
    showPrice: boolean;
    href?: string;
}) {
    const Wrapper = href ? 'a' : 'div';
    return (
        <Wrapper
            href={href}
            style={{
                borderColor: 'var(--sb-border)',
                borderRadius: 'var(--sb-radius)',
            }}
            className="block overflow-hidden border"
        >
            <div
                style={{ background: 'var(--sb-muted)' }}
                className="aspect-square"
            >
                {product.image && (
                    <img
                        src={product.image}
                        alt={product.title}
                        className="size-full object-cover"
                    />
                )}
            </div>
            <div className="flex flex-col gap-0.5 p-3">
                <span
                    style={{ fontFamily: 'var(--sb-heading-font)' }}
                    className="truncate text-sm font-semibold"
                >
                    {product.title}
                </span>
                {showPrice && product.price && (
                    <span
                        style={{ color: 'var(--sb-muted-foreground)' }}
                        className="text-sm"
                    >
                        {product.price}
                    </span>
                )}
            </div>
        </Wrapper>
    );
}

function Button({ label }: { label: string }) {
    if (!label) return null;
    return (
        <button
            type="button"
            style={{
                background: 'var(--sb-primary)',
                color: 'var(--sb-primary-foreground)',
                borderRadius: 'var(--sb-radius)',
                fontFamily: 'var(--sb-body-font)',
            }}
            className="px-5 py-2.5 text-sm font-semibold"
        >
            {label}
        </button>
    );
}

function resolveProducts(
    props: Record<string, PropValue>,
    ctx: PreviewContext,
): PreviewProduct[] {
    if (String(prop(props, 'source', 'latest')) === 'collection') {
        const id = prop<number | null>(props, 'collectionId', null);
        return ctx.collections.find((c) => c.id === id)?.products ?? [];
    }
    return ctx.products;
}

export const SECTIONS: SectionDef[] = [
    {
        type: 'hero',
        label: 'Hero',
        description: 'Big headline with a call to action',
        fields: [
            {
                type: 'text',
                key: 'heading',
                label: 'Heading',
                default: 'Fresh, honest goods.',
            },
            {
                type: 'textarea',
                key: 'subheading',
                label: 'Subheading',
                default: 'Everything your body will thank you for.',
            },
            {
                type: 'text',
                key: 'buttonLabel',
                label: 'Button label',
                default: 'Shop now',
            },
            {
                type: 'text',
                key: 'buttonUrl',
                label: 'Button link',
                default: '/products',
            },
            {
                type: 'image',
                key: 'background',
                label: 'Background image',
                default: '',
            },
            {
                type: 'select',
                key: 'align',
                label: 'Alignment',
                options: [
                    { value: 'left', label: 'Left' },
                    { value: 'center', label: 'Center' },
                ],
                default: 'left',
            },
        ],
        Render: ({ props }) => {
            const align = String(prop(props, 'align', 'left'));
            const bg = String(prop(props, 'background', ''));
            return (
                <div
                    style={{
                        padding:
                            'calc(var(--sb-spacing) * 3) var(--sb-spacing)',
                        backgroundImage: bg ? `url(${bg})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        color: bg ? '#fff' : 'var(--sb-foreground)',
                    }}
                    className={`flex flex-col gap-4 ${align === 'center' ? 'items-center text-center' : 'items-start'}`}
                >
                    <h1
                        style={{ fontFamily: 'var(--sb-heading-font)' }}
                        className="max-w-2xl text-4xl font-bold"
                    >
                        {prop(props, 'heading', '')}
                    </h1>
                    <p className="max-w-lg text-base opacity-90">
                        {prop(props, 'subheading', '')}
                    </p>
                    <Button label={prop(props, 'buttonLabel', '')} />
                </div>
            );
        },
    },
    {
        type: 'richText',
        label: 'Text',
        description: 'A heading and a paragraph',
        fields: [
            {
                type: 'text',
                key: 'heading',
                label: 'Heading',
                default: 'About us',
            },
            {
                type: 'textarea',
                key: 'body',
                label: 'Body',
                default: 'Tell your story here.',
            },
            {
                type: 'select',
                key: 'align',
                label: 'Alignment',
                options: [
                    { value: 'left', label: 'Left' },
                    { value: 'center', label: 'Center' },
                ],
                default: 'left',
            },
        ],
        Render: ({ props }) => {
            const align = String(prop(props, 'align', 'left'));
            return (
                <div
                    style={{ padding: 'calc(var(--sb-spacing) * 2)' }}
                    className={`mx-auto flex max-w-2xl flex-col gap-3 ${align === 'center' ? 'items-center text-center' : ''}`}
                >
                    <h2
                        style={{ fontFamily: 'var(--sb-heading-font)' }}
                        className="text-2xl font-bold"
                    >
                        {prop(props, 'heading', '')}
                    </h2>
                    <p
                        style={{ color: 'var(--sb-muted-foreground)' }}
                        className="text-sm whitespace-pre-line"
                    >
                        {prop(props, 'body', '')}
                    </p>
                </div>
            );
        },
    },
    {
        type: 'imageWithText',
        label: 'Image + text',
        description: 'An image next to a block of text',
        fields: [
            { type: 'image', key: 'image', label: 'Image', default: '' },
            {
                type: 'text',
                key: 'heading',
                label: 'Heading',
                default: 'Crafted with care',
            },
            {
                type: 'textarea',
                key: 'body',
                label: 'Body',
                default: 'A few words about this.',
            },
            {
                type: 'text',
                key: 'buttonLabel',
                label: 'Button label',
                default: '',
            },
            {
                type: 'select',
                key: 'imageSide',
                label: 'Image side',
                options: [
                    { value: 'left', label: 'Left' },
                    { value: 'right', label: 'Right' },
                ],
                default: 'left',
            },
        ],
        Render: ({ props }) => {
            const image = String(prop(props, 'image', ''));
            const side = String(prop(props, 'imageSide', 'left'));
            return (
                <div
                    style={{
                        padding: 'calc(var(--sb-spacing) * 2)',
                        gap: 'calc(var(--sb-spacing) * 2)',
                    }}
                    className={`flex items-center ${side === 'right' ? 'flex-row-reverse' : ''}`}
                >
                    <div
                        style={{
                            background: 'var(--sb-muted)',
                            borderRadius: 'var(--sb-radius)',
                        }}
                        className="aspect-[4/3] flex-1 overflow-hidden"
                    >
                        {image && (
                            <img
                                src={image}
                                alt=""
                                className="size-full object-cover"
                            />
                        )}
                    </div>
                    <div className="flex flex-1 flex-col gap-3">
                        <h2
                            style={{ fontFamily: 'var(--sb-heading-font)' }}
                            className="text-2xl font-bold"
                        >
                            {prop(props, 'heading', '')}
                        </h2>
                        <p
                            style={{ color: 'var(--sb-muted-foreground)' }}
                            className="text-sm"
                        >
                            {prop(props, 'body', '')}
                        </p>
                        <Button label={prop(props, 'buttonLabel', '')} />
                    </div>
                </div>
            );
        },
    },
    {
        type: 'productGrid',
        label: 'Product grid',
        description: 'A grid or list of products',
        fields: [
            {
                type: 'text',
                key: 'heading',
                label: 'Heading',
                default: 'Featured products',
            },
            {
                type: 'select',
                key: 'source',
                label: 'Products from',
                options: [
                    { value: 'latest', label: 'Latest products' },
                    { value: 'collection', label: 'A collection' },
                ],
                default: 'latest',
            },
            {
                type: 'collection',
                key: 'collectionId',
                label: 'Collection',
                default: null,
            },
            {
                type: 'number',
                key: 'columns',
                label: 'Columns',
                min: 2,
                max: 4,
                default: 3,
            },
            {
                type: 'select',
                key: 'display',
                label: 'Layout',
                options: [
                    { value: 'grid', label: 'Grid' },
                    { value: 'list', label: 'List' },
                ],
                default: 'grid',
            },
            {
                type: 'boolean',
                key: 'showPrice',
                label: 'Show price',
                default: true,
            },
        ],
        Render: ({ props, ctx }) => {
            const products = resolveProducts(props, ctx).slice(0, 8);
            const showPrice = Boolean(prop(props, 'showPrice', true));
            const display = String(prop(props, 'display', 'grid'));
            const columns = Number(prop(props, 'columns', 3));

            return (
                <div
                    style={{ padding: 'calc(var(--sb-spacing) * 2)' }}
                    className="flex flex-col gap-4"
                >
                    <h2
                        style={{ fontFamily: 'var(--sb-heading-font)' }}
                        className="text-2xl font-bold"
                    >
                        {prop(props, 'heading', '')}
                    </h2>
                    {products.length === 0 ? (
                        <p
                            style={{ color: 'var(--sb-muted-foreground)' }}
                            className="text-sm"
                        >
                            No products to show yet.
                        </p>
                    ) : display === 'list' ? (
                        <div className="flex flex-col gap-2">
                            {products.map((product) => (
                                <div
                                    key={product.id}
                                    style={{
                                        borderColor: 'var(--sb-border)',
                                        borderRadius: 'var(--sb-radius)',
                                    }}
                                    className="flex items-center gap-3 border p-2"
                                >
                                    <div
                                        style={{
                                            background: 'var(--sb-muted)',
                                        }}
                                        className="size-12 shrink-0 overflow-hidden rounded"
                                    >
                                        {product.image && (
                                            <img
                                                src={product.image}
                                                alt=""
                                                className="size-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <span className="flex-1 text-sm font-medium">
                                        {product.title}
                                    </span>
                                    {showPrice && product.price && (
                                        <span
                                            style={{
                                                color: 'var(--sb-muted-foreground)',
                                            }}
                                            className="text-sm"
                                        >
                                            {product.price}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div
                            className="grid gap-4"
                            style={{
                                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                            }}
                        >
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    showPrice={showPrice}
                                    href={hrefFor(ctx, product)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            );
        },
    },
    {
        type: 'featuredCollection',
        label: 'Featured collection',
        description: 'A collection title with its products',
        fields: [
            {
                type: 'collection',
                key: 'collectionId',
                label: 'Collection',
                default: null,
            },
            {
                type: 'text',
                key: 'heading',
                label: 'Heading override',
                default: '',
            },
            {
                type: 'number',
                key: 'limit',
                label: 'Max products',
                min: 2,
                max: 8,
                default: 4,
            },
        ],
        Render: ({ props, ctx }) => {
            const id = prop<number | null>(props, 'collectionId', null);
            const collection = ctx.collections.find((c) => c.id === id);
            const limit = prop(props, 'limit', 4);
            const heading =
                prop(props, 'heading', '') || collection?.title || 'Collection';

            return (
                <div
                    style={{ padding: 'calc(var(--sb-spacing) * 2)' }}
                    className="flex flex-col gap-4"
                >
                    <h2
                        style={{ fontFamily: 'var(--sb-heading-font)' }}
                        className="text-2xl font-bold"
                    >
                        {heading}
                    </h2>
                    {!collection ? (
                        <p
                            style={{ color: 'var(--sb-muted-foreground)' }}
                            className="text-sm"
                        >
                            Pick a collection to feature.
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            {collection.products
                                .slice(0, limit)
                                .map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        showPrice
                                        href={hrefFor(ctx, product)}
                                    />
                                ))}
                        </div>
                    )}
                </div>
            );
        },
    },
];

export function getSection(type: string): SectionDef | undefined {
    return SECTIONS.find((section) => section.type === type);
}
