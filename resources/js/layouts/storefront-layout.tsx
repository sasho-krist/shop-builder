import { Link, usePage } from '@inertiajs/react';
import { Globe, ShoppingBag, User } from 'lucide-react';
import type { ReactNode } from 'react';
import StorefrontOwnerBar, {
    type ManageContext,
} from '@/components/storefront-owner-bar';
import { useT } from '@/lib/i18n';
import { fontStack, type ThemeTokens, themeToCssVars } from '@/lib/theme';

type NavLink = { label: string; href: string };

export type StorefrontShared = {
    storefront: {
        storeName: string;
        theme: ThemeTokens;
        cartCount: number;
        currencySymbol: string;
        categories: { name: string; slug: string }[];
        customer: { name: string } | null;
        manage: ManageContext | null;
        locale: string;
        i18n: Record<string, string>;
        nav: {
            header: NavLink[];
            footer: NavLink[];
            footerNote: string | null;
            showCategoryNav: boolean;
        };
    };
};

function LanguageSwitcher({ locale }: { locale: string }) {
    const other = locale === 'bg' ? 'en' : 'bg';
    return (
        <a
            href={`/locale/${other}`}
            className="flex items-center gap-1"
            title={other === 'bg' ? 'Български' : 'English'}
        >
            <Globe className="size-4" />
            <span className="uppercase">{other}</span>
        </a>
    );
}

function NavAnchor({ link, className }: { link: NavLink; className?: string }) {
    if (link.href.startsWith('/')) {
        return (
            <Link href={link.href} className={className}>
                {link.label}
            </Link>
        );
    }
    return (
        <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
        >
            {link.label}
        </a>
    );
}

export default function StorefrontLayout({
    children,
    ownerEdit,
}: {
    children: ReactNode;
    ownerEdit?: { href: string; label: string };
}) {
    const { storefront } = usePage<StorefrontShared>().props;
    const {
        theme,
        storeName,
        cartCount,
        categories,
        customer,
        manage,
        nav,
        locale,
    } = storefront;
    const { t } = useT();
    const year = new Date().getFullYear();

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
                        {nav.header.length > 0 ? (
                            nav.header.map((link, i) => (
                                <NavAnchor
                                    key={`${link.href}-${i}`}
                                    link={link}
                                    className="hidden sm:inline"
                                />
                            ))
                        ) : (
                            <Link href="/products">{t('Shop')}</Link>
                        )}
                        {nav.showCategoryNav &&
                            categories.map((category) => (
                                <Link
                                    key={category.slug}
                                    href={`/c/${category.slug}`}
                                    className="hidden sm:inline"
                                >
                                    {category.name}
                                </Link>
                            ))}
                        <LanguageSwitcher locale={locale} />
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
                                        {t('Owner')}
                                    </span>
                                </span>
                            </a>
                        ) : (
                            <Link
                                href={customer ? '/account' : '/account/login'}
                                className="flex items-center gap-1.5"
                                title={customer ? customer.name : t('Sign in')}
                            >
                                <User className="size-4" />
                                <span className="hidden sm:inline">
                                    {customer ? customer.name : t('Sign in')}
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
                    className="mx-auto flex w-full flex-col gap-4 px-5 py-10 text-sm sm:px-8"
                    style={{ maxWidth: 'var(--sb-container)' }}
                >
                    {nav.footerNote && (
                        <p className="max-w-md whitespace-pre-line">
                            {nav.footerNote}
                        </p>
                    )}
                    {nav.footer.length > 0 && (
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                            {nav.footer.map((link, i) => (
                                <NavAnchor
                                    key={`${link.href}-${i}`}
                                    link={link}
                                    className="hover:text-[color:var(--sb-foreground)]"
                                />
                            ))}
                        </div>
                    )}
                    <div
                        style={{ borderColor: 'var(--sb-border)' }}
                        className={
                            nav.footerNote || nav.footer.length > 0
                                ? 'border-t pt-4'
                                : undefined
                        }
                    >
                        © {year} {storeName}
                    </div>
                </div>
            </footer>

            {manage && (
                <>
                    <div aria-hidden className="h-16" />
                    <StorefrontOwnerBar
                        manage={manage}
                        editHref={ownerEdit?.href ?? manage.homePage}
                        editLabel={ownerEdit?.label ?? t('Edit home')}
                    />
                </>
            )}
        </div>
    );
}
