import { Link, usePage } from '@inertiajs/react';
import { Award, Gift, LayoutDashboard, QrCode, Shield, Smartphone, Users, Wrench } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
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
import type { NavItem, User } from '@/types';

export function AppSidebar() {
    const { auth } = usePage<{ auth?: { user: User } }>().props;
    const isAdmin = auth?.user?.role === 'admin';

    const mainNavItems: NavItem[] = [
        ...(isAdmin
            ? [
                  {
                      title: 'Admin Dashboard',
                      href: '/admin/dashboard',
                      icon: LayoutDashboard,
                  },
                  {
                      title: 'Scan / Input Poin',
                      href: '/admin/scan',
                      icon: QrCode,
                  },
                  {
                      title: 'Manajemen Aktivitas',
                      href: '/admin/activities',
                      icon: Award,
                  },
                  {
                      title: 'Manajemen Reward',
                      href: '/admin/rewards',
                      icon: Gift,
                  },
                  {
                      title: 'Manajemen User',
                      href: '/admin/users',
                      icon: Users,
                  },
              ]
            : []),
        {
            title: 'Member E-Wallet',
            href: dashboard(),
            icon: Smartphone,
        },
    ];

    const footerNavItems: NavItem[] = [
        {
            title: 'Jaringan AHASS',
            href: '#',
            icon: Wrench,
        },
        {
            title: 'Honda Care 1-500-989',
            href: '#',
            icon: Shield,
        },
    ];

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
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
