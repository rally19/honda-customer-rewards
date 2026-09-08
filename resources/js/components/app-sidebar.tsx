import { Link, usePage } from '@inertiajs/react';
import {
    Award,
    Gift,
    LayoutDashboard,
    QrCode,
    Shield,
    Smartphone,
    UserCheck,
    Users,
    Wrench,
} from 'lucide-react';
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
import type { NavGroup, NavItem, User } from '@/types';

export function AppSidebar() {
    const { auth } = usePage<{ auth?: { user: User } }>().props;
    const isAdmin = auth?.user?.role === 'admin';

    const navGroups: NavGroup[] = isAdmin
        ? [
              {
                  label: 'Dashboard',
                  items: [
                      {
                          title: 'Admin Dashboard',
                          href: '/admin/dashboard',
                          icon: LayoutDashboard,
                      },
                  ],
              },
              {
                  label: 'Scan / Input',
                  items: [
                      {
                          title: 'Scan / Input Poin',
                          href: '/admin/scan',
                          icon: QrCode,
                      },
                      {
                          title: 'Scan / Input User',
                          href: '/admin/scan-user',
                          icon: UserCheck,
                      },
                  ],
              },
              {
                  label: 'Manajemen',
                  items: [
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
                  ],
              },
          ]
        : [
              {
                  items: [
                      {
                          title: 'User Dashboard',
                          href: dashboard(),
                          icon: Smartphone,
                      },
                  ],
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
        <Sidebar collapsible="icon" variant="sidebar">
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
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
