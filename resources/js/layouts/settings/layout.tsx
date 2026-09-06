import { Link, router, usePage } from '@inertiajs/react';
import { useState, type PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import { logout } from '@/routes';
import type { NavItem, User as AuthUser } from '@/types';
import { User, Shield, Palette, LogOut, LayoutDashboard } from 'lucide-react';

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
    const role = typeof auth?.user?.role === 'string' ? auth?.user?.role : (auth?.user?.role as { value?: string } | undefined)?.value;
    const isAdmin = role === 'admin';
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        router.post(logout().url);
    };

    return (
        <div className="px-2 py-4 sm:px-4 sm:py-6">
            <Heading
                title="Pengaturan Akun"
                description="Kelola profil, keamanan, dan preferensi akun member Anda"
            />

            <div className="mt-6 flex flex-col lg:flex-row lg:space-x-10">
                <aside className="w-full max-w-xl lg:w-56">
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
                                className={cn('w-full justify-start rounded-xl font-semibold whitespace-nowrap cursor-pointer', {
                                    'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 font-bold': isCurrentOrParentUrl(item.href),
                                    'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white': !isCurrentOrParentUrl(item.href),
                                })}
                            >
                                <Link href={item.href}>
                                    {item.icon && (
                                        <item.icon className="h-4 w-4 mr-2" />
                                    )}
                                    {item.title}
                                </Link>
                            </Button>
                        ))}

                        <div className="my-1.5 sm:my-2 border-t border-zinc-200 dark:border-zinc-800" />

                        {/* Tombol Logout di bawah Tampilan Tema */}
                        <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            onClick={() => setShowLogoutConfirm(true)}
                            className="w-full justify-start rounded-xl font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50 cursor-pointer whitespace-nowrap"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Keluar dari Akun
                        </Button>

                        {/* Tombol ke Admin Dashboard jika role admin (di bawah tombol keluar akun) */}
                        {isAdmin && (
                            <Button
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn(
                                    'w-full justify-start rounded-xl font-semibold whitespace-nowrap cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white',
                                    {
                                        'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 font-bold': isCurrentOrParentUrl('/admin/dashboard'),
                                    }
                                )}
                            >
                                <Link href="/admin/dashboard">
                                    <LayoutDashboard className="h-4 w-4 mr-2" />
                                    Admin Dashboard
                                </Link>
                            </Button>
                        )}
                    </nav>
                </aside>

                <div className="flex-1 md:max-w-2xl mt-6">
                    <section className="max-w-xl space-y-8 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-5 sm:p-7 shadow-xs">
                        {children}
                    </section>
                </div>
            </div>

            {/* Modal Konfirmasi Logout */}
            <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
                <DialogContent className="sm:max-w-md rounded-3xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                    <DialogHeader className="space-y-2">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                            <LogOut className="size-6" />
                        </div>
                        <DialogTitle className="text-center text-lg font-bold text-zinc-900 dark:text-white">
                            Konfirmasi Keluar
                        </DialogTitle>
                        <DialogDescription className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                            Apakah Anda yakin ingin keluar dari akun Honda Customer Rewards? Anda perlu memasukkan kredensial Anda kembali untuk masuk.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowLogoutConfirm(false)}
                            className="flex-1 rounded-xl text-xs font-semibold"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleLogout}
                            className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                        >
                            Ya, Keluar Sekarang
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
