import { Link, router, usePage } from '@inertiajs/react';
import { Mail, Phone, Search, ShoppingBag, User } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';
import StorefrontOwnerBar, {
    type ManageContext,
} from '@/components/storefront-owner-bar';
import { useT } from '@/lib/i18n';
import { fontStack, type ThemeTokens, themeToCssVars } from '@/lib/theme';

type NavLink = { label: string; href: string };

type HeaderCenter =
    | { type: 'search' }
    | { type: 'contact'; phone: string | null; email: string | null }
    | { type: 'text'; text: string }
    | null;

export type StorefrontShared = {
    storefront: {
        storeName: string;
        logoUrl: string | null;
        theme: ThemeTokens;
        cartCount: number;
        currencySymbol: string;
        customer: { name: string } | null;
        manage: ManageContext | null;
        locale: string;
        nav: {
            header: NavLink[];
            footer: NavLink[];
            footerNote: string | null;
            center: HeaderCenter;
        };
    };
};

function HeaderCenterSlot({ center }: { center: HeaderCenter }) {
    const { t } = useT();
    const [q, setQ] = useState('');

    if (!center) return null;

    if (center.type === 'search') {
        function submit(e: FormEvent) {
            e.preventDefault();
            router.get('/products', q.trim() ? { q: q.trim() } : {});
        }
        return (
            <form
                onSubmit={submit}
                className="relative hidden flex-1 justify-center px-6 md:flex"
            >
                <div className="relative w-full max-w-xs">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                    <input
                        type="search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder={t('Search products')}
                        aria-label={t('Search products')}
                        style={{
                            borderColor: 'var(--sb-border)',
                            borderRadius: 'var(--sb-radius)',
                        }}
                        className="w-full border bg-transparent py-1.5 pr-3 pl-8 text-sm outline-none focus:border-[color:var(--sb-primary)]"
                    />
                </div>
            </form>
        );
    }

    if (center.type === 'contact') {
        return (
            <div className="text-muted-foreground hidden flex-1 items-center justify-center gap-5 px-6 text-sm md:flex">
                {center.phone && (
                    <a
                        href={`tel:${center.phone.replace(/\s+/g, '')}`}
                        className="flex items-center gap-1.5 hover:text-[color:var(--sb-foreground)]"
                    >
                        <Phone className="size-4" />
                        {center.phone}
                    </a>
                )}
                {center.email && (
                    <a
                        href={`mailto:${center.email}`}
                        className="flex items-center gap-1.5 hover:text-[color:var(--sb-foreground)]"
                    >
                        <Mail className="size-4" />
                        {center.email}
                    </a>
                )}
            </div>
        );
    }

    return (
        <div className="text-muted-foreground hidden flex-1 justify-center px-6 text-center text-sm md:flex">
            {center.text}
        </div>
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
    const { theme, storeName, logoUrl, cartCount, customer, manage, nav } =
        storefront;
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
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={storeName}
                                className="max-h-10 w-auto object-contain"
                            />
                        ) : (
                            storeName
                        )}
                    </Link>
                    <HeaderCenterSlot center={nav.center} />
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
