import { Link, usePage } from '@inertiajs/react';
import { useState, type PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { LogoutConfirmDialog } from '@/components/logout-confirm-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem, User as AuthUser } from '@/types';
import {
    User,
    Shield,
    Palette,
    LogOut,
    LayoutDashboard,
    Download,
} from 'lucide-react';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profil Member',
        href: edit(),
        icon: User,
    },
    {
        title: 'Keamanan Akun',
        href: editSecurity(),
        icon: Shield,
    },
    {
        title: 'Tampilan Tema',
        href: editAppearance(),
        icon: Palette,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<{ auth?: { user?: AuthUser } }>().props;
    const role =
        typeof auth?.user?.role === 'string'
            ? auth?.user?.role
            : (auth?.user?.role as { value?: string } | undefined)?.value;
    const isAdmin = role === 'admin';
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    return (
        <div className="px-2 py-4 sm:px-4 sm:py-6">
            <Heading
                title="Pengaturan Akun"
                description="Kelola profil, keamanan, dan preferensi akun member Anda"
            />

            <div className="mt-6 flex flex-col lg:flex-row lg:space-x-10">
                <aside className="settings-sidebar-nav relative z-[60] w-full max-w-xl rounded-2xl border border-zinc-200/80 bg-white/95 p-3 shadow-xs backdrop-blur-md sm:p-3.5 lg:w-60 lg:border-zinc-200/80 lg:bg-white/90 lg:p-3.5 lg:shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/95 lg:dark:bg-zinc-900/90">
                    <nav
                        className="flex flex-col gap-1.5"
                        aria-label="Pengaturan"
                    >
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                key={`${toUrl(item.href)}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn(
                                    'w-full cursor-pointer justify-start rounded-xl font-semibold whitespace-nowrap',
                                    {
                                        'bg-red-50 font-bold text-red-700 dark:bg-red-950/60 dark:text-red-400':
                                            isCurrentOrParentUrl(item.href),
                                        'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white':
                                            !isCurrentOrParentUrl(item.href),
                                    },
                                )}
                            >
                                <Link href={item.href}>
                                    {item.icon && (
                                        <item.icon className="mr-2 h-4 w-4" />
                                    )}
                                    {item.title}
                                </Link>
                            </Button>
                        ))}

                        <div className="my-1.5 border-t border-zinc-200 sm:my-2 dark:border-zinc-800" />

                        {/* Tombol Logout */}
                        <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            onClick={() => setShowLogoutConfirm(true)}
                            className="w-full cursor-pointer justify-start rounded-xl font-semibold whitespace-nowrap text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/50"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Keluar dari Akun
                        </Button>

                        {/* Tombol Install PWA */}
                        <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            onClick={() =>
                                window.dispatchEvent(
                                    new CustomEvent('pwa-install-requested'),
                                )
                            }
                            className="w-full cursor-pointer justify-start rounded-xl font-semibold whitespace-nowrap text-zinc-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
                        >
                            <Download className="mr-2 h-4 w-4 text-red-500" />
                            Pasang Aplikasi (PWA)
                        </Button>

                        {/* Tombol ke Admin Dashboard jika role admin (di bawah tombol keluar akun) */}
                        {isAdmin && (
                            <Button
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn(
                                    'w-full cursor-pointer justify-start rounded-xl font-semibold whitespace-nowrap text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
                                    {
                                        'bg-red-50 font-bold text-red-700 dark:bg-red-950/60 dark:text-red-400':
                                            isCurrentOrParentUrl(
                                                '/admin/dashboard',
                                            ),
                                    },
                                )}
                            >
                                <Link href="/admin/dashboard">
                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                    Admin Dashboard
                                </Link>
                            </Button>
                        )}
                    </nav>
                </aside>

                <div className="mt-6 flex-1 md:max-w-2xl">
                    <section
                        key={usePage().url.split('?')[0]}
                        className="animate-smooth-in max-w-xl space-y-8 rounded-2xl border border-zinc-200/90 bg-white/90 p-5 shadow-xs sm:p-7 dark:border-zinc-800 dark:bg-zinc-900/90"
                    >
                        {children}
                    </section>
                </div>
            </div>

            {/* Modal Konfirmasi Logout */}
            <LogoutConfirmDialog
                open={showLogoutConfirm}
                onOpenChange={setShowLogoutConfirm}
            />
        </div>
    );
}
