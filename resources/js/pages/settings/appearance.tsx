import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { LogOut } from 'lucide-react';
import AppearanceTabs from '@/components/appearance-tabs';
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
import { edit as editAppearance } from '@/routes/appearance';
import { logout } from '@/routes';

export default function Appearance() {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        router.post(logout().url);
    };

    return (
        <>
            <Head title="Tampilan Tema - Honda Customer Rewards" />

            <h1 className="sr-only">Tampilan Tema</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Tampilan Tema"
                    description="Pilih mode tampilan tema sesuai kenyamanan Anda (Terang, Gelap, atau Sistem)"
                />
                <AppearanceTabs />

                <div className="pt-6 border-t border-zinc-200/80 dark:border-zinc-800 space-y-3">
                    <Heading
                        variant="small"
                        title="Sesi Akun"
                        description="Keluar dari sesi akun Anda di perangkat ini"
                    />

                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setShowLogoutConfirm(true)}
                        className="rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-sm"
                    >
                        <LogOut className="size-4 mr-2" />
                        Keluar dari Akun
                    </Button>
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
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Appearance settings',
            href: editAppearance(),
        },
    ],
};
