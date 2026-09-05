import { Head, Link } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import {
    ArrowDownRight,
    ArrowUpRight,
    Award,
    Calendar,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Coins,
    Copy,
    Eye,
    EyeOff,
    FileText,
    Flame,
    Gift,
    HelpCircle,
    Info,
    MessageSquare,
    Plus,
    QrCode,
    Share2,
    Shield,
    ShoppingBag,
    Sparkles,
    Tag,
    Ticket,
    User,
    Users,
    Wrench,
    XCircle,
    Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import CustomerLayout from '@/layouts/customer-layout';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type TierRoadmapItem = {
    tier: string;
    name: string;
    minPoints: number;
    maxPoints: number | null;
    benefit: string;
    visualStyles: {
        badge: string;
        color: string;
        bg: string;
        border: string;
        text: string;
    };
    isReached: boolean;
    isCurrent: boolean;
};

type EarningActivity = {
    id: string;
    name: string;
    points: number;
    description?: string;
};

type RewardItem = {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    image?: string;
    points_cost?: number;
    pointsCost?: number;
    stock: number;
    can_afford?: boolean;
};

type Props = {
    loyalty: {
        memberId: string;
        tier: string;
        tierBadge: string;
        tierLevel?: string;
        nextTier: string;
        points: number;
        lifetimePoints?: number;
        pointsToNextTier: number;
        tierProgress: number;
        tierRoadmap?: TierRoadmapItem[];
        earningActivities?: EarningActivity[];
        rewards?: RewardItem[];
        vouchers?: Array<{
            id: string;
            title: string;
            code: string;
            category: string;
            expiresAt: string;
            image: string;
            status: string;
        }>;
        transactions: Array<{
            id: string;
            title: string;
            dealer: string;
            points: number;
            type: 'credit' | 'debit';
            date: string;
        }>;
        raffleTickets: Array<{
            number: string;
            period: string;
        }>;
    };
    earningActivities?: EarningActivity[];
    rewards?: RewardItem[];
};

export default function CustomerDashboard({ loyalty, earningActivities, rewards }: Props) {
    const [showPoints, setShowPoints] = useState(true);
    const [copiedId, setCopiedId] = useState(false);
    const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
    const [showTierModal, setShowTierModal] = useState(false);

    const sliderRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const rewardSliderRef = useRef<HTMLDivElement>(null);
    const [canScrollRewardLeft, setCanScrollRewardLeft] = useState(false);
    const [canScrollRewardRight, setCanScrollRewardRight] = useState(true);

    const activeRewards: RewardItem[] = (rewards && rewards.length > 0)
        ? rewards
        : (loyalty.rewards && loyalty.rewards.length > 0)
            ? loyalty.rewards
            : [
                {
                    id: '2039485704',
                    name: 'Voucher servis',
                    description: 'Voucher gratis atau potongan biaya jasa servis berkala di bengkel resmi AHASS.',
                    image_url: '/images/pictures/voucher_service_img.jpg',
                    points_cost: 150,
                    stock: 30,
                },
                {
                    id: '2039485702',
                    name: 'Oli Honda gratis',
                    description: 'Gratis 1 botol oli pelumas resmi mesin motor Honda AHM Oil MPX / SPX.',
                    image_url: '/images/pictures/oli_honda_img.jpg',
                    points_cost: 200,
                    stock: 50,
                },
                {
                    id: '2039485703',
                    name: 'Potongan pembelian aksesori',
                    description: 'Potongan harga langsung pembelian Honda Genuine Accessories (HGA) resmi.',
                    image_url: '/images/pictures/potongan_pembelian_aksesori_img.jpg',
                    points_cost: 100,
                    stock: 40,
                },
                {
                    id: '2039485701',
                    name: 'Merchandise resmi Honda',
                    description: 'Apparel eksklusif resmi Honda seperti jaket riding touring dan t-shirt.',
                    image_url: '/images/pictures/merchandise_resmi_honda_img.jpg',
                    points_cost: 350,
                    stock: 25,
                },
                {
                    id: '2039485705',
                    name: 'Voucher pembelian motor',
                    description: 'Voucher potongan DP atau cashback pembelian unit motor baru Honda.',
                    image_url: '/images/pictures/voucher_pembelian_motor_img.jpg',
                    points_cost: 800,
                    stock: 10,
                },
                {
                    id: '2039485706',
                    name: 'Kesempatan mengikuti undian hadiah khusus',
                    description: 'Kupon partisipasi undian reward dengan kesempatan hadiah grand prize khusus.',
                    image_url: '/images/pictures/kesempatan_mengikuti_undian_hadiah_khusus_img.jpg',
                    points_cost: 50,
                    stock: 100,
                },
            ];

    const updateRewardScrollButtons = () => {
        if (!rewardSliderRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = rewardSliderRef.current;
        setCanScrollRewardLeft(scrollLeft > 4);
        setCanScrollRewardRight(scrollLeft < scrollWidth - clientWidth - 4);
    };

    useEffect(() => {
        updateRewardScrollButtons();
        const timer = setTimeout(updateRewardScrollButtons, 100);
        const slider = rewardSliderRef.current;
        if (!slider) return;
        slider.addEventListener('scroll', updateRewardScrollButtons, { passive: true });
        window.addEventListener('resize', updateRewardScrollButtons);
        return () => {
            clearTimeout(timer);
            slider.removeEventListener('scroll', updateRewardScrollButtons);
            window.removeEventListener('resize', updateRewardScrollButtons);
        };
    }, [activeRewards.length]);

    const scrollRewardSlider = (direction: 'left' | 'right') => {
        if (rewardSliderRef.current) {
            const amount = direction === 'left' ? -220 : 220;
            rewardSliderRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    const activeActivities: EarningActivity[] = (earningActivities && earningActivities.length > 0)
        ? earningActivities
        : (loyalty.earningActivities && loyalty.earningActivities.length > 0)
            ? loyalty.earningActivities
            : [
                { id: '1029384751', name: 'Servis berkala di AHASS', points: 150, description: 'Servis rutin berkala motor Honda sesuai standar AHASS.' },
                { id: '1029384752', name: 'Pembelian suku cadang atau aksesori Honda', points: 100, description: 'Pembelian suku cadang asli HGP atau aksesoris HGA.' },
                { id: '1029384753', name: 'Pembelian motor Honda', points: 500, description: 'Pembelian unit motor baru Honda di dealer resmi.' },
                { id: '1029384754', name: 'Mengikuti event dealer', points: 75, description: 'Partisipasi gathering, pameran, atau showroom event.' },
                { id: '1029384755', name: 'Mengikuti test ride', points: 50, description: 'Mencoba sensasi berkendara lini motor terbaru Honda.' },
                { id: '1029384756', name: 'Mengajak teman atau keluarga membeli motor Honda (program referral)', points: 300, description: 'Program referral ajak teman & keluarga beli motor Honda.' },
                { id: '1029384757', name: 'Memberikan ulasan atau penilaian layanan dealer saat servis atau pembelian motor', points: 40, description: 'Ulasan layanan dealer saat servis atau pembelian motor.' },
            ];

    const updateScrollButtons = () => {
        if (!sliderRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
        setCanScrollLeft(scrollLeft > 4);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    };

    useEffect(() => {
        updateScrollButtons();
        const timer = setTimeout(updateScrollButtons, 100);
        const slider = sliderRef.current;
        if (!slider) return;
        slider.addEventListener('scroll', updateScrollButtons, { passive: true });
        window.addEventListener('resize', updateScrollButtons);
        return () => {
            clearTimeout(timer);
            slider.removeEventListener('scroll', updateScrollButtons);
            window.removeEventListener('resize', updateScrollButtons);
        };
    }, [activeActivities.length]);

    const scrollSlider = (direction: 'left' | 'right') => {
        if (sliderRef.current) {
            const amount = direction === 'left' ? -220 : 220;
            sliderRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    const getActivityIcon = (title: string) => {
        const lower = title.toLowerCase();
        if (lower.includes('servis') || lower.includes('tune') || lower.includes('ahass')) {
            return <Wrench className="size-4.5 text-red-600 dark:text-red-400" />;
        }
        if (lower.includes('suku cadang') || lower.includes('aksesori') || lower.includes('part')) {
            return <ShoppingBag className="size-4.5 text-amber-600 dark:text-amber-400" />;
        }
        if (lower.includes('beli motor') || lower.includes('pembelian motor')) {
            return <Sparkles className="size-4.5 text-rose-600 dark:text-rose-400" />;
        }
        if (lower.includes('event')) {
            return <Calendar className="size-4.5 text-blue-600 dark:text-blue-400" />;
        }
        if (lower.includes('test ride')) {
            return <Zap className="size-4.5 text-orange-600 dark:text-orange-400" />;
        }
        if (lower.includes('referral') || lower.includes('teman') || lower.includes('keluarga')) {
            return <Users className="size-4.5 text-purple-600 dark:text-purple-400" />;
        }
        if (lower.includes('ulasan') || lower.includes('penilaian') || lower.includes('rating')) {
            return <MessageSquare className="size-4.5 text-emerald-600 dark:text-emerald-400" />;
        }
        return <Award className="size-4.5 text-red-600 dark:text-red-400" />;
    };

    const getActivityBg = (title: string) => {
        const lower = title.toLowerCase();
        if (lower.includes('servis') || lower.includes('tune') || lower.includes('ahass')) {
            return 'bg-red-50 dark:bg-red-950/60 border-red-200/60 dark:border-red-900/40';
        }
        if (lower.includes('suku cadang') || lower.includes('aksesori') || lower.includes('part')) {
            return 'bg-amber-50 dark:bg-amber-950/60 border-amber-200/60 dark:border-amber-900/40';
        }
        if (lower.includes('beli motor') || lower.includes('pembelian motor')) {
            return 'bg-rose-50 dark:bg-rose-950/60 border-rose-200/60 dark:border-rose-900/40';
        }
        if (lower.includes('event')) {
            return 'bg-blue-50 dark:bg-blue-950/60 border-blue-200/60 dark:border-blue-900/40';
        }
        if (lower.includes('test ride')) {
            return 'bg-orange-50 dark:bg-orange-950/60 border-orange-200/60 dark:border-orange-900/40';
        }
        if (lower.includes('referral') || lower.includes('teman') || lower.includes('keluarga')) {
            return 'bg-purple-50 dark:bg-purple-950/60 border-purple-200/60 dark:border-purple-900/40';
        }
        if (lower.includes('ulasan') || lower.includes('penilaian') || lower.includes('rating')) {
            return 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/60 dark:border-emerald-900/40';
        }
        return 'bg-red-50 dark:bg-red-950/60 border-red-200/60 dark:border-red-900/40';
    };

    const handleActivityClick = (act: EarningActivity) => {
        const lower = act.name.toLowerCase();
        if (lower.includes('referral') || lower.includes('teman') || lower.includes('keluarga')) {
            handleCopyId();
            toast.success('ID Member disalin! Bagikan ke teman & keluarga untuk raih +300 Poin saat pembelian unit motor.');
            return;
        }

        window.dispatchEvent(new CustomEvent('open-customer-qr-modal'));
        toast.info(`Tunjukkan ID Member saat "${act.name}" untuk klaim +${act.points} Poin!`);
    };

    const formattedId = loyalty.memberId
        .padStart(10, '0')
        .replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');

    const handleCopyId = () => {
        navigator.clipboard.writeText(loyalty.memberId);
        setCopiedId(true);
        toast.success('ID Member berhasil disalin ke clipboard');
        setTimeout(() => setCopiedId(false), 2000);
    };

    return (
        <CustomerLayout activeTab="home">
            <Head title="Member Rewards E-Wallet - Honda Loyalty" />

            <div className="space-y-6 max-w-4xl mx-auto w-full">
                {/* ========================================================================= */}
                {/* 1. DIGITAL REWARDS MEMBER CARD (HERO SECTION)                             */}
                {/* ========================================================================= */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-red-700 to-zinc-950 p-6 sm:p-8 text-white shadow-xl shadow-red-950/20 bg-clip-padding">
                    {/* Outline / Border Overlay (rendered above gradient & watermark so corners are never covered) */}
                    <div className="pointer-events-none absolute inset-0 rounded-3xl border border-red-500/40 ring-1 ring-inset ring-white/15 z-20" />

                    {/* Watermark Logo Honda Wing */}
                    <div className="pointer-events-none absolute right-5 -bottom-10 opacity-15 select-none z-0">
                        <img
                            src="/images/logo/honda_logo_white.png"
                            alt="Honda"
                            className="w-72 sm:w-84 h-auto"
                        />
                    </div>

                    <div className="relative z-10 flex flex-col justify-between space-y-6">
                        {/* Card Top: Logo & Tier */}
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono tracking-widest text-zinc-300 uppercase">
                                        Honda Loyalty E-Wallet
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-base sm:text-lg font-black tracking-wider text-red-200">
                                        #{formattedId}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCopyId}
                                        className="rounded-md bg-white/10 p-1 text-zinc-300 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
                                        title="Salin ID Member"
                                    >
                                        {copiedId ? (
                                            <Check className="size-3.5 text-emerald-400" />
                                        ) : (
                                            <Copy className="size-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Tier Badge (Clickable to open roadmap modal) */}
                            <button
                                type="button"
                                onClick={() => setShowTierModal(true)}
                                className="flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md px-3.5 py-1.5 border border-white/15 text-xs font-bold text-red-200 hover:bg-black/60 hover:border-white/30 transition-all cursor-pointer group shadow-sm active:scale-95"
                                title="Klik untuk melihat Roadmap & Benefit Level Member"
                            >
                                <Award className="size-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                                <span>{loyalty.tier}</span>
                                <Info className="size-3 text-zinc-400 group-hover:text-white transition-colors ml-0.5" />
                            </button>
                        </div>

                        {/* Card Center: Saldo Poin (Digital Balance) */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-zinc-300">
                                <span>Saldo Poin Anda</span>
                                <button
                                    type="button"
                                    onClick={() => setShowPoints(!showPoints)}
                                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                    title={showPoints ? 'Sembunyikan Saldo' : 'Tampilkan Saldo'}
                                >
                                    {showPoints ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                </button>
                            </div>

                            <div className="flex items-baseline gap-2 flex-wrap">
                                <div className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans">
                                    {showPoints ? loyalty.points.toLocaleString('id-ID') : '••••••'}
                                </div>
                                <span className="text-sm font-bold text-red-400 uppercase">POIN</span>
                                {loyalty.lifetimePoints !== undefined && (
                                    <button
                                        type="button"
                                        onClick={() => setShowTierModal(true)}
                                        className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white border border-white/10 transition-colors ml-auto cursor-pointer flex items-center gap-1"
                                        title="Poin akumulasi seumur hidup menentukan level Anda"
                                    >
                                        <span>Akumulasi: {loyalty.lifetimePoints.toLocaleString('id-ID')} Pts</span>
                                        <Info className="size-2.5 opacity-70" />
                                    </button>
                                )}
                            </div>

                            {/* Tier Progress Bar (Clickable to open roadmap modal) */}
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => setShowTierModal(true)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setShowTierModal(true);
                                    }
                                }}
                                className="pt-2 max-w-sm cursor-pointer group transition-transform focus:outline-none"
                                title="Klik untuk melihat detail tingkatan level & akumulasi poin"
                            >
                                <div className="flex justify-between text-[11px] text-zinc-300 mb-1 items-center">
                                    {loyalty.pointsToNextTier === 0 || loyalty.nextTier === 'Maksimal' ? (
                                        <>
                                            <span className="flex items-center gap-1 font-semibold text-amber-300">
                                                <Sparkles className="size-3 text-amber-400 animate-pulse" />
                                                Tingkat Tertinggi (Diamond Member)
                                            </span>
                                            <span className="font-mono text-emerald-300 font-bold">100% Maksimal</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="group-hover:text-white transition-colors">
                                                Menuju {loyalty.nextTier}
                                            </span>
                                            <span className="font-mono font-medium">
                                                {loyalty.pointsToNextTier.toLocaleString('id-ID')} Poin lagi
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div className="h-2 w-full rounded-full bg-black/50 overflow-hidden ring-1 ring-white/10">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300 transition-all duration-500"
                                        style={{ width: `${Math.min(100, Math.max(0, loyalty.tierProgress))}%` }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                                    <span>Level dihitung dari total akumulasi</span>
                                    <span className="underline decoration-dotted text-zinc-300 group-hover:text-white flex items-center gap-1">
                                        Roadmap Level & Benefit →
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Card Bottom: 4 Quick Actions */}
                        <div className="grid grid-cols-4 gap-2 border-t border-white/10 pt-4 text-center">
                            {/* 1. ID Member: Buka Modal Digital ID Member */}
                            <button
                                type="button"
                                onClick={() => window.dispatchEvent(new CustomEvent('open-customer-qr-modal'))}
                                className="group flex flex-col items-center gap-1.5 rounded-xl p-2 hover:bg-white/10 transition-colors cursor-pointer"
                                title="Buka Kartu Digital ID Member"
                            >
                                <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 text-white group-hover:scale-105 transition-transform shadow-xs">
                                    <QrCode className="size-4.5" />
                                </div>
                                <span className="text-[11px] font-medium text-zinc-200">
                                    ID Member
                                </span>
                            </button>

                            {/* 2. Aktivitas: Navigasi ke Halaman Aktivitas */}
                            <Link
                                href="/activities"
                                prefetch
                                className="group flex flex-col items-center gap-1.5 rounded-xl p-2 hover:bg-white/10 transition-colors"
                                title="Lihat Aktivitas & Riwayat Poin"
                            >
                                <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 text-white group-hover:scale-105 transition-transform shadow-xs">
                                    <Clock className="size-4.5" />
                                </div>
                                <span className="text-[11px] font-medium text-zinc-200">Aktivitas</span>
                            </Link>

                            {/* 3. Reward: Navigasi ke Katalog Reward */}
                            <Link
                                href="/rewards"
                                prefetch
                                className="group flex flex-col items-center gap-1.5 rounded-xl p-2 hover:bg-white/10 transition-colors"
                                title="Lihat Katalog Reward & Voucher"
                            >
                                <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 text-white group-hover:scale-105 transition-transform shadow-xs">
                                    <Gift className="size-4.5" />
                                </div>
                                <span className="text-[11px] font-medium text-zinc-200">Reward</span>
                            </Link>

                            {/* 4. Akun: Navigasi ke Profil / Pengaturan Akun */}
                            <Link
                                href="/settings/profile"
                                className="group flex flex-col items-center gap-1.5 rounded-xl p-2 hover:bg-white/10 transition-colors"
                                title="Profil & Pengaturan Akun"
                            >
                                <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 text-white group-hover:scale-105 transition-transform shadow-xs">
                                    <User className="size-4.5" />
                                </div>
                                <span className="text-[11px] font-medium text-zinc-200">Akun</span>
                            </Link>
                        </div>
                    </div>
                </section>


                {/* ========================================================================= */}
                {/* 3. AKTIVITAS & PEROLEHAN POIN (SLIDEABLE CAROUSEL)                        */}
                {/* ========================================================================= */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap className="size-4 text-red-600" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                                Aktivitas & Perolehan Poin
                            </h3>
                            <span className="hidden sm:inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 text-[10px] font-semibold">
                                {activeActivities.length} Aktivitas
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Slide Navigation Buttons */}
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => scrollSlider('left')}
                                    disabled={!canScrollLeft}
                                    className="size-7 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
                                    title="Geser ke kiri"
                                    aria-label="Geser ke kiri"
                                >
                                    <ChevronLeft className="size-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => scrollSlider('right')}
                                    disabled={!canScrollRight}
                                    className="size-7 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
                                    title="Geser ke kanan"
                                    aria-label="Geser ke kanan"
                                >
                                    <ChevronRight className="size-3.5" />
                                </button>
                            </div>

                            <Link
                                href="/activities?tab=earning"
                                prefetch
                                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-0.5 ml-1"
                                title="Lihat detail aktivitas & perolehan poin"
                            >
                                <span>Lihat Semua</span>
                                <ChevronRight className="size-3" />
                            </Link>
                        </div>
                    </div>

                    {/* Slide Container with Edge Gradient Fades */}
                    <div className="relative">
                        {/* Left Fade Overlay (appears when content is scrolled to the right) */}
                        <div
                            className={`pointer-events-none absolute -left-1.5 sm:-left-2 top-0 bottom-0 w-5 sm:w-6 md:w-8 bg-gradient-to-r from-zinc-50 via-zinc-50/80 to-transparent dark:from-zinc-950 dark:via-zinc-950/80 dark:to-transparent z-10 transition-opacity duration-300 ${
                                canScrollLeft ? 'opacity-100' : 'opacity-0'
                            }`}
                            aria-hidden="true"
                        />

                        {/* Slide Container */}
                        <div
                            ref={sliderRef}
                            className="flex gap-3 overflow-x-auto py-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
                        >
                            {activeActivities.map((act) => (
                                <div
                                    key={act.id}
                                    onClick={() => handleActivityClick(act)}
                                    className="w-[155px] sm:w-[175px] shrink-0 snap-start flex flex-col justify-between p-3 sm:p-3.5 rounded-2xl border border-zinc-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:border-red-400 dark:hover:border-red-500/60 transition-all cursor-pointer group shadow-2xs select-none"
                                    title={`${act.name} (+${act.points} Poin)`}
                                >
                                    <div className="space-y-2.5">
                                        {/* Icon & Points Badge */}
                                        <div className="flex items-center justify-between gap-1.5">
                                            <div
                                                className={`flex size-9 items-center justify-center rounded-xl border shadow-2xs group-hover:scale-105 transition-transform ${getActivityBg(
                                                    act.name,
                                                )}`}
                                            >
                                                {getActivityIcon(act.name)}
                                            </div>
                                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/60 shadow-2xs">
                                                +{act.points} Pts
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <div>
                                            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2 leading-tight">
                                                {act.name}
                                            </h4>
                                        </div>
                                    </div>

                                    {/* Bottom Action */}
                                    <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px]">
                                        <span className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                            <QrCode className="size-3" />
                                            Tunjukkan ID
                                        </span>
                                        <ChevronRight className="size-3 text-zinc-400 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Right Fade Overlay (appears when there is more content to scroll) */}
                        <div
                            className={`pointer-events-none absolute -right-1.5 sm:-right-2 top-0 bottom-0 w-5 sm:w-6 md:w-8 bg-gradient-to-l from-zinc-50 via-zinc-50/80 to-transparent dark:from-zinc-950 dark:via-zinc-950/80 dark:to-transparent z-10 transition-opacity duration-300 ${
                                canScrollRight ? 'opacity-100' : 'opacity-0'
                            }`}
                            aria-hidden="true"
                        />
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 4. KATALOG REWARD RESMI (SLIDEABLE CAROUSEL)                              */}
                {/* ========================================================================= */}
                <section id="rewards-catalog" className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Gift className="size-4 text-red-600" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                                Katalog Reward
                            </h3>
                            <span className="hidden sm:inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 text-[10px] font-semibold">
                                {activeRewards.length} Pilihan Hadiah
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Slide Navigation Buttons */}
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => scrollRewardSlider('left')}
                                    disabled={!canScrollRewardLeft}
                                    className="size-7 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
                                    title="Geser reward ke kiri"
                                    aria-label="Geser ke kiri"
                                >
                                    <ChevronLeft className="size-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => scrollRewardSlider('right')}
                                    disabled={!canScrollRewardRight}
                                    className="size-7 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
                                    title="Geser reward ke kanan"
                                    aria-label="Geser ke kanan"
                                >
                                    <ChevronRight className="size-3.5" />
                                </button>
                            </div>

                            <Link
                                href="/rewards"
                                prefetch
                                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-0.5 ml-1"
                                title="Lihat semua katalog reward & penukaran"
                            >
                                <span>Lihat Semua</span>
                                <ChevronRight className="size-3" />
                            </Link>
                        </div>
                    </div>

                    {/* Slide Container with Edge Gradient Fades */}
                    <div className="relative">
                        {/* Left Fade Overlay (appears when content is scrolled to the right) */}
                        <div
                            className={`pointer-events-none absolute -left-1.5 sm:-left-2 top-0 bottom-0 w-5 sm:w-6 md:w-8 bg-gradient-to-r from-zinc-50 via-zinc-50/80 to-transparent dark:from-zinc-950 dark:via-zinc-950/80 dark:to-transparent z-10 transition-opacity duration-300 ${
                                canScrollRewardLeft ? 'opacity-100' : 'opacity-0'
                            }`}
                            aria-hidden="true"
                        />

                        {/* Slide Container */}
                        <div
                            ref={rewardSliderRef}
                            className="flex gap-3 overflow-x-auto py-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
                        >
                            {activeRewards.map((reward) => {
                                const cost = reward.points_cost ?? reward.pointsCost ?? 0;
                                const imageSrc = reward.image_url || reward.image || '/images/pictures/merchandise_resmi_honda_img.jpg';
                                const canAfford = loyalty.points >= cost;

                                return (
                                    <div
                                        key={reward.id}
                                        onClick={() => setSelectedReward(reward)}
                                        className="w-[160px] sm:w-[185px] shrink-0 snap-start flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden hover:border-red-400 dark:hover:border-red-500/60 transition-all cursor-pointer group shadow-2xs select-none"
                                        title={`${reward.name} (${cost} Poin)`}
                                    >
                                        {/* Image Thumbnail */}
                                        <div className="relative h-24 sm:h-28 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                            <img
                                                src={imageSrc}
                                                alt={reward.name}
                                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                                            {/* Points Badge */}
                                            <span className="absolute top-2 left-2 rounded-full bg-black/70 backdrop-blur-md px-2 py-0.5 text-[10px] font-black text-amber-300 border border-white/20 shadow-xs flex items-center gap-0.5">
                                                <Coins className="size-3 text-amber-400" />
                                                {cost} Pts
                                            </span>

                                            {/* Stock Badge */}
                                            {reward.stock > 0 ? (
                                                <span className="absolute top-2 right-2 rounded-full bg-emerald-600/90 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                                                    Tersedia
                                                </span>
                                            ) : (
                                                <span className="absolute top-2 right-2 rounded-full bg-zinc-700/90 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                                                    Habis
                                                </span>
                                            )}
                                        </div>

                                        {/* Content & Action */}
                                        <div className="p-3 flex flex-col justify-between flex-1 space-y-2">
                                            <div>
                                                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2 leading-tight">
                                                    {reward.name}
                                                </h4>
                                                <div className="mt-1 flex items-center justify-between text-[10px]">
                                                    {canAfford ? (
                                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                            Poin Cukup
                                                        </span>
                                                    ) : (
                                                        <span className="text-zinc-400 dark:text-zinc-500">
                                                            Kurang {(cost - loyalty.points).toLocaleString('id-ID')} Pts
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px]">
                                                <span className="font-bold text-red-600 dark:text-red-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                                                    Tukar Hadiah
                                                </span>
                                                <ChevronRight className="size-3 text-zinc-400 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Right Fade Overlay (appears when there is more content to scroll) */}
                        <div
                            className={`pointer-events-none absolute -right-1.5 sm:-right-2 top-0 bottom-0 w-5 sm:w-6 md:w-8 bg-gradient-to-l from-zinc-50 via-zinc-50/80 to-transparent dark:from-zinc-950 dark:via-zinc-950/80 dark:to-transparent z-10 transition-opacity duration-300 ${
                                canScrollRewardRight ? 'opacity-100' : 'opacity-0'
                            }`}
                            aria-hidden="true"
                        />
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 5. TIKET UNDIAN AKTIF (RAFFLE TICKETS)                                     */}
                {/* ========================================================================= */}
                <section id="undian" className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 p-4 dark:border-amber-900/40 dark:bg-gradient-to-r dark:from-amber-950/30 dark:to-orange-950/20">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500 text-white font-bold shadow-xs">
                                <Ticket className="size-5" />
                            </div>
                            <div>
                                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                                    Anda Memiliki {loyalty.raffleTickets.length} Tiket Undian Aktif
                                </h4>
                                <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                                    {loyalty.raffleTickets[0]?.period}
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-white/80 dark:bg-black/30 px-2 py-1 rounded-md border border-amber-300 dark:border-amber-800">
                                {loyalty.raffleTickets.map((t) => t.number).join(', ')}
                            </span>
                        </div>
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 6. MUTASI RIWAYAT POIN TERBARU (BRIEF SUMMARY)                            */}
                {/* ========================================================================= */}
                <section id="riwayat" className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <Clock className="size-4 text-red-600" />
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                                    Riwayat Poin Terakhir
                                </h3>
                                <p className="text-[11px] text-zinc-500">Ringkasan mutasi terbaru</p>
                            </div>
                        </div>
                        <Link
                            href="/history"
                            prefetch
                            className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors group"
                        >
                            <span>Lihat Semua</span>
                            <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>

                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                        {loyalty.transactions.slice(0, 3).map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between py-3.5">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`flex size-9 items-center justify-center rounded-xl ${tx.type === 'credit'
                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                                            }`}
                                    >
                                        {tx.type === 'credit' ? (
                                            <ArrowUpRight className="size-4.5" />
                                        ) : (
                                            <ArrowDownRight className="size-4.5" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white">
                                            {tx.title}
                                        </h4>
                                        <p className="text-[11px] text-zinc-400">
                                            {tx.dealer} &bull; {tx.date}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span
                                        className={`text-sm font-bold font-mono ${tx.type === 'credit'
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-rose-600 dark:text-rose-400'
                                            }`}
                                    >
                                        {tx.points > 0 ? `+${tx.points}` : tx.points} Poin
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
                        <Link
                            href="/history"
                            prefetch
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200/90 bg-zinc-50/80 py-2.5 text-xs font-semibold text-zinc-700 transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-300 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:hover:border-red-900/50"
                        >
                            <span>Buka Halaman Riwayat Lengkap & Rincian Transaksi</span>
                            <ChevronRight className="size-3.5" />
                        </Link>
                    </div>
                </section>
            </div>


            {/* ========================================================================= */}
            {/* MODAL PREVIEW DETAIL REWARD                                               */}
            {/* ========================================================================= */}
            <Dialog open={!!selectedReward} onOpenChange={(open) => !open && setSelectedReward(null)}>
                <DialogContent className="sm:max-w-md rounded-3xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                    {selectedReward && (
                        <>
                            <DialogHeader className="text-center space-y-1 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                                <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-600">
                                    Katalog Reward Honda
                                </span>
                                <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white">
                                    {selectedReward.name}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-zinc-500">
                                    Penukaran reward resmi di bengkel AHASS dan dealer resmi Honda
                                </DialogDescription>
                            </DialogHeader>

                            <div className="my-4 flex flex-col items-center text-center space-y-3">
                                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                                    <img
                                        src={selectedReward.image_url || selectedReward.image || '/images/pictures/merchandise_resmi_honda_img.jpg'}
                                        alt={selectedReward.name}
                                        className="h-full w-full object-cover object-center"
                                    />
                                    <span className="absolute top-2 left-2 rounded-full bg-black/70 backdrop-blur-md px-2.5 py-1 text-xs font-black text-amber-300 border border-white/20 shadow-xs flex items-center gap-1">
                                        <Coins className="size-3.5 text-amber-400" />
                                        {(selectedReward.points_cost ?? selectedReward.pointsCost ?? 0).toLocaleString('id-ID')} Poin
                                    </span>
                                </div>

                                <div className="w-full rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 p-3 text-left border border-zinc-100 dark:border-zinc-800">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-zinc-500">Ketersediaan Stok:</span>
                                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                            {selectedReward.stock > 0 ? `${selectedReward.stock} unit tersedia` : 'Stok Habis'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-zinc-500">Saldo Poin Anda:</span>
                                        <span className="font-bold font-mono text-red-600 dark:text-red-400">
                                            {loyalty.points.toLocaleString('id-ID')} Poin
                                        </span>
                                    </div>
                                </div>

                                <p className="text-xs text-zinc-600 dark:text-zinc-400 text-left leading-relaxed">
                                    {selectedReward.description || 'Tukarkan poin loyalty Anda untuk mendapatkan reward resmi Honda ini.'}
                                </p>
                            </div>

                            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSelectedReward(null)}
                                    className="w-full sm:w-auto rounded-xl text-xs"
                                >
                                    Tutup
                                </Button>
                                <Link
                                    href="/rewards"
                                    className="w-full sm:flex-1 inline-flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-10 px-4 transition-colors"
                                >
                                    <Gift className="size-3.5 mr-1.5" />
                                    Tukar di Halaman Rewards
                                </Link>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* MODAL ROADMAP & KETENTUAN LEVEL MEMBER                                     */}
            {/* ========================================================================= */}
            <Dialog open={showTierModal} onOpenChange={setShowTierModal}>
                <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                    <DialogHeader className="space-y-1 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Award className="size-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-black text-zinc-900 dark:text-white">
                                    Roadmap & Benefit Level Member
                                </DialogTitle>
                                <DialogDescription className="text-xs text-zinc-500">
                                    Ketentuan tingkatan keanggotaan berbasis akumulasi poin seumur hidup
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Member Status Summary Card */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 my-2">
                        <div>
                            <span className="text-[10px] text-zinc-500 font-medium block">Level Anda Saat Ini</span>
                            <span className="font-extrabold text-sm text-red-600 dark:text-red-400">
                                {loyalty.tier}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] text-zinc-500 font-medium block">Saldo Poin Aktif</span>
                            <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                {loyalty.points.toLocaleString('id-ID')} Poin
                            </span>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <span className="text-[10px] text-zinc-500 font-medium block">Total Poin Akumulasi</span>
                            <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                                {(loyalty.lifetimePoints ?? loyalty.points).toLocaleString('id-ID')} Pts
                            </span>
                        </div>
                    </div>

                    {/* Protection Guarantee Notice */}
                    <div className="p-3.5 rounded-2xl bg-red-50/80 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/40 text-xs text-red-900 dark:text-red-200 flex items-start gap-2.5">
                        <Shield className="size-4.5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-bold text-[11px] text-red-700 dark:text-red-300 uppercase tracking-wide">
                                Proteksi Level & Poin Akumulasi
                            </p>
                            <p className="text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                                Level member Anda dihitung secara permanen dari <strong>total akumulasi poin seumur hidup (Lifetime Points)</strong>.
                                Menukarkan saldo poin untuk voucher atau reward <strong>TIDAK AKAN MENGURANGI</strong> akumulasi poin ataupun menurunkan level keanggotaan Anda.
                            </p>
                        </div>
                    </div>

                    {/* Tier Ladder List */}
                    <div className="space-y-2.5 my-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                            Jenjang 5 Tingkat Keanggotaan
                        </h4>

                        {(loyalty.tierRoadmap || [
                            {
                                tier: 'Bronze',
                                name: 'Bronze Member',
                                minPoints: 0,
                                maxPoints: 499,
                                benefit: 'Akses perolehan poin rewards di seluruh AHASS dan dealer resmi Honda.',
                                visualStyles: {
                                    badge: 'BRONZE',
                                    color: '#B45309',
                                    bg: 'bg-amber-100 dark:bg-amber-950/40',
                                    border: 'border-amber-300 dark:border-amber-800',
                                    text: 'text-amber-800 dark:text-amber-300',
                                },
                                isReached: true,
                                isCurrent: loyalty.tier.toLowerCase().includes('bronze'),
                            },
                            {
                                tier: 'Silver',
                                name: 'Silver Member',
                                minPoints: 500,
                                maxPoints: 1499,
                                benefit: 'Akses katalog voucher oli MPX, diskon servis berkala, dan penukaran merchandise reguler.',
                                visualStyles: {
                                    badge: 'SILVER',
                                    color: '#64748B',
                                    bg: 'bg-slate-100 dark:bg-slate-900/40',
                                    border: 'border-slate-300 dark:border-slate-700',
                                    text: 'text-slate-700 dark:text-slate-300',
                                },
                                isReached: (loyalty.lifetimePoints ?? loyalty.points) >= 500,
                                isCurrent: loyalty.tier.toLowerCase().includes('silver'),
                            },
                            {
                                tier: 'Gold',
                                name: 'Gold Member',
                                minPoints: 1500,
                                maxPoints: 3499,
                                benefit: 'Prioritas booking servis AHASS, diskon suku cadang & aksesori resmi, serta voucher berkala.',
                                visualStyles: {
                                    badge: 'GOLD',
                                    color: '#D97706',
                                    bg: 'bg-yellow-100 dark:bg-yellow-950/40',
                                    border: 'border-yellow-400 dark:border-yellow-700',
                                    text: 'text-yellow-800 dark:text-yellow-300',
                                },
                                isReached: (loyalty.lifetimePoints ?? loyalty.points) >= 1500,
                                isCurrent: loyalty.tier.toLowerCase().includes('gold'),
                            },
                            {
                                tier: 'Platinum',
                                name: 'Platinum Member',
                                minPoints: 3500,
                                maxPoints: 6999,
                                benefit: 'Prioritas antrean servis AHASS, tiket undian ganda Hari Pelanggan, dan voucher spesial.',
                                visualStyles: {
                                    badge: 'PLATINUM',
                                    color: '#0891B2',
                                    bg: 'bg-cyan-100 dark:bg-cyan-950/40',
                                    border: 'border-cyan-300 dark:border-cyan-700',
                                    text: 'text-cyan-800 dark:text-cyan-300',
                                },
                                isReached: (loyalty.lifetimePoints ?? loyalty.points) >= 3500,
                                isCurrent: loyalty.tier.toLowerCase().includes('platinum'),
                            },
                            {
                                tier: 'Diamond',
                                name: 'Diamond Member',
                                minPoints: 7000,
                                maxPoints: null,
                                benefit: 'Layanan VIP AHASS, merchandise premium eksklusif Honda, dan undangan event tahunan.',
                                visualStyles: {
                                    badge: 'DIAMOND',
                                    color: '#7C3AED',
                                    bg: 'bg-purple-100 dark:bg-purple-950/40',
                                    border: 'border-purple-300 dark:border-purple-700',
                                    text: 'text-purple-800 dark:text-purple-300',
                                },
                                isReached: (loyalty.lifetimePoints ?? loyalty.points) >= 7000,
                                isCurrent: loyalty.tier.toLowerCase().includes('diamond'),
                            },
                        ]).map((tierItem) => {
                            const isCurrent = tierItem.isCurrent || loyalty.tier.toLowerCase().includes(tierItem.tier.toLowerCase());
                            const isReached = tierItem.isReached;

                            return (
                                <div
                                    key={tierItem.tier}
                                    className={`p-3.5 rounded-2xl border transition-all ${
                                        isCurrent
                                            ? 'border-red-500 bg-red-500/5 dark:bg-red-950/30 ring-1 ring-red-500/30'
                                            : isReached
                                              ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60'
                                              : 'border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 opacity-75'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                className={`text-[10px] font-extrabold px-2.5 py-0.5 border ${tierItem.visualStyles.bg} ${tierItem.visualStyles.text} ${tierItem.visualStyles.border}`}
                                            >
                                                {tierItem.visualStyles.badge}
                                            </Badge>
                                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                                {tierItem.name}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            {isCurrent ? (
                                                <Badge className="bg-red-600 text-white text-[9px] font-bold">
                                                    Level Anda
                                                </Badge>
                                            ) : isReached ? (
                                                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                    <Check className="size-3" />
                                                    Tercapai
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-mono text-zinc-500">
                                                    Min. {tierItem.minPoints.toLocaleString('id-ID')} Pts
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-2 flex items-baseline justify-between text-[11px] text-zinc-500">
                                        <span>
                                            Syarat Akumulasi: <strong>{tierItem.minPoints.toLocaleString('id-ID')}</strong>
                                            {tierItem.maxPoints !== null ? ` - ${tierItem.maxPoints.toLocaleString('id-ID')} Pts` : '+ Pts'}
                                        </span>
                                    </div>

                                    <p className="mt-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
                                        {tierItem.benefit}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            onClick={() => setShowTierModal(false)}
                            className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white font-semibold text-xs h-10"
                        >
                            Tutup Informasi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </CustomerLayout>
    );
}
