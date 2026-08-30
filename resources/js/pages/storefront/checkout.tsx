import { Head, useForm } from '@inertiajs/react';
import StorefrontLayout from '@/layouts/storefront-layout';
import { money } from '@/lib/money';

type CartItem = {
    id: number;
    quantity: number;
    subtotal: string;
    variant_name: string;
    product_title: string;
};

type Props = {
    cart: {
        items: CartItem[];
        subtotal: string;
        count: number;
        currency_symbol: string;
        totals: {
            subtotal: string;
            shipping: string;
            tax: string;
            total: string;
        };
    };
    customer: { name: string; email: string } | null;
};

const inputClass = 'w-full rounded-md border px-3 py-2 text-sm outline-none';

export default function StorefrontCheckout({ cart, customer }: Props) {
    const form = useForm({
        email: customer?.email ?? '',
        customer_name: customer?.name ?? '',
        phone: '',
        address: {
            line1: '',
            line2: '',
            city: '',
            postal_code: '',
            country: 'Bulgaria',
        },
        notes: '',
    });

    const errors = form.errors as Record<string, string>;

    function setAddress(key: string, value: string) {
        form.setData('address', { ...form.data.address, [key]: value });
    }

    function submit(event: React.FormEvent) {
        event.preventDefault();
        form.post('/checkout');
    }

    return (
        <StorefrontLayout>
            <Head title="Checkout" />

            <form
                onSubmit={submit}
                className="mx-auto grid w-full gap-10 px-4 py-10 md:grid-cols-[1fr_320px]"
                style={{ maxWidth: 'var(--sb-container)' }}
            >
                <div className="flex flex-col gap-6">
                    <h1
                        style={{ fontFamily: 'var(--sb-heading-font)' }}
                        className="text-3xl font-bold"
                    >
                        Checkout
                    </h1>

                    <section className="flex flex-col gap-3">
                        <h2 className="font-semibold">Contact</h2>
                        <div>
                            <input
                                type="email"
                                placeholder="Email"
                                value={form.data.email}
                                style={{ borderColor: 'var(--sb-border)' }}
                                className={inputClass}
                                onChange={(e) =>
                                    form.setData('email', e.target.value)
                                }
                            />
                            {errors.email && (
                                <p className="text-destructive mt-1 text-xs">
                                    {errors.email}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <input
                                placeholder="Full name"
                                value={form.data.customer_name}
                                style={{ borderColor: 'var(--sb-border)' }}
                                className={inputClass}
                                onChange={(e) =>
                                    form.setData(
                                        'customer_name',
                                        e.target.value,
                                    )
                                }
                            />
                            <input
                                placeholder="Phone (optional)"
                                value={form.data.phone}
                                style={{ borderColor: 'var(--sb-border)' }}
                                className={inputClass}
                                onChange={(e) =>
                                    form.setData('phone', e.target.value)
                                }
                            />
                        </div>
                        {errors.customer_name && (
                            <p className="text-destructive text-xs">
                                {errors.customer_name}
                            </p>
                        )}
                    </section>

                    <section className="flex flex-col gap-3">
                        <h2 className="font-semibold">Shipping address</h2>
                        <input
                            placeholder="Address line 1"
                            value={form.data.address.line1}
                            style={{ borderColor: 'var(--sb-border)' }}
                            className={inputClass}
                            onChange={(e) =>
                                setAddress('line1', e.target.value)
                            }
                        />
                        {errors['address.line1'] && (
                            <p className="text-destructive text-xs">
                                {errors['address.line1']}
                            </p>
                        )}
                        <input
                            placeholder="Address line 2 (optional)"
                            value={form.data.address.line2}
                            style={{ borderColor: 'var(--sb-border)' }}
                            className={inputClass}
                            onChange={(e) =>
                                setAddress('line2', e.target.value)
                            }
                        />
                        <div className="grid gap-3 sm:grid-cols-3">
                            <input
                                placeholder="City"
                                value={form.data.address.city}
                                style={{ borderColor: 'var(--sb-border)' }}
                                className={inputClass}
                                onChange={(e) =>
                                    setAddress('city', e.target.value)
                                }
                            />
                            <input
                                placeholder="Postal code"
                                value={form.data.address.postal_code}
                                style={{ borderColor: 'var(--sb-border)' }}
                                className={inputClass}
                                onChange={(e) =>
                                    setAddress('postal_code', e.target.value)
                                }
                            />
                            <input
                                placeholder="Country"
                                value={form.data.address.country}
                                style={{ borderColor: 'var(--sb-border)' }}
                                className={inputClass}
                                onChange={(e) =>
                                    setAddress('country', e.target.value)
                                }
                            />
                        </div>
                        {(errors['address.city'] ||
                            errors['address.postal_code'] ||
                            errors['address.country']) && (
                            <p className="text-destructive text-xs">
                                Please complete the address.
                            </p>
                        )}
                    </section>

                    <section className="flex flex-col gap-3">
                        <h2 className="font-semibold">Order notes</h2>
                        <textarea
                            rows={3}
                            placeholder="Anything we should know? (optional)"
                            value={form.data.notes}
                            style={{ borderColor: 'var(--sb-border)' }}
                            className={inputClass}
                            onChange={(e) =>
                                form.setData('notes', e.target.value)
                            }
                        />
                    </section>
                </div>

                <aside
                    style={{
                        borderColor: 'var(--sb-border)',
                        borderRadius: 'var(--sb-radius)',
                    }}
                    className="h-fit border p-5"
                >
                    <h2 className="mb-3 font-semibold">Your order</h2>
                    <ul className="flex flex-col gap-2 text-sm">
                        {cart.items.map((item) => (
                            <li
                                key={item.id}
                                className="flex justify-between gap-2"
                            >
                                <span>
                                    {item.product_title}{' '}
                                    <span
                                        style={{
                                            color: 'var(--sb-muted-foreground)',
                                        }}
                                    >
                                        × {item.quantity}
                                    </span>
                                </span>
                                <span>
                                    {money(item.subtotal, cart.currency_symbol)}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <div
                        style={{ borderColor: 'var(--sb-border)' }}
                        className="mt-3 flex flex-col gap-1 border-t pt-3 text-sm"
                    >
                        <div className="flex justify-between">
                            <span
                                style={{ color: 'var(--sb-muted-foreground)' }}
                            >
                                Subtotal
                            </span>
                            <span>
                                {money(
                                    cart.totals.subtotal,
                                    cart.currency_symbol,
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span
                                style={{ color: 'var(--sb-muted-foreground)' }}
                            >
                                Shipping
                            </span>
                            <span>
                                {cart.totals.shipping === '0.00'
                                    ? 'Free'
                                    : money(
                                          cart.totals.shipping,
                                          cart.currency_symbol,
                                      )}
                            </span>
                        </div>
                        {cart.totals.tax !== '0.00' && (
                            <div className="flex justify-between">
                                <span
                                    style={{
                                        color: 'var(--sb-muted-foreground)',
                                    }}
                                >
                                    Tax
                                </span>
                                <span>
                                    {money(
                                        cart.totals.tax,
                                        cart.currency_symbol,
                                    )}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="mt-2 flex justify-between font-semibold">
                        <span>Total</span>
                        <span>
                            {money(cart.totals.total, cart.currency_symbol)}
                        </span>
                    </div>

                    <p
                        style={{ color: 'var(--sb-muted-foreground)' }}
                        className="mt-4 text-xs"
                    >
                        Payment on delivery. Card payments coming soon.
                    </p>

                    <button
                        type="submit"
                        disabled={form.processing}
                        style={{
                            background: 'var(--sb-primary)',
                            color: 'var(--sb-primary-foreground)',
                            borderRadius: 'var(--sb-radius)',
                        }}
                        className="mt-3 w-full px-4 py-3 font-semibold disabled:opacity-50"
                    >
                        Place order
                    </button>
                </aside>
            </form>
        </StorefrontLayout>
    );
}
