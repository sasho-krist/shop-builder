import { Link, usePage } from '@inertiajs/react';
import { ShoppingBag, User } from 'lucide-react';
import type { ReactNode } from 'react';
import StorefrontOwnerBar, {
    type ManageContext,
} from '@/components/storefront-owner-bar';
import { fontStack, type ThemeTokens, themeToCssVars } from '@/lib/theme';

export type StorefrontShared = {
    storefront: {
        storeName: string;
        theme: ThemeTokens;
        cartCount: number;
        currencySymbol: string;
        categories: { name: string; slug: string }[];
        customer: { name: string } | null;
        manage: ManageContext | null;
    };
};

export default function StorefrontLayout({
    children,
    ownerEdit,
}: {
    children: ReactNode;
    ownerEdit?: { href: string; label: string };
}) {
    const { storefront } = usePage<StorefrontShared>().props;
    const { theme, storeName, cartCount, categories, customer, manage } =
        storefront;

    return (
        <div
            style={{
                ...themeToCssVars(theme),
                background: 'var(--sb-background)',
                color: 'var(--sb-foreground)',
                fontFamily: 'var(--sb-body-font)',
                fontSize: 'var(--sb-base-size)',
            }}
            className="flex min-h-dvh flex-col"
        >
            <header
                style={{ borderColor: 'var(--sb-border)' }}
                className="border-b"
            >
                <div
                    className="mx-auto flex w-full items-center justify-between px-5 py-4 sm:px-8"
                    style={{ maxWidth: 'var(--sb-container)' }}
                >
                    <Link
                        href="/"
                        style={{
                            fontFamily: fontStack(theme.typography.headingFont),
                        }}
                        className="text-lg font-bold"
                    >
                        {storeName}
                    </Link>
                    <nav className="flex items-center gap-5 text-sm">
                        <Link href="/products">Shop</Link>
                        {categories.map((category) => (
                            <Link
                                key={category.slug}
                                href={`/c/${category.slug}`}
                                className="hidden sm:inline"
                            >
                                {category.name}
                            </Link>
                        ))}
                        {manage ? (
                            <a
                                href={manage.dashboard}
                                className="flex items-center gap-1.5"
                                title={`Signed in as ${manage.name} (store owner)`}
                            >
                                <User className="size-4" />
                                <span className="hidden items-center gap-1.5 sm:flex">
                                    {manage.name}
                                    <span
                                        style={{
                                            background: 'var(--sb-primary)',
                                            color: 'var(--sb-primary-foreground)',
                                        }}
                                        className="rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold tracking-wide uppercase"
                                    >
                                        Owner
                                    </span>
                                </span>
                            </a>
                        ) : (
                            <Link
                                href={customer ? '/account' : '/account/login'}
                                className="flex items-center gap-1.5"
                                title={customer ? customer.name : 'Sign in'}
                            >
                                <User className="size-4" />
                                <span className="hidden sm:inline">
                                    {customer ? customer.name : 'Sign in'}
                                </span>
                            </Link>
                        )}
                        <Link
                            href="/cart"
                            className="flex items-center gap-1.5"
                        >
                            <ShoppingBag className="size-4" />
                            {cartCount > 0 && (
                                <span
                                    style={{
                                        background: 'var(--sb-primary)',
                                        color: 'var(--sb-primary-foreground)',
                                    }}
                                    className="rounded-full px-1.5 py-0.5 text-xs leading-none"
                                >
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1">{children}</main>

            <footer
                style={{
                    borderColor: 'var(--sb-border)',
                    color: 'var(--sb-muted-foreground)',
                }}
                className="border-t"
            >
                <div
                    className="mx-auto w-full px-5 py-8 text-sm sm:px-8"
                    style={{ maxWidth: 'var(--sb-container)' }}
                >
                    © {new Date().getFullYear()} {storeName}
                </div>
            </footer>

            {manage && (
                <>
                    <div aria-hidden className="h-16" />
                    <StorefrontOwnerBar
                        manage={manage}
                        editHref={ownerEdit?.href ?? manage.homePage}
                        editLabel={ownerEdit?.label ?? 'Edit home'}
                    />
                </>
            )}
        </div>
    );
}
