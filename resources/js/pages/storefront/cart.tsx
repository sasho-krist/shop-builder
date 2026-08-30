import { Head, Link, router } from '@inertiajs/react';
import { Minus, Plus, X } from 'lucide-react';
import StorefrontLayout from '@/layouts/storefront-layout';
import { money } from '@/lib/money';

type CartItem = {
    id: number;
    quantity: number;
    unit_price: string;
    subtotal: string;
    variant_name: string;
    product_title: string;
    product_slug: string;
    image: string | null;
};

type Props = {
    cart: {
        items: CartItem[];
        subtotal: string;
        count: number;
        currency_symbol: string;
    };
};

export default function StorefrontCart({ cart }: Props) {
    function setQuantity(item: CartItem, quantity: number) {
        router.patch(
            `/cart/${item.id}`,
            { quantity: Math.max(0, quantity) },
            { preserveScroll: true },
        );
    }

    function remove(item: CartItem) {
        router.delete(`/cart/${item.id}`, { preserveScroll: true });
    }

    return (
        <StorefrontLayout>
            <Head title="Cart" />

            <div
                className="mx-auto w-full px-5 py-10 sm:px-8"
                style={{ maxWidth: 'var(--sb-container)' }}
            >
                <h1
                    style={{ fontFamily: 'var(--sb-heading-font)' }}
                    className="mb-6 text-3xl font-bold"
                >
                    Your cart
                </h1>

                {cart.items.length === 0 ? (
                    <p style={{ color: 'var(--sb-muted-foreground)' }}>
                        Your cart is empty.{' '}
                        <Link href="/products" className="underline">
                            Browse products
                        </Link>
                    </p>
                ) : (
                    <div className="flex flex-col gap-6 md:flex-row md:items-start">
                        <ul className="flex flex-1 flex-col">
                            {cart.items.map((item) => (
                                <li
                                    key={item.id}
                                    style={{ borderColor: 'var(--sb-border)' }}
                                    className="flex items-center gap-4 border-b py-4"
                                >
                                    <div
                                        style={{
                                            background: 'var(--sb-muted)',
                                            borderRadius: 'var(--sb-radius)',
                                        }}
                                        className="size-16 shrink-0 overflow-hidden"
                                    >
                                        {item.image && (
                                            <img
                                                src={item.image}
                                                alt=""
                                                className="size-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <Link
                                            href={`/p/${item.product_slug}`}
                                            className="font-medium"
                                        >
                                            {item.product_title}
                                        </Link>
                                        <div
                                            style={{
                                                color: 'var(--sb-muted-foreground)',
                                            }}
                                            className="text-sm"
                                        >
                                            {item.variant_name} ·{' '}
                                            {money(
                                                item.unit_price,
                                                cart.currency_symbol,
                                            )}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            borderColor: 'var(--sb-border)',
                                        }}
                                        className="flex items-center rounded-md border"
                                    >
                                        <button
                                            type="button"
                                            className="px-2 py-1.5"
                                            onClick={() =>
                                                setQuantity(
                                                    item,
                                                    item.quantity - 1,
                                                )
                                            }
                                        >
                                            <Minus className="size-3.5" />
                                        </button>
                                        <span className="w-8 text-center text-sm">
                                            {item.quantity}
                                        </span>
                                        <button
                                            type="button"
                                            className="px-2 py-1.5"
                                            onClick={() =>
                                                setQuantity(
                                                    item,
                                                    item.quantity + 1,
                                                )
                                            }
                                        >
                                            <Plus className="size-3.5" />
                                        </button>
                                    </div>
                                    <div className="w-24 text-right text-sm font-medium">
                                        {money(
                                            item.subtotal,
                                            cart.currency_symbol,
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => remove(item)}
                                        style={{
                                            color: 'var(--sb-muted-foreground)',
                                        }}
                                    >
                                        <X className="size-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <div
                            style={{
                                borderColor: 'var(--sb-border)',
                                borderRadius: 'var(--sb-radius)',
                            }}
                            className="w-full shrink-0 border p-5 md:w-72"
                        >
                            <div className="flex justify-between text-sm">
                                <span
                                    style={{
                                        color: 'var(--sb-muted-foreground)',
                                    }}
                                >
                                    Subtotal
                                </span>
                                <span className="font-semibold">
                                    {money(cart.subtotal, cart.currency_symbol)}
                                </span>
                            </div>
                            <Link
                                href="/checkout"
                                style={{
                                    background: 'var(--sb-primary)',
                                    color: 'var(--sb-primary-foreground)',
                                    borderRadius: 'var(--sb-radius)',
                                }}
                                className="mt-4 block w-full px-4 py-3 text-center font-semibold"
                            >
                                Checkout
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}
