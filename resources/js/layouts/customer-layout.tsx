import { Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
    ArrowRight,
    Award,
    Bell,
    Check,
    Clock,
    Coins,
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
import type { NotificationItem, User } from '@/types';

type CustomerLayoutProps = {
    children: ReactNode;
    activeTab?: 'home' | 'history' | 'rewards' | 'profile';
};

export default function CustomerLayout({
    children,
    activeTab = 'home',
}: CustomerLayoutProps) {
    const { auth, notifications = [] } = usePage<{
        auth: { user: User };
        notifications?: NotificationItem[];
    }>().props;
    const user = auth.user;

    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [copiedId, setCopiedId] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const qrCodeRef = useRef<QrCodeHandle>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    // Track read notifications locally
    const [readIds, setReadIds] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('honda_read_notifs');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

    const handleToggleNotif = () => {
        const nextState = !notifOpen;
        setNotifOpen(nextState);
        if (nextState && notifications.length > 0) {
            const allIds = notifications.map((n) => n.id);
            const updated = Array.from(new Set([...readIds, ...allIds]));
            setReadIds(updated);
            try {
                localStorage.setItem('honda_read_notifs', JSON.stringify(updated));
            } catch {
                // ignore
            }
        }
    };

    // Close notification dropdown when clicking outside
    useEffect(() => {
        if (!notifOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [notifOpen]);

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

    // Resolve Member Tier & Visual Badges according to current loyalty tier system
    const getTierInfo = () => {
        let tierName = 'Bronze';

        if (typeof user?.lifetime_points === 'number') {
            if (user.lifetime_points >= 7000) tierName = 'Diamond';
            else if (user.lifetime_points >= 3500) tierName = 'Platinum';
            else if (user.lifetime_points >= 1500) tierName = 'Gold';
            else if (user.lifetime_points >= 500) tierName = 'Silver';
            else tierName = 'Bronze';
        } else if (user?.tier) {
            const raw = typeof user.tier === 'string'
                ? user.tier
                : (user.tier as { value?: string; name?: string })?.value || (user.tier as { value?: string; name?: string })?.name || '';
            if (raw) {
                const normalized = raw.trim().toLowerCase();
                if (normalized === 'diamond') tierName = 'Diamond';
                else if (normalized === 'platinum') tierName = 'Platinum';
                else if (normalized === 'gold') tierName = 'Gold';
                else if (normalized === 'silver') tierName = 'Silver';
                else tierName = 'Bronze';
            }
        }

        switch (tierName) {
            case 'Diamond':
                return {
                    name: 'Diamond',
                    badge: 'DIAMOND',
                    badgeClass: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800',
                };
            case 'Platinum':
                return {
                    name: 'Platinum',
                    badge: 'PLATINUM',
                    badgeClass: 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-800',
                };
            case 'Gold':
                return {
                    name: 'Gold',
                    badge: 'GOLD',
                    badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/80 dark:text-yellow-300 dark:border-yellow-800',
                };
            case 'Silver':
                return {
                    name: 'Silver',
                    badge: 'SILVER',
                    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                };
            case 'Bronze':
            default:
                return {
                    name: 'Bronze',
                    badge: 'BRONZE',
                    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800',
                };
        }
    };

    const tierInfo = getTierInfo();

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
                                    <span
                                        className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold border ${tierInfo.badgeClass}`}
                                        title={`Level Member: ${tierInfo.name}`}
                                    >
                                        <Award className="size-2.5 shrink-0" />
                                        {tierInfo.badge}
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
                        <div className="relative" ref={notifRef}>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={handleToggleNotif}
                                className="relative rounded-full text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
                                aria-label="Notifikasi"
                                title="Notifikasi"
                            >
                                <Bell className="size-4.5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 size-2 rounded-full bg-red-600 ring-2 ring-white dark:ring-zinc-950 animate-pulse" />
                                )}
                            </Button>

                            {/* Notification Dropdown Preview */}
                            {notifOpen && (
                                <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 z-50">
                                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 dark:border-zinc-800">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                                                Notifikasi
                                            </h4>
                                            {unreadCount > 0 ? (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-400">
                                                    {unreadCount} Baru
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                                    {notifications.length} Pesan
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setNotifOpen(false)}
                                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md transition-colors cursor-pointer"
                                            title="Tutup"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    </div>

                                    <div className="mt-3 space-y-2.5 text-xs max-h-[380px] overflow-y-auto pr-0.5">
                                        {notifications.length === 0 ? (
                                            <div className="py-6 text-center text-zinc-400 dark:text-zinc-500">
                                                <p className="text-xs">Belum ada notifikasi.</p>
                                            </div>
                                        ) : (
                                            notifications.map((item) => {
                                                if (item.type === 'welcome') {
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className="rounded-xl bg-red-50/80 p-3 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/50 shadow-2xs"
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="font-bold text-red-700 dark:text-red-400 text-xs">
                                                                    {item.title}
                                                                </span>
                                                                {item.time && (
                                                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium shrink-0">
                                                                        {item.time}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                                                                {item.description}
                                                            </p>
                                                        </div>
                                                    );
                                                }

                                                if (item.type === 'activity') {
                                                    return (
                                                        <Link
                                                            key={item.id}
                                                            href={item.link || '/history'}
                                                            onClick={() => setNotifOpen(false)}
                                                            className="block rounded-xl bg-zinc-50/80 hover:bg-emerald-50/50 dark:bg-zinc-800/40 dark:hover:bg-emerald-950/20 p-3 border border-zinc-200/70 hover:border-emerald-300 dark:border-zinc-700/60 dark:hover:border-emerald-800/60 transition-colors shadow-2xs group cursor-pointer"
                                                        >
                                                            <div className="flex items-start gap-2.5">
                                                                <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                                                                    <Coins className="size-3.5" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between gap-1">
                                                                        <span className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                                                                            {item.title}
                                                                        </span>
                                                                        {item.time && (
                                                                            <span className="text-[10px] text-zinc-400 shrink-0">
                                                                                {item.time}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                                                                        {item.description}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    );
                                                }

                                                if (item.type === 'reward') {
                                                    const isClaimed = item.status === 'claimed';
                                                    const isRejected = item.status === 'rejected';
                                                    const isCancelled = item.status === 'cancelled';

                                                    const statusColor = isClaimed
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200'
                                                        : isRejected || isCancelled
                                                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border-rose-200'
                                                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border-amber-200';

                                                    return (
                                                        <Link
                                                            key={item.id}
                                                            href={item.link || '/rewards'}
                                                            onClick={() => setNotifOpen(false)}
                                                            className="block rounded-xl bg-zinc-50/80 hover:bg-red-50/50 dark:bg-zinc-800/40 dark:hover:bg-red-950/20 p-3 border border-zinc-200/70 hover:border-red-300 dark:border-zinc-700/60 dark:hover:border-red-900/60 transition-colors shadow-2xs group cursor-pointer"
                                                        >
                                                            <div className="flex items-start gap-2.5">
                                                                <div className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg ${statusColor}`}>
                                                                    <Gift className="size-3.5" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between gap-1">
                                                                        <span className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">
                                                                            {item.title}
                                                                        </span>
                                                                        {item.time && (
                                                                            <span className="text-[10px] text-zinc-400 shrink-0">
                                                                                {item.time}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                                                                        {item.description}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    );
                                                }

                                                return null;
                                            })
                                        )}
                                    </div>

                                    <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                                        <Link
                                            href="/history"
                                            onClick={() => setNotifOpen(false)}
                                            className="text-red-600 dark:text-red-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                                        >
                                            <span>Riwayat Aktivitas & Poin</span>
                                            <ArrowRight className="size-3" />
                                        </Link>
                                        <Link
                                            href="/rewards"
                                            onClick={() => setNotifOpen(false)}
                                            className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium cursor-pointer"
                                        >
                                            Katalog Reward
                                        </Link>
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
                    <Link
                        href="/rewards"
                        prefetch
                        className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
                            activeTab === 'rewards'
                                ? 'text-red-600 dark:text-red-500 font-bold'
                                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium'
                        }`}
                    >
                        <Gift className="size-5" />
                        <span className="text-[10px]">Reward</span>
                    </Link>

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
                                <span className="text-xs font-semibold text-zinc-500">Level Member</span>
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold border ${tierInfo.badgeClass}`}>
                                    <Award className="size-2.5 shrink-0" />
                                    {tierInfo.name} Member
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
