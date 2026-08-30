import { Link, usePage } from '@inertiajs/react';
import { ShoppingBag } from 'lucide-react';
import type { ReactNode } from 'react';
import { fontStack, type ThemeTokens, themeToCssVars } from '@/lib/theme';

export type StorefrontShared = {
    storefront: {
        storeName: string;
        theme: ThemeTokens;
        cartCount: number;
    };
};

export default function StorefrontLayout({
    children,
}: {
    children: ReactNode;
}) {
    const { storefront } = usePage<StorefrontShared>().props;
    const { theme, storeName, cartCount } = storefront;

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
                    className="mx-auto flex w-full items-center justify-between px-4 py-4"
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
                    className="mx-auto w-full px-4 py-8 text-sm"
                    style={{ maxWidth: 'var(--sb-container)' }}
                >
                    © {new Date().getFullYear()} {storeName}
                </div>
            </footer>
        </div>
    );
}
