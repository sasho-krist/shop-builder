import { Link } from '@inertiajs/react';
import {
    CreditCard,
    FileText,
    FolderTree,
    LayoutGrid,
    Layers,
    Menu,
    Package,
    Palette,
    Settings,
    ShieldCheck,
    ShoppingCart,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import categories from '@/routes/categories';
import collections from '@/routes/collections';
import orders from '@/routes/orders';
import pages from '@/routes/pages';
import products from '@/routes/products';
import { show as billingShow } from '@/routes/billing';
import customers from '@/routes/customers';
import { edit as navigationEdit } from '@/routes/navigation';
import owners from '@/routes/owners';
import { edit as storeSettingsEdit } from '@/routes/store-settings';
import themes from '@/routes/themes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Products',
        href: products.index(),
        icon: Package,
    },
    {
        title: 'Categories',
        href: categories.index(),
        icon: FolderTree,
    },
    {
        title: 'Collections',
        href: collections.index(),
        icon: Layers,
    },
    {
        title: 'Orders',
        href: orders.index(),
        icon: ShoppingCart,
    },
    {
        title: 'Customers',
        href: customers.index(),
        icon: Users,
    },
    {
        title: 'Owners',
        href: owners.index(),
        icon: ShieldCheck,
    },
    {
        title: 'Themes',
        href: themes.index(),
        icon: Palette,
    },
    {
        title: 'Pages',
        href: pages.index(),
        icon: FileText,
    },
    {
        title: 'Navigation',
        href: navigationEdit(),
        icon: Menu,
    },
    {
        title: 'Settings',
        href: storeSettingsEdit(),
        icon: Settings,
    },
    {
        title: 'Billing',
        href: billingShow(),
        icon: CreditCard,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
