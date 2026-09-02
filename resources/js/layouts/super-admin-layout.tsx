import { Head, Link, router, usePage } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';

const NAV = [
    { key: 'stores', href: '/super-admin/stores', label: 'Stores' },
    { key: 'owners', href: '/super-admin/owners', label: 'Owners' },
    {
        key: 'subscriptions',
        href: '/super-admin/subscriptions',
        label: 'Subscriptions',
    },
    { key: 'settings', href: '/super-admin/settings', label: 'Settings' },
] as const;

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { t } = useT();
    const { url } = usePage();

    return (
        <div className="bg-background text-foreground min-h-screen">
            <Head>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <header className="border-border bg-card border-b">
                <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
                    <div className="flex items-center gap-2 font-semibold">
                        <AppLogoIcon className="h-6 w-auto" />
                        <span>{t('Operator')}</span>
                    </div>

                    <nav className="flex items-center gap-1">
                        {NAV.map((item) => {
                            const active = url.startsWith(item.href);
                            return (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                        active
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {t(item.label)}
                                </Link>
                            );
                        })}
                    </nav>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto"
                        onClick={() => router.post('/super-admin/logout')}
                    >
                        <LogOut className="size-4" />
                        {t('Sign out')}
                    </Button>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </div>
    );
}
