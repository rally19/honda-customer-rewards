import { router } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { logout } from '@/routes';

interface LogoutConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm?: () => void;
}

export function LogoutConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
}: LogoutConfirmDialogProps) {
    const handleLogout = () => {
        if (onConfirm) {
            onConfirm();
        } else {
            router.flushAll();
            router.post(logout().url);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-3xl border-zinc-200 bg-white p-6 sm:max-w-md dark:border-zinc-800 dark:bg-zinc-900">
                <DialogHeader className="space-y-2">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                        <LogOut className="size-6" />
                    </div>
                    <DialogTitle className="text-center text-lg font-bold text-zinc-900 dark:text-white">
                        Konfirmasi Keluar
                    </DialogTitle>
                    <DialogDescription className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                        Apakah Anda yakin ingin keluar dari akun Honda Customer
                        Rewards? Anda perlu memasukkan kredensial Anda kembali
                        untuk masuk.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 rounded-xl text-xs font-semibold"
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={handleLogout}
                        data-test="confirm-logout-button"
                        className="flex-1 rounded-xl bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700"
                    >
                        Ya, Keluar Sekarang
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
