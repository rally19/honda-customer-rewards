import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity as ActivityIcon,
    ArrowRight,
    Award,
    Bike,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Coins,
    Crown,
    Database,
    Flame,
    Gift,
    HeartHandshake,
    Info,
    Layers,
    Lock,
    Mail,
    MapPin,
    Menu,
    Phone,
    QrCode,
    RefreshCw,
    Shield,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Star,
    Tag,
    TrendingUp,
    UserCheck,
    Users,
    Wrench,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ThemeToggle from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { login, register } from '@/routes';
import type { User } from '@/types';

type ActivityItem = {
    id: string;
    name: string;
    points: number;
    description: string;
};

type RewardItem = {
    id: string;
    name: string;
    description: string;
    image: string;
    points: number;
    stock: number;
};

type MemberTierItem = {
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
};

type SimulationActivityItem = {
    id: string;
    name: string;
    points: number;
};

type HomeStats = {
    totalMembers: number;
    totalActivities: number;
    totalRewards: number;
    totalPointsCirculated: number;
};

type PageProps = {
    auth: {
        user: User | null;
    };
    activities?: ActivityItem[];
    totalActivitiesCount?: number;
    rewards?: RewardItem[];
    totalRewardsCount?: number;
    stats?: HomeStats;
    tiers?: MemberTierItem[];
    simulationActivities?: SimulationActivityItem[];
};

// Hero Carousel Posters
const HERO_SLIDES = [
    {
        image: '/images/pictures/poster_hero_1.jpg',
        title: 'Honda Customer Rewards',
        subtitle: 'Semakin Aktif Bersama Honda, Semakin Banyak Hadiahnya',
        description: 'Setiap servis di AHASS dan pembelian suku cadang asli kini berbuah poin loyalitas bernilai tinggi.',
        badge: 'Program Loyalitas Resmi',
    },
    {
        image: '/images/pictures/poster_hero_2.jpg',
        title: 'Layanan Terbaik AHASS',
        subtitle: 'Perawatan Maksimal, Hadiah Melimpah',
        description: 'Dapatkan poin berlipat ganda untuk perawatan berkala motor kesayangan Anda dengan mekanik tersertifikasi.',
        badge: 'Spesial Servis Rutin',
    },
    {
        image: '/images/pictures/poster_hero_3.jpg',
        title: 'Tukarkan Poin dengan Hadiah Menarik',
        subtitle: 'Dari Oli Gratis Hingga Voucher Servis & Motor Baru',
        description: 'Kumpulkan poin Anda dan pilih langsung reward favorit dari katalog eksklusif dealer & AHASS resmi.',
        badge: 'Hadiah & Merchandise Asli',
    },
];

// Fallback Default 5 Tiers
const DEFAULT_TIERS: MemberTierItem[] = [
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
    },
    {
        tier: 'Platinum',
        name: 'Platinum Member',
        minPoints: 3500,
        maxPoints: 6999,
        benefit: 'Prioritas antrean servis AHASS (Fast Lane), tiket undian ganda Hari Pelanggan, dan voucher spesial.',
        visualStyles: {
            badge: 'PLATINUM',
            color: '#0891B2',
            bg: 'bg-cyan-100 dark:bg-cyan-950/40',
            border: 'border-cyan-300 dark:border-cyan-700',
            text: 'text-cyan-800 dark:text-cyan-300',
        },
    },
    {
        tier: 'Diamond',
        name: 'Diamond Member',
        minPoints: 7000,
        maxPoints: null,
        benefit: 'Layanan VIP AHASS, merchandise premium eksklusif Honda, dan undangan khusus event otomotif tahunan.',
        visualStyles: {
            badge: 'DIAMOND',
            color: '#7C3AED',
            bg: 'bg-purple-100 dark:bg-purple-950/40',
            border: 'border-purple-300 dark:border-purple-700',
            text: 'text-purple-800 dark:text-purple-300',
        },
    },
];

// Helper: dynamic icon selector for activities
const getActivityIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('servis') || n.includes('ahass') || n.includes('oli')) return Wrench;
    if (n.includes('part') || n.includes('suku cadang') || n.includes('aksesori')) return ShoppingBag;
    if (n.includes('beli motor') || n.includes('unit')) return Bike;
    if (n.includes('event') || n.includes('pameran')) return Calendar;
    if (n.includes('test') || n.includes('ride')) return Zap;
    if (n.includes('referral') || n.includes('teman') || n.includes('keluarga') || n.includes('ajak')) return Users;
    if (n.includes('ulasan') || n.includes('review') || n.includes('penilaian') || n.includes('bintang')) return Star;
    return Award;
};

// Helper: dynamic category label for activities
const getActivityMeta = (name: string): { category: string; highlight: string } => {
    const n = name.toLowerCase();
    if (n.includes('servis') || n.includes('ahass')) {
        return { category: 'Perawatan Berkala', highlight: 'Bengkel Resmi AHASS' };
    }
    if (n.includes('part') || n.includes('suku cadang') || n.includes('aksesori')) {
        return { category: 'Suku Cadang Asli', highlight: 'Honda Genuine Parts' };
    }
    if (n.includes('beli motor') || n.includes('unit')) {
        return { category: 'Pembelian Unit', highlight: 'Dealer Resmi Honda' };
    }
    if (n.includes('event') || n.includes('pameran')) {
        return { category: 'Kegiatan Dealer', highlight: 'Showroom & Event' };
    }
    if (n.includes('test') || n.includes('ride')) {
        return { category: 'Sensasi Berkendara', highlight: 'Test Ride Resmi' };
    }
    if (n.includes('referral') || n.includes('teman') || n.includes('keluarga') || n.includes('ajak')) {
        return { category: 'Program Rekomendasi', highlight: 'Referral Pembelian' };
    }
    if (n.includes('ulasan') || n.includes('review') || n.includes('penilaian')) {
        return { category: 'Ulasan Pelanggan', highlight: 'Feedback Layanan' };
    }
    return { category: 'Aktivitas Resmi', highlight: 'Poin Langsung Masuk' };
};

// Helper: dynamic category classification for rewards
const getRewardCategory = (name: string): { key: 'servis' | 'aksesori' | 'spesial'; label: string } => {
    const n = name.toLowerCase();
    if (n.includes('servis') || n.includes('oli')) {
        return { key: 'servis', label: 'Layanan Servis & Oli' };
    }
    if (n.includes('aksesori') || n.includes('merchandise') || n.includes('jaket') || n.includes('apparel')) {
        return { key: 'aksesori', label: 'Produk & Aksesori' };
    }
    return { key: 'spesial', label: 'Hadiah Spesial & Undian' };
};

export default function Welcome({
    activities = [],
    totalActivitiesCount = 0,
    rewards = [],
    totalRewardsCount = 0,
    stats,
    tiers = [],
    simulationActivities = [],
}: PageProps) {
    const { auth } = usePage<{ auth: { user: User | null } }>().props;
    const dashboardUrl = auth.user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';

    // State Hero Carousel
    const [currentSlide, setCurrentSlide] = useState(0);

    // State Mobile Menu
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // State Filter Katalog Reward
    const [catalogFilter, setCatalogFilter] = useState<'semua' | 'servis' | 'aksesori' | 'spesial'>('semua');

    // State Simulasi Poin (menggunakan data riil dari DB)
    const activeSimList = simulationActivities.length > 0 ? simulationActivities : activities;
    const [selectedSimItems, setSelectedSimItems] = useState<string[]>(() => {
        return activeSimList.slice(0, 3).map((item) => item.id);
    });

    useEffect(() => {
        if (activeSimList.length > 0 && selectedSimItems.length === 0) {
            setSelectedSimItems(activeSimList.slice(0, 3).map((item) => item.id));
        }
    }, [activeSimList]);

    // Carousel Autoplay
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
    };

    // Filter katalog reward
    const filteredRewards = useMemo(() => {
        if (catalogFilter === 'semua') return rewards;
        return rewards.filter((item) => getRewardCategory(item.name).key === catalogFilter);
    }, [rewards, catalogFilter]);

    // Hitung total simulasi poin
    const totalSimulatedPoints = useMemo(() => {
        return activeSimList
            .filter((item) => selectedSimItems.includes(item.id))
            .reduce((sum, item) => sum + item.points, 0);
    }, [activeSimList, selectedSimItems]);

    const toggleSimItem = (id: string) => {
        setSelectedSimItems((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const effectiveTiers = tiers.length > 0 ? tiers : DEFAULT_TIERS;

    return (
        <div className="min-h-screen bg-white text-zinc-900 antialiased selection:bg-red-600 selection:text-white dark:bg-zinc-950 dark:text-zinc-100">
            <Head title="Honda Customer Rewards - Program Loyalitas Resmi Dealer & Bengkel AHASS">
                <meta
                    name="description"
                    content="Semakin aktif bersama Honda, semakin banyak hadiahnya. Kumpulkan poin loyalitas dari servis berkala AHASS, pembelian suku cadang asli, dan nikmati hadiah eksklusif."
                />
            </Head>

            {/* ========================================================================= */}
            {/* 1. HEADER (NAVIGASI ATAS)                                                 */}
            {/* ========================================================================= */}
            <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/95 backdrop-blur-md transition-colors dark:border-zinc-800/80 dark:bg-zinc-950/90">
                <div className="mx-auto flex h-18 lg:h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    {/* Brand Logo */}
                    <a href="#beranda" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
                        <div className="relative flex h-10 lg:h-12 items-center justify-center">
                            <img
                                src="/images/logo/anper_logo_red.png"
                                alt="Honda Customer Rewards"
                                className="h-8 sm:h-9 lg:h-10 w-auto object-contain dark:hidden transition-transform group-hover:scale-105"
                            />
                            <img
                                src="/images/logo/anper_logo_white.png"
                                alt="Honda Customer Rewards"
                                className="hidden h-8 sm:h-9 lg:h-10 w-auto object-contain dark:block transition-transform group-hover:scale-105"
                            />
                        </div>
                        <div className="border-l border-zinc-300 dark:border-zinc-700 pl-2.5 sm:pl-3">
                            <span className="block text-[10px] sm:text-[11px] lg:text-xs font-extrabold tracking-wider text-red-600 dark:text-red-500 uppercase whitespace-nowrap leading-tight">
                                Customer Rewards
                            </span>
                            <span className="block text-[9px] sm:text-[10px] lg:text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap leading-tight">
                                Dealer & AHASS Resmi
                            </span>
                        </div>
                    </a>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden lg:flex items-center gap-4 xl:gap-6 2xl:gap-7 text-[13px] xl:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        <a
                            href="#beranda"
                            className="whitespace-nowrap transition-colors hover:text-red-600 dark:hover:text-red-400"
                        >
                            Beranda
                        </a>
                        <a
                            href="#cara-poin"
                            className="whitespace-nowrap transition-colors hover:text-red-600 dark:hover:text-red-400"
                        >
                            Cara Dapat Poin
                        </a>
                        <a
                            href="#katalog-hadiah"
                            className="whitespace-nowrap transition-colors hover:text-red-600 dark:hover:text-red-400"
                        >
                            Katalog Hadiah
                        </a>
                        <a
                            href="#tier-member"
                            className="whitespace-nowrap transition-colors hover:text-red-600 dark:hover:text-red-400"
                        >
                            Tingkatan Member
                        </a>
                        <a
                            href="#cara-kerja"
                            className="whitespace-nowrap transition-colors hover:text-red-600 dark:hover:text-red-400"
                        >
                            Cara Kerja
                        </a>
                        <a
                            href="#tentang"
                            className="whitespace-nowrap transition-colors hover:text-red-600 dark:hover:text-red-400"
                        >
                            Tentang Program
                        </a>
                        <a
                            href="#kontak"
                            className="whitespace-nowrap transition-colors hover:text-red-600 dark:hover:text-red-400"
                        >
                            Kontak AHASS
                        </a>
                    </nav>

                    {/* Right Controls: Theme Toggle + Auth Buttons */}
                    <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
                        <ThemeToggle />

                        {auth.user ? (
                            <Link
                                href={dashboardUrl}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 xl:px-5 xl:py-2.5 text-xs xl:text-sm font-semibold text-white shadow-md shadow-red-600/20 transition-all hover:bg-red-700 active:scale-95 whitespace-nowrap"
                            >
                                <Sparkles className="size-4" />
                                <span>Buka Dashboard</span>
                            </Link>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href={login()}
                                    className="rounded-xl px-3 py-2 text-xs xl:text-sm font-medium text-zinc-700 hover:text-red-600 dark:text-zinc-300 dark:hover:text-white transition-colors whitespace-nowrap"
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href={register()}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs xl:text-sm font-semibold text-white shadow-md shadow-red-600/20 transition-all hover:bg-red-700 active:scale-95 whitespace-nowrap"
                                >
                                    <span>Daftar ID Member</span>
                                    <ArrowRight className="size-3.5" />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button & Theme Toggle */}
                    <div className="flex items-center gap-2 lg:hidden">
                        <ThemeToggle />
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-xl border border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
                            aria-label="Buka navigasi"
                        >
                            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Drawer */}
                {mobileMenuOpen && (
                    <div className="lg:hidden border-b border-zinc-200 bg-white px-4 py-5 dark:border-zinc-800 dark:bg-zinc-950">
                        <nav className="flex flex-col gap-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            <a
                                href="#beranda"
                                onClick={() => setMobileMenuOpen(false)}
                                className="py-2 border-b border-zinc-100 dark:border-zinc-900 hover:text-red-600"
                            >
                                Beranda
                            </a>
                            <a
                                href="#cara-poin"
                                onClick={() => setMobileMenuOpen(false)}
                                className="py-2 border-b border-zinc-100 dark:border-zinc-900 hover:text-red-600"
                            >
                                Cara Dapat Poin
                            </a>
                            <a
                                href="#katalog-hadiah"
                                onClick={() => setMobileMenuOpen(false)}
                                className="py-2 border-b border-zinc-100 dark:border-zinc-900 hover:text-red-600"
                            >
                                Katalog Hadiah
                            </a>
                            <a
                                href="#tier-member"
                                onClick={() => setMobileMenuOpen(false)}
                                className="py-2 border-b border-zinc-100 dark:border-zinc-900 hover:text-red-600"
                            >
                                Tingkatan Member
                            </a>
                            <a
                                href="#cara-kerja"
                                onClick={() => setMobileMenuOpen(false)}
                                className="py-2 border-b border-zinc-100 dark:border-zinc-900 hover:text-red-600"
                            >
                                Cara Kerja
                            </a>
                            <a
                                href="#tentang"
                                onClick={() => setMobileMenuOpen(false)}
                                className="py-2 border-b border-zinc-100 dark:border-zinc-900 hover:text-red-600"
                            >
                                Tentang Program
                            </a>
                            <a
                                href="#kontak"
                                onClick={() => setMobileMenuOpen(false)}
                                className="py-2 border-b border-zinc-100 dark:border-zinc-900 hover:text-red-600"
                            >
                                Hubungi Dealer
                            </a>
                        </nav>
                        <div className="mt-5 flex flex-col gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                            {auth.user ? (
                                <Link
                                    href={dashboardUrl}
                                    className="w-full text-center rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white shadow-md"
                                >
                                    Buka Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="w-full text-center rounded-xl border border-zinc-300 py-2.5 text-sm font-semibold text-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                                    >
                                        Masuk ke Akun
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="w-full text-center rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-600/30"
                                    >
                                        Daftar & Dapatkan ID MEMBER
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* ========================================================================= */}
            {/* 2. HERO BANNER SECTION (SPANDUK UTAMA DENGAN SLIDER)                     */}
            {/* ========================================================================= */}
            <section id="beranda" className="relative overflow-hidden pt-6 pb-16 lg:pt-12 lg:pb-24">
                {/* Background Ambient Glow */}
                <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-red-600/10 dark:bg-red-600/15 blur-[140px] rounded-full" />

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
                        {/* Text Content Column */}
                        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50/80 px-3.5 py-1.5 text-xs font-semibold text-red-700 backdrop-blur-sm dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-400">
                                <Flame className="size-4 text-red-600 animate-pulse" />
                                <span>Program Loyalitas Resmi Dealer & Bengkel AHASS</span>
                            </div>

                            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl xl:text-6xl text-zinc-950 dark:text-white leading-[1.15]">
                                Honda Customer{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-500 to-rose-600">
                                    Rewards
                                </span>
                            </h1>

                            <p className="text-xl font-medium text-zinc-800 dark:text-zinc-200 italic">
                                &ldquo;Semakin Aktif Bersama Honda, Semakin Banyak Hadiahnya&rdquo;
                            </p>

                            <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                                Bergabunglah dengan program loyalitas digital kami dan nikmati berbagai keuntungan eksklusif
                                dari setiap aktivitas Anda bersama Honda. Servis rutin di AHASS, pembelian suku cadang asli,
                                hingga pembelian unit motor kini bernilai poin yang siap ditukar.
                            </p>

                            {/* CTA Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                                {auth.user ? (
                                    <Link
                                        href={dashboardUrl}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-red-600 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-red-600/30 transition-all hover:bg-red-700 hover:shadow-red-600/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                                    >
                                        <Sparkles className="size-5" />
                                        <span>Buka Dashboard Member</span>
                                    </Link>
                                ) : (
                                    <Link
                                        href={register()}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-red-600 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-red-600/30 transition-all hover:bg-red-700 hover:shadow-red-600/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                                    >
                                        <Sparkles className="size-5" />
                                        <span>Daftar Sekarang & Dapatkan ID MEMBER</span>
                                    </Link>
                                )}

                                <a
                                    href="#cara-kerja"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white/80 px-6 py-3.5 text-base font-semibold text-zinc-800 backdrop-blur-sm transition-all hover:bg-zinc-100 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800 active:scale-95"
                                >
                                    <span>Pelajari Cara Kerja</span>
                                </a>
                            </div>

                            {/* Live System Stats from DB */}
                            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-zinc-200 dark:border-zinc-800 text-left">
                                <div className="space-y-1 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
                                    <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold text-xs">
                                        <Users className="size-3.5" />
                                        <span>Total Member</span>
                                    </div>
                                    <div className="text-base font-black text-zinc-900 dark:text-white">
                                        {stats?.totalMembers ?? 0} <span className="text-[11px] font-normal text-zinc-500">Anggota</span>
                                    </div>
                                </div>
                                <div className="space-y-1 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
                                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                        <Wrench className="size-3.5" />
                                        <span>Layanan Poin</span>
                                    </div>
                                    <div className="text-base font-black text-zinc-900 dark:text-white">
                                        {stats?.totalActivities ?? 7} <span className="text-[11px] font-normal text-zinc-500">Aktivitas</span>
                                    </div>
                                </div>
                                <div className="space-y-1 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
                                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs">
                                        <Gift className="size-3.5" />
                                        <span>Katalog Hadiah</span>
                                    </div>
                                    <div className="text-base font-black text-zinc-900 dark:text-white">
                                        {stats?.totalRewards ?? 6} <span className="text-[11px] font-normal text-zinc-500">Pilihan</span>
                                    </div>
                                </div>
                                <div className="space-y-1 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
                                    <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold text-xs">
                                        <Layers className="size-3.5" />
                                        <span>Level Tier</span>
                                    </div>
                                    <div className="text-base font-black text-zinc-900 dark:text-white">
                                        5 <span className="text-[11px] font-normal text-zinc-500">Tingkatan</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Banner Slider Column */}
                        <div className="lg:col-span-6 relative">
                            <div className="relative mx-auto max-w-lg lg:max-w-none rounded-3xl overflow-hidden border-2 border-red-500/20 shadow-2xl shadow-red-600/15 bg-zinc-900">
                                {/* Slide Image Container */}
                                <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden">
                                    {HERO_SLIDES.map((slide, idx) => (
                                        <div
                                            key={idx}
                                            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                                                idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                                            }`}
                                        >
                                            <img
                                                src={slide.image}
                                                alt={slide.title}
                                                className="h-full w-full object-cover object-center"
                                            />
                                            {/* Gradient Overlay for Text Readability */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                                             {/* Slide Caption */}
                                            <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 text-white space-y-2">
                                                <span className="inline-block rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
                                                    {slide.badge}
                                                </span>
                                                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                                                    {slide.subtitle}
                                                </h3>
                                                <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2">
                                                    {slide.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Slider Navigation Arrows */}
                                <button
                                    type="button"
                                    onClick={prevSlide}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-all hover:bg-red-600 hover:scale-105 active:scale-95"
                                    aria-label="Slide sebelumnya"
                                >
                                    <ChevronLeft className="size-6" />
                                </button>
                                <button
                                    type="button"
                                    onClick={nextSlide}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-all hover:bg-red-600 hover:scale-105 active:scale-95"
                                    aria-label="Slide berikutnya"
                                >
                                    <ChevronRight className="size-6" />
                                </button>

                                {/* Slider Dot Indicators */}
                                <div className="absolute bottom-3 right-6 z-20 flex items-center gap-2">
                                    {HERO_SLIDES.map((_, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setCurrentSlide(idx)}
                                            className={`h-2 rounded-full transition-all ${
                                                idx === currentSlide
                                                    ? 'w-7 bg-red-500'
                                                    : 'w-2 bg-white/50 hover:bg-white'
                                            }`}
                                            aria-label={`Pindah ke slide ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 3. TENTANG PROGRAM (MENGAPA HARUS BERGABUNG?)                             */}
            {/* ========================================================================= */}
            <section id="tentang" className="py-20 bg-zinc-50 border-y border-zinc-200/80 dark:bg-zinc-900/40 dark:border-zinc-800/80">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center space-y-4">
                        <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400">
                            Mengapa Harus Bergabung?
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
                            Apresiasi Istimewa untuk Pelanggan Setia Honda
                        </h2>
                        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Program inovasi <strong>Honda Customer Rewards</strong> dirancang secara digital untuk memberikan
                            pengalaman menarik melalui sistem akumulasi poin dan hadiah langsung, demi mengapresiasi setiap
                            kesetiaan Anda dalam merawat dan mempercayakan kendaraan Anda bersama dealer dan AHASS resmi.
                        </p>
                    </div>

                    {/* 4 Keunggulan Utama */}
                    <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="relative rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs transition-all hover:shadow-md hover:border-red-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-900/60">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 mb-5">
                                <HeartHandshake className="size-6" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                                Apresiasi Nyata
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                Setiap servis berkala, ganti oli, dan pembelian suku cadang resmi di AHASS langsung menghasilkan poin reward yang dapat dibelanjakan.
                            </p>
                        </div>

                        <div className="relative rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-red-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-900/60">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 mb-5">
                                <QrCode className="size-6" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                                Terintegrasi Scanner AHASS
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                Cukup tunjukkan kartu QR Member digital dari ponsel Anda ke kasir AHASS saat pembayaran untuk penambahan poin seketika.
                            </p>
                        </div>

                        <div className="relative rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-red-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-900/60">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 mb-5">
                                <TrendingUp className="size-6" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                                Tier Tidak Pernah Turun
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                Poin seumur hidup (<code className="font-mono text-xs font-bold">lifetime_points</code>) bersifat permanen. Level Anda tetap terjaga meski saldo poin aktif ditukarkan.
                            </p>
                        </div>

                        <div className="relative rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-red-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-900/60">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 mb-5">
                                <ShieldCheck className="size-6" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                                Transaksi Aman & Terverifikasi
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                Dilindungi transaksi database atomik (ACID), verifikasi email wajib, serta autentikasi ganda 2FA untuk integritas saldo poin Anda.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 4. CARA MENGUMPULKAN POIN (DATA DARI DB - TOP 6)                           */}
            {/* ========================================================================= */}
            <section id="cara-poin" className="py-20 bg-white dark:bg-zinc-950">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center space-y-4">
                        <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400">
                            Aktivitas Resmi AHASS & Dealer
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
                            Cara Mudah Mengumpulkan Poin
                        </h2>
                        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Kumpulkan poin dari setiap perawatan kendaraan dan aktivitas resmi Anda bersama bengkel resmi AHASS.
                            Berikut adalah 6 aktivitas terpopuler yang langsung menghasilkan poin reward:
                        </p>
                    </div>

                    {/* Grid Top 6 Activities dari Database */}
                    <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activities.map((act) => {
                            const IconComp = getActivityIcon(act.name);
                            const meta = getActivityMeta(act.name);
                            return (
                                <div
                                    key={act.id}
                                    className="group relative rounded-2xl border border-zinc-200/80 bg-white p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-red-500/50 hover:shadow-xl hover:shadow-red-600/5 dark:border-zinc-800 dark:bg-zinc-900/70 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-4 mb-5">
                                            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/40 group-hover:scale-110 transition-transform">
                                                <IconComp className="size-6" />
                                            </div>
                                            <span className="rounded-full bg-red-600 px-3.5 py-1 text-xs font-black text-white shadow-sm shadow-red-600/30">
                                                +{act.points} POIN
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                                {meta.category} &bull; {meta.highlight}
                                            </span>
                                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                                {act.name}
                                            </h3>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                                {act.description || 'Layanan resmi berkualitas Honda di seluruh bengkel AHASS dengan mekanik tersertifikasi.'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                            <CheckCircle2 className="size-3.5" /> Poin Otomatis Masuk
                                        </span>
                                        <span className="font-mono text-[11px] text-zinc-400">ID: #{act.id.slice(-4)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Banner CTA jika aktivitas > 6 atau ajakan membuka detail lengkap */}
                    <div className="mt-12 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="space-y-2 text-center sm:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-red-600/20 text-red-400 border border-red-500/30">
                                <Wrench className="size-3.5" />
                                <span>Tersedia {totalActivitiesCount} Aktivitas Resmi di Jaringan AHASS</span>
                            </div>
                            <h4 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                                Ingin Melihat Seluruh Aktivitas & Riwayat Servis Anda?
                            </h4>
                            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl">
                                Masuk ke dashboard akun untuk memantau akumulasi poin, rincian pekerjaan servis di bengkel, dan katalog reward yang siap ditukarkan.
                            </p>
                        </div>
                        <div className="shrink-0">
                            {auth.user ? (
                                <Link
                                    href="/activities"
                                    className="whitespace-nowrap rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-red-600/30 hover:bg-red-700 transition-all active:scale-95 inline-flex items-center gap-2"
                                >
                                    <span>Lihat Semua Aktivitas di Dashboard</span>
                                    <ArrowRight className="size-4" />
                                </Link>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <Link
                                        href={login()}
                                        className="w-full sm:w-auto text-center rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition-all"
                                    >
                                        Masuk Akun
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="w-full sm:w-auto text-center rounded-xl bg-red-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-red-600/30 hover:bg-red-700 transition-all inline-flex items-center justify-center gap-1.5"
                                    >
                                        <span>Daftar Sekarang</span>
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 5. KATALOG HADIAH (PENUKARAN POIN - DATA DARI DB TOP 6)                   */}
            {/* ========================================================================= */}
            <section id="katalog-hadiah" className="py-20 bg-zinc-50 border-t border-zinc-200/80 dark:bg-zinc-900/30 dark:border-zinc-800/80">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center space-y-4">
                        <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400">
                            Reward Eksklusif Honda
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
                            Katalog Hadiah Penukaran Poin
                        </h2>
                        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Tukarkan saldo poin aktif Anda dengan berbagai hadiah menarik berstandar pabrikan resmi Honda.
                            Klaim dapat dilakukan secara mandiri di web/aplikasi dan diambil langsung di counter kasir AHASS.
                        </p>

                        {/* Filter Tabs */}
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                            {(
                                [
                                    { key: 'semua', label: 'Semua Hadiah' },
                                    { key: 'servis', label: 'Layanan Servis & Oli' },
                                    { key: 'aksesori', label: 'Produk & Aksesori' },
                                    { key: 'spesial', label: 'Hadiah Spesial & Undian' },
                                ] as const
                            ).map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setCatalogFilter(tab.key)}
                                    className={`rounded-full px-5 py-2 text-xs font-bold transition-all cursor-pointer ${
                                        catalogFilter === tab.key
                                            ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
                                            : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rewards Grid dari Database (Top 6) */}
                    <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredRewards.map((reward) => {
                            const meta = getRewardCategory(reward.name);
                            return (
                                <div
                                    key={reward.id}
                                    className="group flex flex-col rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-red-400 dark:border-zinc-800 dark:bg-zinc-900"
                                >
                                    {/* Image Container */}
                                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                        <img
                                            src={reward.image}
                                            alt={reward.name}
                                            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                        <div className="absolute top-3 left-3">
                                            <span className="rounded-md bg-zinc-900/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white">
                                                {meta.label}
                                            </span>
                                        </div>
                                        <div className="absolute top-3 right-3">
                                            <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white shadow-md shadow-red-600/40">
                                                {reward.points} POIN
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex flex-1 flex-col justify-between p-6 space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] font-bold px-2 py-0.5 ${
                                                        reward.stock > 0
                                                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                            : 'border-zinc-300 bg-zinc-100 text-zinc-600'
                                                    }`}
                                                >
                                                    {reward.stock > 0 ? `Tersedia (${reward.stock} Unit)` : 'Stok Habis'}
                                                </Badge>
                                                <span className="text-[11px] text-zinc-400 font-mono">Kode: #{reward.id.slice(-4)}</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                                {reward.name}
                                            </h3>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                                {reward.description || 'Hadiah resmi Honda terstandarisasi yang siap ditukarkan di seluruh jaringan AHASS.'}
                                            </p>
                                        </div>

                                        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                Ambil di Dealer / AHASS
                                            </span>
                                            {auth.user ? (
                                                <Link
                                                    href="/rewards"
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                                >
                                                    <span>Tukar di Dashboard</span>
                                                    <ChevronRight className="size-3.5" />
                                                </Link>
                                            ) : (
                                                <Link
                                                    href={register()}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                                >
                                                    <span>Daftar & Klaim</span>
                                                    <ChevronRight className="size-3.5" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Banner ajakan jika ada lebih banyak reward */}
                    <div className="mt-12 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="size-14 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center shrink-0">
                                <Gift className="size-7" />
                            </div>
                            <div className="space-y-1 text-center sm:text-left">
                                <h4 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
                                    {totalRewardsCount > 6 ? `Tersedia ${totalRewardsCount} Pilihan Hadiah Reward di Sistem` : 'Katalog Reward Lengkap Siap Ditukarkan'}
                                </h4>
                                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                                    Login ke akun Anda untuk memilih reward, memverifikasi ketersediaan stok, dan mengambil voucher di counter AHASS.
                                </p>
                            </div>
                        </div>

                        <div className="shrink-0">
                            {auth.user ? (
                                <Link
                                    href="/rewards"
                                    className="whitespace-nowrap rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-red-600/30 hover:bg-red-700 transition-all active:scale-95 inline-flex items-center gap-2"
                                >
                                    <span>Buka Katalog Reward</span>
                                    <ArrowRight className="size-4" />
                                </Link>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={login()}
                                        className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-5 py-2.5 text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                                    >
                                        Masuk
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="rounded-xl bg-red-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-red-600/30 hover:bg-red-700 transition-all inline-flex items-center gap-1.5"
                                    >
                                        <span>Daftar Akun</span>
                                        <ArrowRight className="size-3.5" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 6. ROADMAP 5 TINGKATAN MEMBER (MEMBER TIER RESMI HONDA)                   */}
            {/* ========================================================================= */}
            <section id="tier-member" className="py-20 bg-white dark:bg-zinc-950 border-t border-zinc-200/80 dark:border-zinc-800/80">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center space-y-4">
                        <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400">
                            Tingkatan Loyalitas Member
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
                            5 Tingkatan Member (Member Tier Roadmap)
                        </h2>
                        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Tingkat keanggotaan dihitung otomatis dari akumulasi total poin seumur hidup (<code className="font-mono text-xs font-bold">lifetime_points</code>).
                            Semakin sering Anda merawat motor di AHASS, semakin tinggi privilese yang Anda dapatkan.
                        </p>
                    </div>

                    {/* 5 Tier Cards Grid */}
                    <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {effectiveTiers.map((tierItem, idx) => (
                            <div
                                key={tierItem.tier}
                                className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col justify-between space-y-4 hover:border-red-400 hover:shadow-md transition-all"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${tierItem.visualStyles.bg} ${tierItem.visualStyles.text} ${tierItem.visualStyles.border}`}>
                                            {tierItem.tier === 'Diamond' ? (
                                                <Crown className="size-3" />
                                            ) : tierItem.tier === 'Platinum' ? (
                                                <Sparkles className="size-3" />
                                            ) : tierItem.tier === 'Gold' ? (
                                                <Award className="size-3" />
                                            ) : (
                                                <Shield className="size-3" />
                                            )}
                                            {tierItem.visualStyles.badge}
                                        </span>
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Level {idx + 1}</span>
                                    </div>

                                    <div>
                                        <div className="text-lg font-black text-zinc-900 dark:text-white">
                                            {tierItem.maxPoints !== null
                                                ? `${tierItem.minPoints.toLocaleString('id-ID')} – ${tierItem.maxPoints.toLocaleString('id-ID')}`
                                                : `≥ ${tierItem.minPoints.toLocaleString('id-ID')}`}{' '}
                                            <span className="text-xs font-semibold text-zinc-500">Pts</span>
                                        </div>
                                        <div className="text-xs font-bold text-red-600 dark:text-red-400 mt-0.5">
                                            {tierItem.name}
                                        </div>
                                    </div>

                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        {tierItem.benefit}
                                    </p>
                                </div>

                                <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-800 text-[11px] text-zinc-400 font-medium">
                                    {idx === 0
                                        ? 'Tier awal registrasi akun'
                                        : `Akumulasi min. ${tierItem.minPoints.toLocaleString('id-ID')} Poin`}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Highlight Box: Retensi Tier */}
                    <div className="mt-8 p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3.5">
                        <Info className="size-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                            <strong>Prinsip Retensi Level Permanen:</strong> Tingkatan member dihitung secara absolut dari akumulasi total poin seumur hidup (<code className="font-mono font-bold">lifetime_points</code>). Ketika Anda menukarkan poin reward untuk voucher atau merchandise, saldo yang berkurang hanyalah <strong>Saldo Poin Aktif</strong> (<code className="font-mono font-bold">points</code>). <em>Tingkat Member Anda tidak akan pernah turun!</em>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 7. CARA KERJA (4 LANGKAH MUDAH SESUAI SISTEM SEKARANG)                    */}
            {/* ========================================================================= */}
            <section id="cara-kerja" className="py-20 bg-zinc-50 border-t border-zinc-200/80 dark:bg-zinc-900/40 dark:border-zinc-800/80">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center space-y-4">
                        <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400">
                            Alur Program AHASS
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
                            4 Langkah Mudah Menikmati Hadiah
                        </h2>
                        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Bergabung dan mengumpulkan poin sangatlah praktis. Cukup 4 langkah sederhana dari pendaftaran hingga penyerahan hadiah di AHASS.
                        </p>
                    </div>

                    <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Step 1 */}
                        <div className="relative flex flex-col justify-between p-6 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-red-600 text-white font-black text-lg shadow-md shadow-red-600/30">
                                        1
                                    </div>
                                    <span className="text-xs font-bold text-zinc-400">Langkah 1</span>
                                </div>
                                <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
                                    Daftar & Miliki ID MEMBER Digital
                                </h3>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    Pelanggan mendaftar secara online dan memverifikasi email untuk langsung mendapatkan Kartu Digital ID Member 10-digit beserta QR scanner pribadi.
                                </p>
                            </div>
                            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-red-600 dark:text-red-400">
                                Gratis & Otomatis Aktif
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative flex flex-col justify-between p-6 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-red-600 text-white font-black text-lg shadow-md shadow-red-600/30">
                                        2
                                    </div>
                                    <span className="text-xs font-bold text-zinc-400">Langkah 2</span>
                                </div>
                                <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
                                    Servis & Transaksi di AHASS
                                </h3>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    Kunjungi bengkel resmi AHASS atau dealer Honda untuk servis berkala, ganti oli MPX/SPX, pembelian suku cadang asli HGP, atau unit motor baru.
                                </p>
                            </div>
                            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-red-600 dark:text-red-400">
                                Sesuai Standar Pabrikan
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative flex flex-col justify-between p-6 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-red-600 text-white font-black text-lg shadow-md shadow-red-600/30">
                                        3
                                    </div>
                                    <span className="text-xs font-bold text-zinc-400">Langkah 3</span>
                                </div>
                                <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
                                    Pindai QR Kasir & Kredit Poin
                                </h3>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    Tunjukkan QR ID Member ke kasir AHASS saat pembayaran. Staf memindai QR Anda dan poin aktif beserta poin akumulasi langsung terkreditkan secara real-time.
                                </p>
                            </div>
                            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-red-600 dark:text-red-400">
                                Poin Langsung Masuk
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="relative flex flex-col justify-between p-6 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-red-600 text-white font-black text-lg shadow-md shadow-red-600/30">
                                        4
                                    </div>
                                    <span className="text-xs font-bold text-zinc-400">Langkah 4</span>
                                </div>
                                <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
                                    Tukar Hadiah & Serah Terima
                                </h3>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    Pilih reward di katalog online (status 'Hold'). Datang ke counter kasir AHASS membawa kode klaim untuk serah terima barang atau aktivasi voucher (status 'Claimed').
                                </p>
                            </div>
                            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-red-600 dark:text-red-400">
                                Auto-Refund Jika Batal
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 8. KALKULATOR SIMULASI POIN (BERDASARKAN DATA DB RIIL)                     */}
            {/* ========================================================================= */}
            <section className="py-20 bg-white dark:bg-zinc-950 border-t border-zinc-200/80 dark:border-zinc-800/80">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        {/* Kolom Kiri: Promo Banner */}
                        <div className="lg:col-span-5 space-y-6">
                            <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400">
                                Simulasi & Potensi Poin
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
                                Hitung Potensi Poin Reward Anda
                            </h2>
                            <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                Setiap servis berkala, ganti oli rutin, hingga pembelian motor baru memiliki poin reward terstandarisasi.
                                Centang aktivitas servis yang Anda rencanakan untuk melihat seberapa cepat poin Anda terkumpul!
                            </p>

                            <div className="space-y-4">
                                <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 dark:border-red-900/40 dark:bg-red-950/40">
                                    <div className="flex items-center gap-3">
                                        <Tag className="size-5 text-red-600" />
                                        <h4 className="font-bold text-zinc-900 dark:text-white text-sm">
                                            Bonus Sambutan 50 Poin
                                        </h4>
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                        Langsung raih poin bonus sambutan pertama setelah Anda mendaftarkan akun dan memverifikasi email resmi.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                                    <div className="flex items-center gap-3">
                                        <Gift className="size-5 text-red-600" />
                                        <h4 className="font-bold text-zinc-900 dark:text-white text-sm">
                                            Klaim Langsung di Bengkel AHASS
                                        </h4>
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                        Tukarkan voucher oli MPX, diskon jasa servis, hingga merchandise resmi langsung saat Anda melakukan perawatan motor.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Kolom Kanan: Simulasi Poin Interaktif dari Database */}
                        <div className="lg:col-span-7">
                            <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5 dark:border-zinc-800">
                                    <div>
                                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                            <Coins className="size-5 text-red-600" />
                                            Kalkulator Simulasi Poin AHASS
                                        </h3>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                            Pilih aktivitas resmi dari database untuk melihat estimasi saldo poin
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-semibold text-zinc-400 uppercase">Estimasi Saldo</span>
                                        <div className="text-2xl font-black text-red-600 dark:text-red-500">
                                            {totalSimulatedPoints} POIN
                                        </div>
                                    </div>
                                </div>

                                {/* Pilihan Item Simulasi dari Database */}
                                <div className="mt-6 space-y-2.5 max-h-80 overflow-y-auto pr-1">
                                    {activeSimList.map((item) => {
                                        const isChecked = selectedSimItems.includes(item.id);
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => toggleSimItem(item.id)}
                                                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                                                    isChecked
                                                        ? 'border-red-500/80 bg-red-50/50 dark:bg-red-950/30 text-zinc-900 dark:text-white shadow-xs'
                                                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`size-5 rounded flex items-center justify-center border transition-colors ${
                                                            isChecked
                                                                ? 'bg-red-600 border-red-600 text-white'
                                                                : 'border-zinc-300 dark:border-zinc-600'
                                                        }`}
                                                    >
                                                        {isChecked && <CheckCircle2 className="size-3.5" />}
                                                    </div>
                                                    <span className="text-xs sm:text-sm font-medium">{item.name}</span>
                                                </div>
                                                <span className="text-xs font-black text-red-600 dark:text-red-400 shrink-0 ml-2">
                                                    +{item.points} Pts
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Hadiah yang Bisa Ditukar Berdasarkan Simulasi */}
                                <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400 text-center sm:text-left">
                                        {totalSimulatedPoints >= 200 ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                                🎉 Hebat! Estimasi poin ini cukup untuk ditukarkan dengan Oli Honda MPX atau Voucher Servis AHASS!
                                            </span>
                                        ) : totalSimulatedPoints >= 100 ? (
                                            <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                                👍 Cukup untuk diskon pembelian aksesoris atau kupon undian spesial Honda!
                                            </span>
                                        ) : (
                                            <span>
                                                Centang lebih banyak aktivitas untuk melihat potensi reward yang bisa Anda raih.
                                            </span>
                                        )}
                                    </div>
                                    <div className="shrink-0">
                                        {auth.user ? (
                                            <Link
                                                href={dashboardUrl}
                                                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/30 hover:bg-red-700 transition-all"
                                            >
                                                Buka Dashboard Member
                                            </Link>
                                        ) : (
                                            <Link
                                                href={register()}
                                                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/30 hover:bg-red-700 transition-all"
                                            >
                                                Mulai Kumpulkan Poin Ini
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 9. FOOTER (BAWAH HALAMAN)                                                 */}
            {/* ========================================================================= */}
            <footer id="kontak" className="bg-zinc-950 text-white border-t border-zinc-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
                        {/* Brand & Tagline Column */}
                        <div className="lg:col-span-4 space-y-4">
                            <div className="flex items-center gap-3">
                                <img
                                    src="/images/logo/anper_logo_white.png"
                                    alt="Honda Customer Rewards"
                                    className="h-10 w-auto object-contain"
                                />
                                <div className="border-l border-zinc-700 pl-3">
                                    <span className="block text-xs font-extrabold tracking-widest text-red-500 uppercase">
                                        Customer Rewards
                                    </span>
                                    <span className="block text-[11px] text-zinc-400">
                                        Dealer & AHASS Resmi
                                    </span>
                                </div>
                            </div>

                            <p className="text-sm text-zinc-400 leading-relaxed">
                                Program loyalitas digital resmi dealer dan bengkel AHASS untuk mengapresiasi setiap transaksi,
                                servis berkala, dan aktivitas Anda bersama sepeda motor Honda.
                            </p>

                            <div className="pt-2 text-xs text-zinc-500">
                                Dikelola secara profesional berstandar PT Astra Honda Motor.
                            </div>
                        </div>

                        {/* Kontak Dealer & AHASS */}
                        <div className="lg:col-span-3 space-y-3">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                                Layanan Pelanggan & AHASS
                            </h4>
                            <ul className="space-y-3 text-sm text-zinc-400">
                                <li className="flex items-start gap-3">
                                    <MapPin className="size-5 text-red-500 shrink-0 mt-0.5" />
                                    <span>Jaringan Dealer & Bengkel Resmi AHASS Terdekat di Kota Anda</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Phone className="size-4 text-red-500 shrink-0" />
                                    <span>Hotline CS: (021) 500-989 / 0811-987-654</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Mail className="size-4 text-red-500 shrink-0" />
                                    <span>support@hondarewards.id</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Clock className="size-4 text-red-500 shrink-0" />
                                    <span>Senin - Minggu: 08.00 - 17.00 WIB</span>
                                </li>
                            </ul>
                        </div>

                        {/* Tautan Cepat */}
                        <div className="lg:col-span-2 space-y-3">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                                Navigasi Cepat
                            </h4>
                            <ul className="space-y-2 text-sm text-zinc-400">
                                <li>
                                    <a href="#beranda" className="hover:text-red-400 transition-colors">
                                        Beranda
                                    </a>
                                </li>
                                <li>
                                    <a href="#cara-poin" className="hover:text-red-400 transition-colors">
                                        Cara Dapat Poin
                                    </a>
                                </li>
                                <li>
                                    <a href="#katalog-hadiah" className="hover:text-red-400 transition-colors">
                                        Katalog Hadiah
                                    </a>
                                </li>
                                <li>
                                    <a href="#tier-member" className="hover:text-red-400 transition-colors">
                                        Tingkatan Member
                                    </a>
                                </li>
                                <li>
                                    <a href="#cara-kerja" className="hover:text-red-400 transition-colors">
                                        Cara Kerja
                                    </a>
                                </li>
                                <li>
                                    <a href="#tentang" className="hover:text-red-400 transition-colors">
                                        Tentang Program
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Tautan Legal & Akun */}
                        <div className="lg:col-span-3 space-y-3">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                                Informasi & Akun
                            </h4>
                            <ul className="space-y-2 text-sm text-zinc-400">
                                {auth.user ? (
                                    <li>
                                        <Link href={dashboardUrl} className="hover:text-red-400 transition-colors font-semibold text-white">
                                            Buka Dashboard Member
                                        </Link>
                                    </li>
                                ) : (
                                    <>
                                        <li>
                                            <Link href={login()} className="hover:text-red-400 transition-colors">
                                                Masuk ke Akun Member
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href={register()} className="hover:text-red-400 transition-colors">
                                                Daftar ID MEMBER Baru
                                            </Link>
                                        </li>
                                    </>
                                )}
                                <li>
                                    <a href="#tentang" className="hover:text-red-400 transition-colors">
                                        Syarat & Ketentuan Program
                                    </a>
                                </li>
                                <li>
                                    <a href="#tentang" className="hover:text-red-400 transition-colors">
                                        Kebijakan Privasi
                                    </a>
                                </li>
                                <li>
                                    <a href="#cara-kerja" className="hover:text-red-400 transition-colors">
                                        Panduan Klaim Reward AHASS
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Copyright and Social Links */}
                    <div className="mt-12 pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
                        <p>
                            &copy; {new Date().getFullYear()} Honda Customer Rewards &bull; All Rights Reserved. Dealer & AHASS Resmi.
                        </p>
                        <div className="flex items-center gap-4 text-zinc-400">
                            <span className="hover:text-red-500 cursor-pointer">Instagram</span>
                            <span>&bull;</span>
                            <span className="hover:text-red-500 cursor-pointer">Facebook</span>
                            <span>&bull;</span>
                            <span className="hover:text-red-500 cursor-pointer">YouTube</span>
                            <span>&bull;</span>
                            <span className="hover:text-red-500 cursor-pointer">TikTok</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
