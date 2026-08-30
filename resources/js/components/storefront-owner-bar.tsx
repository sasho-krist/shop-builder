import { router } from '@inertiajs/react';
import {
    LayoutDashboard,
    LogOut,
    Package,
    Palette,
    Plus,
    ShoppingCart,
    SquarePen,
    X,
} from 'lucide-react';
import { useOwnerToolsHidden } from '@/hooks/use-owner-tools';
import { useT } from '@/lib/i18n';

export type ManageContext = {
    name: string;
    dashboard: string;
    products: string;
    newProduct: string;
    orders: string;
    theme: string | null;
    homePage: string | null;
};

export default function StorefrontOwnerBar({
    manage,
    editHref,
    editLabel,
}: {
    manage: ManageContext;
    editHref?: string | null;
    editLabel?: string;
}) {
    const [hidden, setHidden] = useOwnerToolsHidden();
    const { t } = useT();

    function signOut() {
        router.post('/admin/logout');
    }

    if (hidden) {
        return (
            <button
                type="button"
                onClick={() => setHidden(false)}
                className="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-2 text-xs font-medium text-white shadow-lg ring-1 ring-white/10"
            >
                <SquarePen className="size-3.5" />
                {t('Editing tools')}
            </button>
        );
    }

    const link =
        'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-white/90 transition-colors hover:bg-white/10 hover:text-white';

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3">
            <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-neutral-900/95 p-1.5 text-xs font-medium shadow-2xl ring-1 ring-white/10 backdrop-blur">
                <span className="hidden shrink-0 items-center gap-1.5 px-2 text-white/70 sm:flex">
                    <span className="size-2 rounded-full bg-emerald-400" />
                    {manage.name}
                </span>

                {editHref && (
                    <a href={editHref} className={link}>
                        <SquarePen className="size-3.5" />
                        {editLabel ?? t('Edit page')}
                    </a>
                )}
                {manage.theme && (
                    <a href={manage.theme} className={link}>
                        <Palette className="size-3.5" />
                        {t('Theme')}
                    </a>
                )}
                <a href={manage.newProduct} className={link}>
                    <Plus className="size-3.5" />
                    {t('Product')}
                </a>
                <a href={manage.products} className={link}>
                    <Package className="size-3.5" />
                    {t('Catalog')}
                </a>
                <a href={manage.orders} className={link}>
                    <ShoppingCart className="size-3.5" />
                    {t('Orders')}
                </a>
                <a href={manage.dashboard} className={link}>
                    <LayoutDashboard className="size-3.5" />
                    {t('Admin')}
                </a>

                <span className="mx-0.5 h-4 w-px bg-white/15" />

                <button
                    type="button"
                    onClick={() => setHidden(true)}
                    className={link}
                    title={t('Preview as a shopper')}
                >
                    <X className="size-3.5" />
                    <span className="hidden sm:inline">{t('Preview')}</span>
                </button>
                <button
                    type="button"
                    onClick={signOut}
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    title={t('Sign out of the owner session')}
                >
                    <LogOut className="size-3.5" />
                    <span className="hidden sm:inline">{t('Sign out')}</span>
                </button>
            </div>
        </div>
    );
}
