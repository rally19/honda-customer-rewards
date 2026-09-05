import { Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
    Bell,
    Check,
    Clock,
    Copy,
    Download,
    Gift,
    Home,
    QrCode as QrCodeIcon,
    Shield,
    Sparkles,
    User as UserIcon,
    X,
} from 'lucide-react';
import QrCode, { type QrCodeHandle } from '@/components/qr-code';
import ThemeToggle from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { home } from '@/routes';
import type { User } from '@/types';

type CustomerLayoutProps = {
    children: ReactNode;
    activeTab?: 'home' | 'history' | 'rewards' | 'profile';
};

export default function CustomerLayout({
    children,
    activeTab = 'home',
}: CustomerLayoutProps) {
    const { auth } = usePage<{ auth: { user: User } }>().props;
    const user = auth.user;

    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [copiedId, setCopiedId] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const qrCodeRef = useRef<QrCodeHandle>(null);

    // Allow components anywhere in the app to open the QR modal
    useEffect(() => {
        const handleOpenQr = () => setQrModalOpen(true);
        window.addEventListener('open-customer-qr-modal', handleOpenQr);
        return () => window.removeEventListener('open-customer-qr-modal', handleOpenQr);
    }, []);

    // Format 10 digit ID: 1234 5678 90
    const rawId = String(user?.id || '8492019482').padStart(10, '0');
    const formattedMemberId = rawId.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');

    const handleCopyId = () => {
        navigator.clipboard.writeText(rawId);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col antialiased selection:bg-red-600 selection:text-white pb-24 md:pb-28">
            {/* Ambient Background Accent */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-red-600/10 dark:bg-red-600/15 blur-[130px] rounded-full" />
            </div>

            {/* ========================================================================= */}
            {/* TOP BAR (HEADER DIGITAL BANKING STYLE)                                    */}
            {/* ========================================================================= */}
            <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/95 backdrop-blur-md transition-colors dark:border-zinc-800/80 dark:bg-zinc-950/90 shadow-xs">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
                    {/* Left: Brand & User Greeting */}
                    <div className="flex items-center gap-3">
                        <Link href={home()} className="flex items-center gap-2 group shrink-0" title="Ke Beranda">
                            <img
                                src="/images/logo/anper_logo_red.png"
                                alt="Honda Customer Rewards"
                                className="h-8 w-auto object-contain dark:hidden"
                            />
                            <img
                                src="/images/logo/anper_logo_white.png"
                                alt="Honda Customer Rewards"
                                className="hidden h-8 w-auto object-contain dark:block"
                            />
                        </Link>

                        <div className="hidden sm:block h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

                        {/* User Profile Pill */}
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white font-bold text-xs shadow-xs">
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="leading-tight">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[130px] sm:max-w-[180px]">
                                        Halo, {user?.name?.split(' ')[0]} 👋
                                    </span>
                                    <span className="hidden sm:inline-flex items-center gap-0.5 rounded-full bg-red-100 dark:bg-red-950/80 px-2 py-0.5 text-[10px] font-extrabold text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-900/60">
                                        <Shield className="size-2.5" />
                                        RED
                                    </span>
                                </div>
                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                                    ID: {formattedMemberId}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Quick Tools (Notifications & Theme Toggle) */}
                    <div className="flex items-center gap-2">
                        {/* Notification Button */}
                        <div className="relative">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setNotifOpen(!notifOpen)}
                                className="relative rounded-full text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                                aria-label="Notifikasi"
                            >
                                <Bell className="size-4.5" />
                                <span className="absolute top-2 right-2 size-2 rounded-full bg-red-600 ring-2 ring-white dark:ring-zinc-950 animate-pulse" />
                            </Button>

                            {/* Notification Dropdown Preview */}
                            {notifOpen && (
                                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 z-50">
                                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                                            Notifikasi
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => setNotifOpen(false)}
                                            className="text-zinc-400 hover:text-zinc-600"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    </div>
                                    <div className="mt-3 space-y-2.5 text-xs">
                                        <div className="rounded-xl bg-red-50/70 p-2.5 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50">
                                            <span className="font-semibold text-red-700 dark:text-red-400">
                                                🎉 Selamat Datang di Rewards!
                                            </span>
                                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                                                ID MEMBER Anda telah aktif. Tunjukkan ID saat servis di AHASS untuk kumpulkan poin.
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-zinc-50 p-2.5 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60">
                                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                                🔥 Promo Double Poin Pekan Ini
                                            </span>
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                Dapatkan 2x poin untuk servis tune up berkala di hari Senin & Rabu.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Dark / Light Mode Switcher */}
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* ========================================================================= */}
            {/* MAIN CONTENT CONTAINER                                                    */}
            {/* ========================================================================= */}
            <main className="relative z-10 flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 pt-5">
                {children}
            </main>

            {/* ========================================================================= */}
            {/* BOTTOM NAVIGATION BAR (MODERN FLOATING DOCK - E-WALLET STYLE)             */}
            {/* ========================================================================= */}
            <nav
                className="fixed bottom-3 inset-x-0 z-40 mx-auto w-[94%] max-w-md sm:max-w-lg md:max-w-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-zinc-950/15 dark:shadow-black/60 px-3 py-2 transition-all"
                aria-label="Navigasi Bawah"
            >
                <div className="flex items-center justify-around relative">
                    {/* Tab 1: Beranda */}
                    <Link
                        href="/dashboard"
                        className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
                            activeTab === 'home'
                                ? 'text-red-600 dark:text-red-500 font-bold'
                                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium'
                        }`}
                    >
                        <Home className="size-5" />
                        <span className="text-[10px]">Beranda</span>
                    </Link>

                    {/* Tab 2: Riwayat Poin */}
                    <Link
                        href="/history"
                        prefetch
                        className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
                            activeTab === 'history'
                                ? 'text-red-600 dark:text-red-500 font-bold'
                                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium'
                        }`}
                    >
                        <Clock className="size-5" />
                        <span className="text-[10px]">Riwayat</span>
                    </Link>

                    {/* Tab 3 (Tengah - Elevated / Floating Action Button): Scan QR ID MEMBER */}
                    <div className="-mt-7">
                        <button
                            type="button"
                            onClick={() => setQrModalOpen(true)}
                            className="group relative flex size-14 items-center justify-center rounded-full bg-gradient-to-tr from-red-600 via-red-500 to-rose-600 text-white shadow-xl shadow-red-600/40 ring-4 ring-white dark:ring-zinc-900 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                            aria-label="Tunjukkan QR ID Member"
                            title="Tunjukkan QR ID Member"
                        >
                            <QrCodeIcon className="size-6 transition-transform group-hover:rotate-6" />
                            <span className="sr-only">Scan ID</span>
                        </button>
                    </div>

                    {/* Tab 4: Reward / Katalog */}
                    <a
                        href="/dashboard#reward"
                        className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
                            activeTab === 'rewards'
                                ? 'text-red-600 dark:text-red-500 font-bold'
                                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium'
                        }`}
                    >
                        <Gift className="size-5" />
                        <span className="text-[10px]">Reward</span>
                    </a>

                    {/* Tab 5: Akun / Pengaturan */}
                    <Link
                        href="/settings/profile"
                        className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
                            activeTab === 'profile'
                                ? 'text-red-600 dark:text-red-500 font-bold'
                                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium'
                        }`}
                    >
                        <UserIcon className="size-5" />
                        <span className="text-[10px]">Akun</span>
                    </Link>
                </div>
            </nav>

            {/* ========================================================================= */}
            {/* MODAL QR ID MEMBER DIGITAL (POPUP SAAT SCAN ID DIKLIK)                    */}
            {/* ========================================================================= */}
            <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 overflow-hidden">
                    <DialogHeader className="text-center space-y-1 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 mb-1">
                            <QrCodeIcon className="size-5" />
                        </div>
                        <DialogTitle className="text-lg font-extrabold text-zinc-900 dark:text-white">
                            Kartu Digital ID MEMBER
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500">
                            Tunjukkan QR ini ke staf kasir AHASS atau dealer resmi saat transaksi
                        </DialogDescription>
                    </DialogHeader>

                    <div className="my-4 flex flex-col items-center text-center space-y-4">
                        {/* Member Identity Preview */}
                        <div className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-zinc-500">Nama Member</span>
                                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                                    {user?.name}
                                </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between border-t border-zinc-200/60 pt-2 dark:border-zinc-800">
                                <span className="text-xs font-semibold text-zinc-500">10-Digit ID MEMBER</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-sm font-black text-red-600 dark:text-red-500 tracking-wider">
                                        {formattedMemberId}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCopyId}
                                        className="text-zinc-400 hover:text-red-600 transition-colors p-1"
                                        title="Salin ID"
                                    >
                                        {copiedId ? (
                                            <Check className="size-3.5 text-emerald-500" />
                                        ) : (
                                            <Copy className="size-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Interactive QR Code Visual (qr-code-styling) */}
                        <div className="relative p-4 rounded-3xl bg-white border-2 border-red-500/25 shadow-xl shadow-red-500/10 flex flex-col items-center">
                            <QrCode
                                ref={qrCodeRef}
                                data={`HND-MEMBER-${rawId}`}
                                width={210}
                                height={210}
                                image="/images/logo/honda_logo_red.png"
                                dotsColor="#DC2626"
                                dotsType="rounded"
                                cornersSquareType="extra-rounded"
                                cornersDotType="dot"
                            />
                            <div className="mt-2 text-[10px] font-mono text-zinc-600 font-bold tracking-wider">
                                SCAN ID: HND-{rawId}
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                        <Button
                            type="button"
                            onClick={() => qrCodeRef.current?.download(`honda-member-${rawId}`, 'png')}
                            variant="outline"
                            className="flex-1 rounded-xl text-xs font-semibold border-zinc-300 dark:border-zinc-700 hover:border-red-500 hover:text-red-600 dark:hover:border-red-500 dark:hover:text-red-400"
                        >
                            <Download className="size-3.5 mr-1.5" />
                            Unduh QR (.PNG)
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCopyId}
                            variant="outline"
                            className="flex-1 rounded-xl text-xs font-semibold border-zinc-300 dark:border-zinc-700"
                        >
                            {copiedId ? (
                                <>
                                    <Check className="size-3.5 text-emerald-500 mr-1.5" />
                                    ID Disalin!
                                </>
                            ) : (
                                <>
                                    <Copy className="size-3.5 mr-1.5" />
                                    Salin ID
                                </>
                            )}
                        </Button>
                        <Button
                            type="button"
                            onClick={() => setQrModalOpen(false)}
                            className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4"
                        >
                            Tutup
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
