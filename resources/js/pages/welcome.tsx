import { Head, Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid,
    type LucideIcon,
    Palette,
    ShoppingBag,
    Store,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { useT } from '@/lib/i18n';
import { dashboard, login, register } from '@/routes';

type Feature = { icon: LucideIcon; title: string; body: string };

export default function Welcome() {
    const { auth, name } = usePage().props;
    const { t } = useT();

    const features: Feature[] = [
        {
            icon: LayoutGrid,
            title: t('Visual page builder'),
            body: t(
                'About 40 Elementor-style sections — grouped, drag-and-drop, plus a Columns container. The same blocks render in the editor and on the live store.',
            ),
        },
        {
            icon: Palette,
            title: t('Themes with live preview'),
            body: t(
                'Colours, fonts, spacing and corner radius as design tokens, with a mini-storefront that updates as you edit.',
            ),
        },
        {
            icon: ShoppingBag,
            title: t('Storefront & checkout'),
            body: t(
                'Cart, cash on delivery or card payments via Stripe, customer accounts, order emails — all built in.',
            ),
        },
        {
            icon: Store,
            title: t('A store of your own'),
            body: t(
                'Every shop runs on its own subdomain (or a custom domain you connect), with its data kept fully separate.',
            ),
        },
    ];

    return (
        <div className="bg-background text-foreground min-h-screen">
            <Head title={t('Build your online store, no code')} />

            <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
                <span className="flex items-center gap-2 font-semibold">
                    <AppLogoIcon className="h-8 w-auto" />
                    {name}
                </span>

                <nav className="flex items-center gap-2 text-sm">
                    {auth.user ? (
                        <Link
                            href={dashboard()}
                            className="border-border hover:bg-accent rounded-md border px-4 py-1.5"
                        >
                            {t('Dashboard')}
                        </Link>
                    ) : (
                        <>
                            <Link
                                href={login()}
                                className="hover:bg-accent rounded-md px-4 py-1.5"
                            >
                                {t('Log in')}
                            </Link>
                            <Link
                                href={register()}
                                className="bg-primary text-primary-foreground rounded-md px-4 py-1.5 font-medium hover:opacity-90"
                            >
                                {t('Register')}
                            </Link>
                        </>
                    )}
                </nav>
            </header>

            <main className="mx-auto w-full max-w-5xl px-6">
                <section className="py-16 sm:py-24">
                    <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                        {t('Online store builder')}
                    </p>
                    <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
                        {t('Your online store, built without code.')}
                    </h1>
                    <p className="text-muted-foreground mt-5 max-w-xl text-lg">
                        {t(
                            'Sign up and get a ready store on your own subdomain. Add products, design the pages, pick a theme and take orders — everything from one visual admin panel.',
                        )}
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link
                            href={auth.user ? dashboard() : register()}
                            className="bg-primary text-primary-foreground rounded-md px-5 py-2.5 font-medium hover:opacity-90"
                        >
                            {auth.user
                                ? t('Go to dashboard')
                                : t('Create your store')}
                        </Link>
                        {!auth.user && (
                            <Link
                                href={login()}
                                className="border-border hover:bg-accent rounded-md border px-5 py-2.5"
                            >
                                {t('I already have an account')}
                            </Link>
                        )}
                    </div>
                </section>

                <section className="grid gap-px overflow-hidden rounded-xl border sm:grid-cols-2">
                    {features.map(({ icon: Icon, title, body }) => (
                        <div key={title} className="bg-card p-6">
                            <Icon className="text-primary size-6" />
                            <h2 className="mt-3 font-semibold">{title}</h2>
                            <p className="text-muted-foreground mt-1.5 text-sm">
                                {body}
                            </p>
                        </div>
                    ))}
                </section>

                <section className="py-16 text-center">
                    <h2 className="text-2xl font-semibold">
                        {t('Ready in a few minutes')}
                    </h2>
                    <p className="text-muted-foreground mx-auto mt-2 max-w-md">
                        {t(
                            'Free to start. Add card payments and lift the limits whenever you are ready.',
                        )}
                    </p>
                    {!auth.user && (
                        <Link
                            href={register()}
                            className="bg-primary text-primary-foreground mt-6 inline-block rounded-md px-5 py-2.5 font-medium hover:opacity-90"
                        >
                            {t('Create your store')}
                        </Link>
                    )}
                </section>
            </main>

            <footer className="border-border mx-auto w-full max-w-5xl border-t px-6 py-8">
                <p className="text-muted-foreground text-sm">
                    {name} —{' '}
                    {t('admin and storefront in Bulgarian and English')}
                </p>
            </footer>
        </div>
    );
}
