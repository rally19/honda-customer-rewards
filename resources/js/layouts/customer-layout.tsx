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
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { home } from '@/routes';
import type { NotificationItem, User } from '@/types';

type CustomerLayoutProps = {
    children: ReactNode;
    activeTab?: 'home' | 'history' | 'activities' | 'rewards' | 'profile';
};

export default function CustomerLayout({
    children,
    activeTab = 'home',
}: CustomerLayoutProps) {
    const page = usePage<{
        auth: { user: User };
        notifications?: NotificationItem[];
    }>();
    const { auth, notifications = [] } = page.props;
    const user = auth.user;
    const pathname = page.url.split('?')[0];

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

    const unreadCount = notifications.filter(
        (n) => !readIds.includes(n.id),
    ).length;

    const handleToggleNotif = () => {
        const nextState = !notifOpen;
        setNotifOpen(nextState);
        if (nextState && notifications.length > 0) {
            const allIds = notifications.map((n) => n.id);
            const updated = Array.from(new Set([...readIds, ...allIds]));
            setReadIds(updated);
            try {
                localStorage.setItem(
                    'honda_read_notifs',
                    JSON.stringify(updated),
                );
            } catch {
                // ignore
            }
        }
    };

    // Close notification dropdown when clicking outside
    useEffect(() => {
        if (!notifOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (
                notifRef.current &&
                !notifRef.current.contains(e.target as Node)
            ) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, [notifOpen]);

    // Allow components anywhere in the app to open the QR modal
    useEffect(() => {
        const handleOpenQr = () => setQrModalOpen(true);
        window.addEventListener('open-customer-qr-modal', handleOpenQr);
        return () =>
            window.removeEventListener('open-customer-qr-modal', handleOpenQr);
    }, []);

    // Format 10 digit ID: 1234 5678 90
    const rawId = String(user?.id || '8492019482').padStart(10, '0');
    const formattedMemberId = rawId.replace(
        /(\d{4})(\d{3})(\d{3})/,
        '$1 $2 $3',
    );

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
            const raw =
                typeof user.tier === 'string'
                    ? user.tier
                    : (user.tier as { value?: string; name?: string })?.value ||
                    (user.tier as { value?: string; name?: string })?.name ||
                    '';
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
                    badgeClass:
                        'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800',
                };
            case 'Platinum':
                return {
                    name: 'Platinum',
                    badge: 'PLATINUM',
                    badgeClass:
                        'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-800',
                };
            case 'Gold':
                return {
                    name: 'Gold',
                    badge: 'GOLD',
                    badgeClass:
                        'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/80 dark:text-yellow-300 dark:border-yellow-800',
                };
            case 'Silver':
                return {
                    name: 'Silver',
                    badge: 'SILVER',
                    badgeClass:
                        'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                };
            case 'Bronze':
            default:
                return {
                    name: 'Bronze',
                    badge: 'BRONZE',
                    badgeClass:
                        'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800',
                };
        }
    };

    const tierInfo = getTierInfo();

    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 pb-24 text-zinc-900 antialiased selection:bg-red-600 selection:text-white md:pb-28 dark:bg-zinc-950 dark:text-zinc-100">
            {/* Ambient Background Accent */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-32 left-1/2 h-[350px] w-[650px] -translate-x-1/2 rounded-full bg-red-600/10 blur-[130px] dark:bg-red-600/15" />
            </div>

            {/* ========================================================================= */}
            {/* TOP BAR (HEADER DIGITAL BANKING STYLE)                                    */}
            {/* ========================================================================= */}
            <header className="sticky top-0 z-[60] w-full border-b border-zinc-200/80 bg-white/95 shadow-xs backdrop-blur-md transition-colors dark:border-zinc-800/80 dark:bg-zinc-950/90">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
                    {/* Left: Brand & User Greeting */}
                    <div className="flex items-center gap-3">
                        <Link
                            href={home()}
                            className="group flex shrink-0 items-center gap-2"
                            title="Ke Beranda"
                        >
                            <img
                                src="/images/logo/anper_sartika_logo_red.png"
                                alt="Honda Customer Rewards"
                                className="h-8 w-auto object-contain dark:hidden"
                            />
                            <img
                                src="/images/logo/anper_sartika_logo_white.png"
                                alt="Honda Customer Rewards"
                                className="hidden h-8 w-auto object-contain dark:block"
                            />
                        </Link>

                        <div className=" h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

                        {/* User Profile Pill */}
                        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-xs font-bold text-white shadow-xs sm:size-9">
                                {user?.name
                                    ? user.name.charAt(0).toUpperCase()
                                    : 'U'}
                            </div>
                            <div className="min-w-0 leading-tight">
                                <div className="flex min-w-0 items-center gap-1.5">
                                    <span className="xs:max-w-[120px] max-w-[90px] truncate text-xs font-bold text-zinc-900 sm:max-w-[180px] dark:text-zinc-100">
                                        Halo, {user?.name?.split(' ')[0]} 👋
                                    </span>
                                    <span
                                        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-extrabold sm:px-2 sm:text-[10px] ${tierInfo.badgeClass}`}
                                        title={`Level Member: ${tierInfo.name}`}
                                    >
                                        <Award className="size-2.5 shrink-0" />
                                        {tierInfo.badge}
                                    </span>
                                </div>
                                <span className="block truncate font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
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
                                className="relative cursor-pointer rounded-full text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                                aria-label="Notifikasi"
                                title="Notifikasi"
                            >
                                <Bell className="size-4.5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 size-2 animate-pulse rounded-full bg-red-600 ring-2 ring-white dark:ring-zinc-950" />
                                )}
                            </Button>

                            {/* Notification Dropdown Preview */}
                            {notifOpen && (
                                <div className="animate-smooth-scale absolute right-0 z-[200] mt-2 w-84 origin-top-right rounded-2xl border border-zinc-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-xl sm:w-96 dark:border-zinc-800 dark:bg-zinc-900/95">
                                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 dark:border-zinc-800">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xs font-bold tracking-wider text-zinc-900 uppercase dark:text-zinc-100">
                                                Notifikasi
                                            </h4>
                                            {unreadCount > 0 ? (
                                                <span className="inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/80 dark:text-red-400">
                                                    {unreadCount} Baru
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                                    {notifications.length} Pesan
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setNotifOpen(false)}
                                            className="cursor-pointer rounded-md p-1 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
                                            title="Tutup"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    </div>

                                    <div className="mt-3 max-h-[380px] space-y-2.5 overflow-y-auto pr-0.5 text-xs">
                                        {notifications.length === 0 ? (
                                            <div className="py-6 text-center text-zinc-400 dark:text-zinc-500">
                                                <p className="text-xs">
                                                    Belum ada notifikasi.
                                                </p>
                                            </div>
                                        ) : (
                                            notifications.map((item) => {
                                                if (item.type === 'welcome') {
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className="rounded-xl border border-red-200/80 bg-red-50/80 p-3 shadow-2xs dark:border-red-900/50 dark:bg-red-950/40"
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-xs font-bold text-red-700 dark:text-red-400">
                                                                    {item.title}
                                                                </span>
                                                                {item.time && (
                                                                    <span className="shrink-0 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                                                                        {
                                                                            item.time
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="mt-1 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                                                                {
                                                                    item.description
                                                                }
                                                            </p>
                                                        </div>
                                                    );
                                                }

                                                if (item.type === 'activity') {
                                                    return (
                                                        <Link
                                                            key={item.id}
                                                            href={
                                                                item.link ||
                                                                '/history'
                                                            }
                                                            onClick={() =>
                                                                setNotifOpen(
                                                                    false,
                                                                )
                                                            }
                                                            className="group block cursor-pointer rounded-xl border border-zinc-200/70 bg-zinc-50/80 p-3 shadow-2xs transition-colors hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-zinc-700/60 dark:bg-zinc-800/40 dark:hover:border-emerald-800/60 dark:hover:bg-emerald-950/20"
                                                        >
                                                            <div className="flex items-start gap-2.5">
                                                                <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                                                                    <Coins className="size-3.5" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center justify-between gap-1">
                                                                        <span className="truncate font-bold text-zinc-900 transition-colors group-hover:text-emerald-600 dark:text-zinc-100 dark:group-hover:text-emerald-400">
                                                                            {
                                                                                item.title
                                                                            }
                                                                        </span>
                                                                        {item.time && (
                                                                            <span className="shrink-0 text-[10px] text-zinc-400">
                                                                                {
                                                                                    item.time
                                                                                }
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                                                                        {
                                                                            item.description
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    );
                                                }

                                                if (item.type === 'reward') {
                                                    const isClaimed =
                                                        item.status ===
                                                        'claimed';
                                                    const isRejected =
                                                        item.status ===
                                                        'rejected';
                                                    const isCancelled =
                                                        item.status ===
                                                        'cancelled';

                                                    const statusColor =
                                                        isClaimed
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200'
                                                            : isRejected ||
                                                                isCancelled
                                                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border-rose-200'
                                                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border-amber-200';

                                                    return (
                                                        <Link
                                                            key={item.id}
                                                            href={
                                                                item.link ||
                                                                '/rewards'
                                                            }
                                                            onClick={() =>
                                                                setNotifOpen(
                                                                    false,
                                                                )
                                                            }
                                                            className="group block cursor-pointer rounded-xl border border-zinc-200/70 bg-zinc-50/80 p-3 shadow-2xs transition-colors hover:border-red-300 hover:bg-red-50/50 dark:border-zinc-700/60 dark:bg-zinc-800/40 dark:hover:border-red-900/60 dark:hover:bg-red-950/20"
                                                        >
                                                            <div className="flex items-start gap-2.5">
                                                                <div
                                                                    className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg ${statusColor}`}
                                                                >
                                                                    <Gift className="size-3.5" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center justify-between gap-1">
                                                                        <span className="truncate font-bold text-zinc-900 transition-colors group-hover:text-red-600 dark:text-zinc-100 dark:group-hover:text-red-400">
                                                                            {
                                                                                item.title
                                                                            }
                                                                        </span>
                                                                        {item.time && (
                                                                            <span className="shrink-0 text-[10px] text-zinc-400">
                                                                                {
                                                                                    item.time
                                                                                }
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                                                                        {
                                                                            item.description
                                                                        }
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

                                    <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5 text-[11px] dark:border-zinc-800">
                                        <Link
                                            href="/activities"
                                            onClick={() => setNotifOpen(false)}
                                            className="flex cursor-pointer items-center gap-1 font-semibold text-red-600 hover:underline dark:text-red-400"
                                        >
                                            <span>
                                                Aktivitas & Riwayat Poin
                                            </span>
                                            <ArrowRight className="size-3" />
                                        </Link>
                                        <Link
                                            href="/rewards"
                                            onClick={() => setNotifOpen(false)}
                                            className="cursor-pointer font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                                        >
                                            Katalog Reward
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* ========================================================================= */}
            {/* MAIN CONTENT CONTAINER                                                    */}
            {/* ========================================================================= */}
            <main className="relative mx-auto w-full max-w-5xl flex-1 px-4 pt-5 sm:px-6">
                {pathname.startsWith('/settings') ? (
                    children
                ) : (
                    <div key={pathname} className="animate-smooth-in">
                        {children}
                    </div>
                )}
            </main>

            {/* ========================================================================= */}
            {/* BOTTOM NAVIGATION BAR (MODERN FLOATING DOCK - E-WALLET STYLE)             */}
            {/* ========================================================================= */}
            <nav
                className="fixed inset-x-0 bottom-3 z-[60] mx-auto w-[94%] max-w-md rounded-3xl border border-zinc-200/90 bg-white/95 px-3 py-2 shadow-2xl shadow-zinc-950/15 backdrop-blur-xl transition-colors sm:max-w-lg md:max-w-xl dark:border-zinc-800 dark:bg-zinc-900/95 dark:shadow-black/60"
                aria-label="Navigasi Bawah"
            >
                <div className="relative flex items-center justify-around">
                    {/* Tab 1: Beranda */}
                    <Link
                        href="/dashboard"
                        className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${activeTab === 'home'
                            ? 'font-bold text-red-600 dark:text-red-500'
                            : 'font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                    >
                        <Home className="size-5" />
                        <span className="text-[10px]">Beranda</span>
                    </Link>

                    {/* Tab 2: Aktivitas */}
                    <Link
                        href="/activities"
                        prefetch
                        className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${activeTab === 'history' ||
                            activeTab === 'activities'
                            ? 'font-bold text-red-600 dark:text-red-500'
                            : 'font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                    >
                        <Clock className="size-5" />
                        <span className="text-[10px]">Aktivitas</span>
                    </Link>

                    {/* Tab 3 (Tengah - Elevated / Floating Action Button): Scan QR ID MEMBER */}
                    <div className="-mt-7">
                        <button
                            type="button"
                            onClick={() => setQrModalOpen(true)}
                            className="group relative flex size-14 cursor-pointer items-center justify-center rounded-full bg-gradient-to-tr from-red-600 via-red-500 to-rose-600 text-white shadow-xl ring-4 shadow-red-600/40 ring-white transition-all hover:scale-105 active:scale-95 dark:ring-zinc-900"
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
                        className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${activeTab === 'rewards'
                            ? 'font-bold text-red-600 dark:text-red-500'
                            : 'font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                    >
                        <Gift className="size-5" />
                        <span className="text-[10px]">Reward</span>
                    </Link>

                    {/* Tab 5: Akun / Pengaturan */}
                    <Link
                        href="/settings/profile"
                        className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${activeTab === 'profile'
                            ? 'font-bold text-red-600 dark:text-red-500'
                            : 'font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
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
                <DialogContent className="z-[100] max-h-[90vh] w-[92vw] max-w-sm gap-3 overflow-y-auto rounded-3xl border-zinc-200 bg-white p-4 shadow-2xl sm:max-w-md sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <DialogHeader className="space-y-1 pb-1 text-center">
                        <div className="mx-auto inline-flex items-center justify-center gap-1.5 rounded-full border border-red-200/80 bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-600 dark:border-red-900/50 dark:bg-red-950/60 dark:text-red-400">
                            <QrCodeIcon className="size-3" />
                            <span>KARTU DIGITAL ID</span>
                        </div>
                        <DialogTitle className="text-base font-black tracking-tight text-zinc-900 sm:text-lg dark:text-white">
                            Digital ID Member
                        </DialogTitle>
                        <DialogDescription className="mx-auto max-w-xs text-[11px] text-zinc-500">
                            Tunjukkan QR ini ke staf kasir AHASS atau dealer
                            saat transaksi
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center space-y-3 text-center">
                        {/* Member Identity Preview - Compact */}
                        <div className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/90 p-2.5 text-left sm:p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <span className="mb-1 block text-[9px] leading-none font-bold text-zinc-400 uppercase dark:text-zinc-500">
                                        Nama Member
                                    </span>
                                    <span className="block truncate text-xs font-bold text-zinc-900 dark:text-white">
                                        {user?.name}
                                    </span>
                                </div>
                                <span
                                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${tierInfo.badgeClass}`}
                                >
                                    <Award className="size-2.5 shrink-0" />
                                    {tierInfo.name} Member
                                </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between border-t border-zinc-200/70 pt-2 dark:border-zinc-800/80">
                                <div>
                                    <span className="mb-0.5 block text-[9px] leading-none font-bold text-zinc-400 uppercase dark:text-zinc-500">
                                        10-Digit ID Member
                                    </span>
                                    <span className="font-mono text-xs font-black tracking-wider text-red-600 sm:text-sm dark:text-red-500">
                                        {formattedMemberId}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCopyId}
                                    className="inline-flex items-center gap-1 rounded-lg bg-zinc-200/60 px-2 py-1 text-[10px] font-semibold text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                    title="Salin ID"
                                >
                                    {copiedId ? (
                                        <>
                                            <Check className="size-3 text-emerald-500" />
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                Disalin
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="size-3" />
                                            <span>Salin</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Interactive QR Code Visual (qr-code-styling) */}
                        <div className="relative mx-auto flex w-full max-w-[280px] flex-col items-center justify-center rounded-3xl border-2 border-red-500/20 bg-white p-3 shadow-xl shadow-red-500/10 sm:max-w-[320px] sm:p-4">
                            <div className="flex aspect-square w-full items-center justify-center">
                                <QrCode
                                    ref={qrCodeRef}
                                    data={`HND-MEMBER-${rawId}`}
                                    width={320}
                                    height={320}
                                    className="flex h-full w-full items-center justify-center"
                                    image="/images/logo/honda_logo_red.png"
                                    dotsColor="#DC2626"
                                    dotsType="rounded"
                                    cornersSquareType="extra-rounded"
                                    cornersDotType="dot"
                                />
                            </div>
                            <div className="mt-2 font-mono text-[11px] font-bold tracking-wider text-zinc-600 sm:text-xs">
                                SCAN ID: HND-{rawId}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons: 2 cols on mobile, 1 flex row on sm+ */}
                    <div className="grid grid-cols-2 gap-2 pt-1 sm:flex sm:items-center">
                        <Button
                            type="button"
                            onClick={() =>
                                qrCodeRef.current?.download(
                                    `honda-member-${rawId}`,
                                    'png',
                                )
                            }
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-xl border-zinc-300 text-xs font-semibold hover:border-red-500 hover:text-red-600 dark:border-zinc-700 dark:hover:border-red-500 dark:hover:text-red-400"
                        >
                            <Download className="mr-1 size-3.5" />
                            Unduh QR
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCopyId}
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-xl border-zinc-300 text-xs font-semibold dark:border-zinc-700"
                        >
                            {copiedId ? (
                                <>
                                    <Check className="mr-1 size-3.5 text-emerald-500" />
                                    Tersalin!
                                </>
                            ) : (
                                <>
                                    <Copy className="mr-1 size-3.5" />
                                    Salin ID
                                </>
                            )}
                        </Button>
                        <Button
                            type="button"
                            onClick={() => setQrModalOpen(false)}
                            size="sm"
                            className="col-span-2 h-9 rounded-xl bg-red-600 px-4 text-xs font-bold text-white shadow-sm shadow-red-600/20 hover:bg-red-700 sm:col-span-1"
                        >
                            Tutup
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
