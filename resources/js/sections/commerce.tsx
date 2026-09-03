import type { CSSProperties } from 'react';
import {
    type PreviewContext,
    type PreviewProduct,
    prop,
    type PropValue,
    type SectionDef,
} from '@/lib/blocks';
import {
    ALIGN_OPTIONS,
    alignItems,
    Btn,
    EmptyNote,
    Heading,
    hrefFor,
    ProductCard,
    SectionShell,
} from './shared';

function resolveProducts(
    props: Record<string, PropValue>,
    ctx: PreviewContext,
): PreviewProduct[] {
    const source = String(prop(props, 'source', 'latest'));

    if (source === 'collection') {
        const id = prop<number | null>(props, 'collectionId', null);
        return ctx.collections.find((c) => c.id === id)?.products ?? [];
    }
    if (source === 'category') {
        const id = prop<number | null>(props, 'categoryId', null);
        return ctx.categories.find((c) => c.id === id)?.products ?? [];
    }
    if (source === 'bestSelling') {
        return ctx.bestSelling;
    }
    return ctx.products;
}

export const COMMERCE_SECTIONS: SectionDef[] = [
    {
        type: 'hero',
        group: 'Store',
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
                type: 'boolean',
                key: 'fullWidth',
                label: 'Full-width background',
                default: true,
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
            const fullWidth = Boolean(prop(props, 'fullWidth', true));
            return (
                <div
                    style={{
                        maxWidth: fullWidth ? undefined : 'var(--sb-container)',
                        backgroundImage: bg ? `url(${bg})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        color: bg ? '#fff' : 'var(--sb-foreground)',
                        borderRadius: fullWidth
                            ? undefined
                            : 'var(--sb-radius)',
                    }}
                    className="mx-auto w-full overflow-hidden"
                >
                    <SectionShell
                        py={4}
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
                        <Btn
                            label={prop(props, 'buttonLabel', '')}
                            url={prop(props, 'buttonUrl', '')}
                        />
                    </SectionShell>
                </div>
            );
        },
    },
    {
        type: 'richText',
        group: 'Store',
        label: 'Text block',
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
                options: ALIGN_OPTIONS,
                default: 'left',
            },
        ],
        Render: ({ props }) => {
            const align = String(prop(props, 'align', 'left'));
            return (
                <SectionShell
                    className={`flex flex-col gap-3 ${alignItems(align)}`}
                >
                    <Heading text={prop(props, 'heading', '')} />
                    <p
                        style={{ color: 'var(--sb-muted-foreground)' }}
                        className="max-w-2xl text-sm whitespace-pre-line"
                    >
                        {prop(props, 'body', '')}
                    </p>
                </SectionShell>
            );
        },
    },
    {
        type: 'imageWithText',
        group: 'Store',
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
                type: 'text',
                key: 'buttonUrl',
                label: 'Button link',
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
                <SectionShell
                    className={`flex flex-col items-center gap-6 sm:flex-row ${side === 'right' ? 'sm:flex-row-reverse' : ''}`}
                >
                    <div
                        style={{
                            background: 'var(--sb-muted)',
                            borderRadius: 'var(--sb-radius)',
                        }}
                        className="aspect-[4/3] w-full flex-1 overflow-hidden"
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
                        <Heading text={prop(props, 'heading', '')} />
                        <p
                            style={{ color: 'var(--sb-muted-foreground)' }}
                            className="text-sm"
                        >
                            {prop(props, 'body', '')}
                        </p>
                        <Btn
                            label={prop(props, 'buttonLabel', '')}
                            url={prop(props, 'buttonUrl', '')}
                        />
                    </div>
                </SectionShell>
            );
        },
    },
    {
        type: 'productGrid',
        group: 'Store',
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
                    { value: 'latest', label: 'Newest' },
                    { value: 'bestSelling', label: 'Best sellers' },
                    { value: 'collection', label: 'A collection' },
                    { value: 'category', label: 'A category' },
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
                type: 'category',
                key: 'categoryId',
                label: 'Category',
                default: null,
            },
            {
                type: 'number',
                key: 'columns',
                label: 'Columns',
                min: 2,
                max: 6,
                default: 3,
            },
            {
                type: 'select',
                key: 'cardSize',
                label: 'Card size',
                options: [
                    { value: 'sm', label: 'Small' },
                    { value: 'md', label: 'Medium' },
                    { value: 'lg', label: 'Large' },
                ],
                default: 'md',
            },
            {
                type: 'number',
                key: 'limit',
                label: 'Max products',
                min: 2,
                max: 18,
                default: 8,
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
            const products = resolveProducts(props, ctx).slice(
                0,
                Number(prop(props, 'limit', 8)),
            );
            const showPrice = Boolean(prop(props, 'showPrice', true));
            const display = String(prop(props, 'display', 'grid'));
            const columns = Number(prop(props, 'columns', 3));
            const cardSize = String(prop(props, 'cardSize', 'md')) as 'md';
            const gap = columns >= 5 ? 'gap-3' : 'gap-4';

            return (
                <SectionShell className="flex flex-col gap-4">
                    <Heading text={prop(props, 'heading', '')} />
                    {products.length === 0 ? (
                        <EmptyNote text="No products to show yet." />
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
                            className={`grid grid-cols-2 ${gap} sm:[grid-template-columns:repeat(var(--sb-cols),minmax(0,1fr))]`}
                            style={
                                {
                                    '--sb-cols': columns,
                                } as CSSProperties
                            }
                        >
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    showPrice={showPrice}
                                    href={hrefFor(ctx, product)}
                                    size={cardSize}
                                />
                            ))}
                        </div>
                    )}
                </SectionShell>
            );
        },
    },
    {
        type: 'featuredCollection',
        group: 'Store',
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
                key: 'columns',
                label: 'Columns',
                min: 2,
                max: 6,
                default: 4,
            },
            {
                type: 'select',
                key: 'cardSize',
                label: 'Card size',
                options: [
                    { value: 'sm', label: 'Small' },
                    { value: 'md', label: 'Medium' },
                    { value: 'lg', label: 'Large' },
                ],
                default: 'md',
            },
            {
                type: 'number',
                key: 'limit',
                label: 'Max products',
                min: 2,
                max: 12,
                default: 8,
            },
        ],
        Render: ({ props, ctx }) => {
            const id = prop<number | null>(props, 'collectionId', null);
            const collection = ctx.collections.find((c) => c.id === id);
            const limit = Number(prop(props, 'limit', 8));
            const columns = Number(prop(props, 'columns', 4));
            const cardSize = String(prop(props, 'cardSize', 'md')) as 'md';
            const heading =
                prop(props, 'heading', '') || collection?.title || 'Collection';

            return (
                <SectionShell className="flex flex-col gap-4">
                    <Heading text={heading} />
                    {!collection ? (
                        <EmptyNote text="Pick a collection to feature." />
                    ) : (
                        <div
                            className="grid grid-cols-2 gap-3 sm:[grid-template-columns:repeat(var(--sb-cols),minmax(0,1fr))]"
                            style={{ '--sb-cols': columns } as CSSProperties}
                        >
                            {collection.products
                                .slice(0, limit)
                                .map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        showPrice
                                        href={hrefFor(ctx, product)}
                                        size={cardSize}
                                    />
                                ))}
                        </div>
                    )}
                </SectionShell>
            );
        },
    },
];
