import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavGroup, NavItem } from '@/types';

type NavMainProps = {
    items?: NavItem[];
    groups?: NavGroup[];
};

export function NavMain({ items, groups }: NavMainProps) {
    const { isCurrentUrl } = useCurrentUrl();
    const navGroups: NavGroup[] = groups ?? (items ? [{ items }] : []);

    return (
        <>
            {navGroups.map((group, idx) => (
                <SidebarGroup key={group.label ?? idx} className="px-2 py-0">
                    {group.label && (
                        <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                    )}
                    <SidebarMenu>
                        {group.items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl(item.href)}
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}
