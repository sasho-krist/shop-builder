import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import StorefrontLayout from '@/layouts/storefront-layout';

type Variant = {
    id: number;
    name: string;
    price: string;
    compare_at_price: string | null;
    in_stock: boolean;
};

type Props = {
    product: {
        id: number;
        title: string;
        slug: string;
        description: string | null;
        images: { url: string; alt: string | null }[];
        variants: Variant[];
    };
};

export default function StorefrontProduct({ product }: Props) {
    const [variantId, setVariantId] = useState(product.variants[0]?.id ?? 0);
    const [activeImage, setActiveImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const variant = product.variants.find((v) => v.id === variantId);

    function addToCart() {
        router.post(
            '/cart',
            { variant_id: variantId, quantity },
            { preserveScroll: true },
        );
    }

    return (
        <StorefrontLayout>
            <Head title={product.title} />

            <div
                className="mx-auto grid w-full gap-10 px-4 py-10 md:grid-cols-2"
                style={{ maxWidth: 'var(--sb-container)' }}
            >
                <div className="flex flex-col gap-3">
                    <div
                        style={{
                            background: 'var(--sb-muted)',
                            borderRadius: 'var(--sb-radius)',
                        }}
                        className="aspect-square overflow-hidden"
                    >
                        {product.images[activeImage] && (
                            <img
                                src={product.images[activeImage].url}
                                alt={
                                    product.images[activeImage].alt ??
                                    product.title
                                }
                                className="size-full object-cover"
                            />
                        )}
                    </div>
                    {product.images.length > 1 && (
                        <div className="flex gap-2">
                            {product.images.map((image, index) => (
                                <button
                                    key={image.url}
                                    type="button"
                                    onClick={() => setActiveImage(index)}
                                    style={{
                                        borderColor:
                                            index === activeImage
                                                ? 'var(--sb-primary)'
                                                : 'var(--sb-border)',
                                        borderRadius: 'var(--sb-radius)',
                                    }}
                                    className="size-16 overflow-hidden border"
                                >
                                    <img
                                        src={image.url}
                                        alt=""
                                        className="size-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    <h1
                        style={{ fontFamily: 'var(--sb-heading-font)' }}
                        className="text-3xl font-bold"
                    >
                        {product.title}
                    </h1>

                    {variant && (
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-semibold">
                                {variant.price}
                            </span>
                            {variant.compare_at_price && (
                                <span
                                    style={{
                                        color: 'var(--sb-muted-foreground)',
                                    }}
                                    className="line-through"
                                >
                                    {variant.compare_at_price}
                                </span>
                            )}
                        </div>
                    )}

                    {product.variants.length > 1 && (
                        <div className="flex flex-wrap gap-2">
                            {product.variants.map((v) => (
                                <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => setVariantId(v.id)}
                                    style={{
                                        borderColor:
                                            v.id === variantId
                                                ? 'var(--sb-primary)'
                                                : 'var(--sb-border)',
                                        borderRadius: 'var(--sb-radius)',
                                    }}
                                    className="border px-3 py-1.5 text-sm"
                                >
                                    {v.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            min={1}
                            max={99}
                            value={quantity}
                            onChange={(e) =>
                                setQuantity(Math.max(1, Number(e.target.value)))
                            }
                            style={{ borderColor: 'var(--sb-border)' }}
                            className="w-16 rounded-md border px-2 py-2 text-center"
                        />
                        <button
                            type="button"
                            onClick={addToCart}
                            disabled={!variant?.in_stock}
                            style={{
                                background: 'var(--sb-primary)',
                                color: 'var(--sb-primary-foreground)',
                                borderRadius: 'var(--sb-radius)',
                            }}
                            className="flex-1 px-6 py-3 font-semibold disabled:opacity-50"
                        >
                            {variant?.in_stock ? 'Add to cart' : 'Out of stock'}
                        </button>
                    </div>

                    {product.description && (
                        <p
                            style={{ color: 'var(--sb-muted-foreground)' }}
                            className="text-sm whitespace-pre-line"
                        >
                            {product.description}
                        </p>
                    )}
                </div>
            </div>
        </StorefrontLayout>
    );
}
