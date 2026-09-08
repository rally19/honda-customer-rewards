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
    Download,
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
        description:
            'Setiap servis di AHASS dan pembelian suku cadang asli kini berbuah poin loyalitas bernilai tinggi.',
        badge: 'Program Loyalitas Resmi',
    },
    {
        image: '/images/pictures/poster_hero_2.jpg',
        title: 'Layanan Terbaik AHASS',
        subtitle: 'Perawatan Maksimal, Hadiah Melimpah',
        description:
            'Dapatkan poin berlipat ganda untuk perawatan berkala motor kesayangan Anda dengan mekanik tersertifikasi.',
        badge: 'Spesial Servis Rutin',
    },
    {
        image: '/images/pictures/poster_hero_3.jpg',
        title: 'Tukarkan Poin dengan Hadiah Menarik',
        subtitle: 'Dari Oli Gratis Hingga Voucher Servis & Motor Baru',
        description:
            'Kumpulkan poin Anda dan pilih langsung reward favorit dari katalog eksklusif dealer & AHASS resmi.',
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
        benefit:
            'Akses perolehan poin rewards di seluruh AHASS dan dealer resmi Honda.',
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
        benefit:
            'Akses katalog voucher oli MPX, diskon servis berkala, dan penukaran merchandise reguler.',
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
        benefit:
            'Prioritas booking servis AHASS, diskon suku cadang & aksesori resmi, serta voucher berkala.',
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
        benefit:
            'Prioritas antrean servis AHASS (Fast Lane), tiket undian ganda Hari Pelanggan, dan voucher spesial.',
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
        benefit:
            'Layanan VIP AHASS, merchandise premium eksklusif Honda, dan undangan khusus event otomotif tahunan.',
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
    if (n.includes('servis') || n.includes('ahass') || n.includes('oli'))
        return Wrench;
    if (
        n.includes('part') ||
        n.includes('suku cadang') ||
        n.includes('aksesori')
    )
        return ShoppingBag;
    if (n.includes('beli motor') || n.includes('unit')) return Bike;
    if (n.includes('event') || n.includes('pameran')) return Calendar;
    if (n.includes('test') || n.includes('ride')) return Zap;
    if (
        n.includes('referral') ||
        n.includes('teman') ||
        n.includes('keluarga') ||
        n.includes('ajak')
    )
        return Users;
    if (
        n.includes('ulasan') ||
        n.includes('review') ||
        n.includes('penilaian') ||
        n.includes('bintang')
    )
        return Star;
    return Award;
};

// Helper: dynamic category label for activities
const getActivityMeta = (
    name: string,
): { category: string; highlight: string } => {
    const n = name.toLowerCase();
    if (n.includes('servis') || n.includes('ahass')) {
        return {
            category: 'Perawatan Berkala',
            highlight: 'Bengkel Resmi AHASS',
        };
    }
    if (
        n.includes('part') ||
        n.includes('suku cadang') ||
        n.includes('aksesori')
    ) {
        return {
            category: 'Suku Cadang Asli',
            highlight: 'Honda Genuine Parts',
        };
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
    if (
        n.includes('referral') ||
        n.includes('teman') ||
        n.includes('keluarga') ||
        n.includes('ajak')
    ) {
        return {
            category: 'Program Rekomendasi',
            highlight: 'Referral Pembelian',
        };
    }
    if (
        n.includes('ulasan') ||
        n.includes('review') ||
        n.includes('penilaian')
    ) {
        return { category: 'Ulasan Pelanggan', highlight: 'Feedback Layanan' };
    }
    return { category: 'Aktivitas Resmi', highlight: 'Poin Langsung Masuk' };
};

// Helper: dynamic category classification for rewards
const getRewardCategory = (
    name: string,
): { key: 'servis' | 'aksesori' | 'spesial'; label: string } => {
    const n = name.toLowerCase();
    if (n.includes('servis') || n.includes('oli')) {
        return { key: 'servis', label: 'Layanan Servis & Oli' };
    }
    if (
        n.includes('aksesori') ||
        n.includes('merchandise') ||
        n.includes('jaket') ||
        n.includes('apparel')
    ) {
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
    const dashboardUrl =
        auth.user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';

    // State Hero Carousel
    const [currentSlide, setCurrentSlide] = useState(0);

    // State Mobile Menu
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // State Filter Katalog Reward
    const [catalogFilter, setCatalogFilter] = useState<
        'semua' | 'servis' | 'aksesori' | 'spesial'
    >('semua');

    // State Simulasi Poin (menggunakan data riil dari DB)
    const activeSimList =
        simulationActivities.length > 0 ? simulationActivities : activities;
    const [selectedSimItems, setSelectedSimItems] = useState<string[]>(() => {
        return activeSimList.slice(0, 3).map((item) => item.id);
    });

    useEffect(() => {
        if (activeSimList.length > 0 && selectedSimItems.length === 0) {
            setSelectedSimItems(
                activeSimList.slice(0, 3).map((item) => item.id),
            );
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
        setCurrentSlide(
            (prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length,
        );
    };

    // Filter katalog reward
    const filteredRewards = useMemo(() => {
        if (catalogFilter === 'semua') return rewards;
        return rewards.filter(
            (item) => getRewardCategory(item.name).key === catalogFilter,
        );
    }, [rewards, catalogFilter]);

    // Hitung total simulasi poin
    const totalSimulatedPoints = useMemo(() => {
        return activeSimList
            .filter((item) => selectedSimItems.includes(item.id))
            .reduce((sum, item) => sum + item.points, 0);
    }, [activeSimList, selectedSimItems]);

    const toggleSimItem = (id: string) => {
        setSelectedSimItems((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
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
                <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
                    {/* Brand Logo */}
                    <a
                        href="#beranda"
                        className="group flex shrink-0 items-center gap-2.5 sm:gap-3"
                    >
                        <div className="relative flex h-10 items-center justify-center lg:h-12">
                            <img
                                src="/images/logo/anper_sartika_logo_red.png"
                                alt="Honda Customer Rewards"
                                className="h-8 w-auto object-contain transition-transform group-hover:scale-105 sm:h-9 lg:h-10 dark:hidden"
                            />
                            <img
                                src="/images/logo/anper_sartika_logo_white.png"
                                alt="Honda Customer Rewards"
                                className="hidden h-8 w-auto object-contain transition-transform group-hover:scale-105 sm:h-9 lg:h-10 dark:block"
                            />
                        </div>
                        <div className="border-l border-zinc-300 pl-2.5 sm:pl-3 dark:border-zinc-700">
                            <span className="block text-[10px] leading-tight font-extrabold tracking-wider whitespace-nowrap text-red-600 uppercase sm:text-[11px] lg:text-xs dark:text-red-500">
                                Customer Rewards
                            </span>
                            <span className="block text-[9px] leading-tight whitespace-nowrap text-zinc-500 sm:text-[10px] lg:text-[11px] dark:text-zinc-400">
                                Dealer & AHASS Resmi
                            </span>
                        </div>
                    </a>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden items-center gap-4 text-[13px] font-medium text-zinc-700 lg:flex xl:gap-6 xl:text-sm 2xl:gap-7 dark:text-zinc-300">
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
                            Kontak
                        </a>
                    </nav>

                    {/* Right Controls: Theme Toggle + Auth Buttons */}
                    <div className="hidden shrink-0 items-center gap-2 lg:flex xl:gap-3">
                        <ThemeToggle />

                        {auth.user ? (
                            <Link
                                href={dashboardUrl}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold whitespace-nowrap text-white shadow-md shadow-red-600/20 transition-all hover:bg-red-700 active:scale-95 xl:px-5 xl:py-2.5 xl:text-sm"
                            >
                                <Sparkles className="size-4" />
                                <span>Buka Dashboard</span>
                            </Link>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href={login()}
                                    className="rounded-xl px-3 py-2 text-xs font-medium whitespace-nowrap text-zinc-700 transition-colors hover:text-red-600 xl:text-sm dark:text-zinc-300 dark:hover:text-white"
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href={register()}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold whitespace-nowrap text-white shadow-md shadow-red-600/20 transition-all hover:bg-red-700 active:scale-95 xl:text-sm"
                                >
                                    <span>Daftar</span>
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
                            className="cursor-pointer rounded-xl border border-zinc-200 p-2 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                            aria-label="Buka navigasi"
                        >
                            {mobileMenuOpen ? (
                                <X className="size-5" />
                            ) : (
                                <Menu className="size-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Drawer */}
                {mobileMenuOpen && (
                    <div className="animate-smooth-down border-b border-zinc-200 bg-white px-4 py-5 lg:hidden dark:border-zinc-800 dark:bg-zinc-950">
                        <nav className="flex flex-col gap-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            <a
                                href="#beranda"
                                onClick={() => setMobileMenuOpen(false)}
                                className="border-b border-zinc-100 py-2 hover:text-red-600 dark:border-zinc-900"
                            >
                                Beranda
                            </a>
                            <a
                                href="#cara-poin"
                                onClick={() => setMobileMenuOpen(false)}
                                className="border-b border-zinc-100 py-2 hover:text-red-600 dark:border-zinc-900"
                            >
                                Cara Dapat Poin
                            </a>
                            <a
                                href="#katalog-hadiah"
                                onClick={() => setMobileMenuOpen(false)}
                                className="border-b border-zinc-100 py-2 hover:text-red-600 dark:border-zinc-900"
                            >
                                Katalog Hadiah
                            </a>
                            <a
                                href="#tier-member"
                                onClick={() => setMobileMenuOpen(false)}
                                className="border-b border-zinc-100 py-2 hover:text-red-600 dark:border-zinc-900"
                            >
                                Tingkatan Member
                            </a>
                            <a
                                href="#cara-kerja"
                                onClick={() => setMobileMenuOpen(false)}
                                className="border-b border-zinc-100 py-2 hover:text-red-600 dark:border-zinc-900"
                            >
                                Cara Kerja
                            </a>
                            <a
                                href="#tentang"
                                onClick={() => setMobileMenuOpen(false)}
                                className="border-b border-zinc-100 py-2 hover:text-red-600 dark:border-zinc-900"
                            >
                                Tentang Program
                            </a>
                            <a
                                href="#kontak"
                                onClick={() => setMobileMenuOpen(false)}
                                className="border-b border-zinc-100 py-2 hover:text-red-600 dark:border-zinc-900"
                            >
                                Hubungi Dealer
                            </a>
                        </nav>
                        <div className="mt-5 flex flex-col gap-2 border-t border-zinc-200 pt-2 dark:border-zinc-800">
                            {auth.user ? (
                                <Link
                                    href={dashboardUrl}
                                    className="w-full rounded-xl bg-red-600 py-2.5 text-center text-sm font-semibold text-white shadow-md"
                                >
                                    Buka Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="w-full rounded-xl border border-zinc-300 py-2.5 text-center text-sm font-semibold text-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                                    >
                                        Masuk ke Akun
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="w-full rounded-xl bg-red-600 py-2.5 text-center text-sm font-semibold text-white shadow-md shadow-red-600/30"
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
            <section
                id="beranda"
                className="relative overflow-hidden pt-6 pb-16 lg:pt-12 lg:pb-24"
            >
                {/* Background Ambient Glow */}
                <div className="pointer-events-none absolute -top-40 left-1/2 h-[450px] w-[800px] -translate-x-1/2 rounded-full bg-red-600/10 blur-[140px] dark:bg-red-600/15" />

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
                        {/* Text Content Column */}
                        <div className="animate-smooth-in space-y-6 text-center lg:col-span-6 lg:text-left">
                            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50/80 px-3.5 py-1.5 text-xs font-semibold text-red-700 backdrop-blur-sm dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-400">
                                <Flame className="size-4 animate-pulse text-red-600" />
                                <span>
                                    Program Loyalitas Resmi Dealer & Bengkel
                                    AHASS
                                </span>
                            </div>

                            <h1 className="text-4xl leading-[1.15] font-extrabold tracking-tight text-zinc-950 sm:text-5xl xl:text-6xl dark:text-white">
                                Honda Customer{' '}
                                <span className="bg-gradient-to-r from-red-600 via-red-500 to-rose-600 bg-clip-text text-transparent">
                                    Rewards
                                </span>
                            </h1>

                            <p className="text-xl font-medium text-zinc-800 italic dark:text-zinc-200">
                                &ldquo;Semakin Aktif Bersama Honda, Semakin
                                Banyak Hadiahnya&rdquo;
                            </p>

                            <p className="mx-auto max-w-xl text-base leading-relaxed text-zinc-600 lg:mx-0 dark:text-zinc-400">
                                Bergabunglah dengan program loyalitas digital
                                kami dan nikmati berbagai keuntungan eksklusif
                                dari setiap aktivitas Anda bersama Honda. Servis
                                rutin di AHASS, pembelian suku cadang asli,
                                hingga pembelian unit motor kini bernilai poin
                                yang siap ditukar.
                            </p>

                            {/* CTA Action Buttons */}
                            <div className="flex flex-col items-center justify-center gap-4 pt-2 sm:flex-row lg:justify-start">
                                {auth.user ? (
                                    <Link
                                        href={dashboardUrl}
                                        className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-red-600 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-red-600/30 transition-all hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-red-600/40 active:translate-y-0 active:scale-95 sm:w-auto"
                                    >
                                        <Sparkles className="size-5" />
                                        <span>Buka Dashboard</span>
                                    </Link>
                                ) : (
                                    <Link
                                        href={register()}
                                        className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-red-600 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-red-600/30 transition-all hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-red-600/40 active:translate-y-0 active:scale-95 sm:w-auto"
                                    >
                                        <Sparkles className="size-5" />
                                        <span>Dapatkan ID Member</span>
                                    </Link>
                                )}

                                <a
                                    href="#cara-kerja"
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white/80 px-6 py-3.5 text-base font-semibold text-zinc-800 backdrop-blur-sm transition-all hover:border-zinc-400 hover:bg-zinc-100 active:scale-95 sm:w-auto dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                >
                                    <span>Pelajari Cara Kerja</span>
                                </a>
                            </div>

                            {/* Live System Stats from DB */}
                            <div className="grid grid-cols-2 gap-3 border-t border-zinc-200 pt-6 text-left sm:grid-cols-4 dark:border-zinc-800">
                                <div className="space-y-1 rounded-xl border border-zinc-200/60 bg-zinc-50 p-2.5 dark:border-zinc-800/60 dark:bg-zinc-900/50">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400">
                                        <Users className="size-3.5" />
                                        <span>Total Member</span>
                                    </div>
                                    <div className="text-base font-black text-zinc-900 dark:text-white">
                                        {stats?.totalMembers ?? 0}{' '}
                                        <span className="text-[11px] font-normal text-zinc-500">
                                            Anggota
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1 rounded-xl border border-zinc-200/60 bg-zinc-50 p-2.5 dark:border-zinc-800/60 dark:bg-zinc-900/50">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                        <Wrench className="size-3.5" />
                                        <span>Layanan Poin</span>
                                    </div>
                                    <div className="text-base font-black text-zinc-900 dark:text-white">
                                        {stats?.totalActivities ?? 7}{' '}
                                        <span className="text-[11px] font-normal text-zinc-500">
                                            Aktivitas
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1 rounded-xl border border-zinc-200/60 bg-zinc-50 p-2.5 dark:border-zinc-800/60 dark:bg-zinc-900/50">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                                        <Gift className="size-3.5" />
                                        <span>Katalog Hadiah</span>
                                    </div>
                                    <div className="text-base font-black text-zinc-900 dark:text-white">
                                        {stats?.totalRewards ?? 6}{' '}
                                        <span className="text-[11px] font-normal text-zinc-500">
                                            Pilihan
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1 rounded-xl border border-zinc-200/60 bg-zinc-50 p-2.5 dark:border-zinc-800/60 dark:bg-zinc-900/50">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
                                        <Layers className="size-3.5" />
                                        <span>Level Tier</span>
                                    </div>
                                    <div className="text-base font-black text-zinc-900 dark:text-white">
                                        5{' '}
                                        <span className="text-[11px] font-normal text-zinc-500">
                                            Tingkatan
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Banner Slider Column */}
                        <div className="animate-smooth-scale relative lg:col-span-6">
                            <div className="relative mx-auto max-w-lg overflow-hidden rounded-3xl border-2 border-red-500/20 bg-zinc-900 shadow-2xl shadow-red-600/15 lg:max-w-none">
                                {/* Slide Image Container */}
                                <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/10]">
                                    {HERO_SLIDES.map((slide, idx) => (
                                        <div
                                            key={idx}
                                            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide
                                                    ? 'z-10 opacity-100'
                                                    : 'z-0 opacity-0'
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
                                            <div className="absolute inset-x-0 bottom-0 space-y-2 p-6 text-white sm:p-8">
                                                <span className="inline-block rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold tracking-wider text-white uppercase">
                                                    {slide.badge}
                                                </span>
                                                <h3 className="text-xl font-bold tracking-tight sm:text-2xl">
                                                    {slide.subtitle}
                                                </h3>
                                                <p className="line-clamp-2 text-xs text-zinc-300 sm:text-sm">
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
                                    className="absolute top-1/2 left-3 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-red-600 active:scale-95"
                                    aria-label="Slide sebelumnya"
                                >
                                    <ChevronLeft className="size-6" />
                                </button>
                                <button
                                    type="button"
                                    onClick={nextSlide}
                                    className="absolute top-1/2 right-3 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-red-600 active:scale-95"
                                    aria-label="Slide berikutnya"
                                >
                                    <ChevronRight className="size-6" />
                                </button>

                                {/* Slider Dot Indicators */}
                                <div className="absolute right-6 bottom-3 z-20 flex items-center gap-2">
                                    {HERO_SLIDES.map((_, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setCurrentSlide(idx)}
                                            className={`h-2 rounded-full transition-all ${idx === currentSlide
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
            <section
                id="tentang"
                className="border-y border-zinc-200/80 bg-zinc-50 py-20 dark:border-zinc-800/80 dark:bg-zinc-900/40"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl space-y-4 text-center">
                        <span className="inline-block text-xs font-extrabold tracking-widest text-red-600 uppercase dark:text-red-400">
                            Mengapa Harus Bergabung?
                        </span>
                        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
                            Apresiasi Istimewa untuk Pelanggan Setia Honda
                        </h2>
                        <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                            Program inovasi{' '}
                            <strong>Honda Customer Rewards</strong> dirancang
                            secara digital untuk memberikan pengalaman menarik
                            melalui sistem akumulasi poin dan hadiah langsung,
                            demi mengapresiasi setiap kesetiaan Anda dalam
                            merawat dan mempercayakan kendaraan Anda bersama
                            dealer dan AHASS resmi.
                        </p>
                    </div>

                    {/* 4 Keunggulan Utama */}
                    <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div className="relative rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs transition-all hover:border-red-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-900/60">
                            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                                <HeartHandshake className="size-6" />
                            </div>
                            <h3 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                Apresiasi Nyata
                            </h3>
                            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                                Setiap servis berkala, ganti oli, dan pembelian
                                suku cadang resmi di AHASS langsung menghasilkan
                                poin reward yang dapat dibelanjakan.
                            </p>
                        </div>

                        <div className="relative rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm transition-all hover:border-red-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-900/60">
                            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                                <QrCode className="size-6" />
                            </div>
                            <h3 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                Terintegrasi Scanner AHASS
                            </h3>
                            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                                Cukup tunjukkan kartu QR Member digital dari
                                ponsel Anda ke kasir AHASS saat pembayaran untuk
                                penambahan poin seketika.
                            </p>
                        </div>

                        <div className="relative rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm transition-all hover:border-red-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-900/60">
                            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                                <TrendingUp className="size-6" />
                            </div>
                            <h3 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                Tier Tidak Pernah Turun
                            </h3>
                            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                                Poin seumur hidup (
                                <code className="font-mono text-xs font-bold">
                                    lifetime_points
                                </code>
                                ) bersifat permanen. Level Anda tetap terjaga
                                meski saldo poin aktif ditukarkan.
                            </p>
                        </div>

                        <div className="relative rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm transition-all hover:border-red-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-900/60">
                            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                                <ShieldCheck className="size-6" />
                            </div>
                            <h3 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                Transaksi Aman & Terverifikasi
                            </h3>
                            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                                Dilindungi transaksi database atomik (ACID),
                                verifikasi email wajib, serta autentikasi ganda
                                2FA untuk integritas saldo poin Anda.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 4. CARA MENGUMPULKAN POIN (DATA DARI DB - TOP 6)                           */}
            {/* ========================================================================= */}
            <section id="cara-poin" className="bg-white py-20 dark:bg-zinc-950">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl space-y-4 text-center">
                        <span className="inline-block text-xs font-extrabold tracking-widest text-red-600 uppercase dark:text-red-400">
                            Aktivitas Resmi AHASS & Dealer
                        </span>
                        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
                            Cara Mudah Mengumpulkan Poin
                        </h2>
                        <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                            Kumpulkan poin dari setiap perawatan kendaraan dan
                            transaksi resmi Anda di bengkel AHASS. Cukup
                            tunjukkan QR ID Member Anda ke kasir saat servis
                            untuk mendapatkan poin reward:
                        </p>
                    </div>

                    {/* Grid Top 6 Activities dari Database */}
                    <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {activities.map((act) => {
                            const IconComp = getActivityIcon(act.name);
                            const meta = getActivityMeta(act.name);
                            return (
                                <div
                                    key={act.id}
                                    className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-red-500/50 hover:shadow-xl hover:shadow-red-600/5 dark:border-zinc-800 dark:bg-zinc-900/70"
                                >
                                    <div>
                                        <div className="mb-5 flex items-start justify-between gap-4">
                                            <div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600 transition-transform group-hover:scale-110 dark:border-red-900/40 dark:bg-red-950/50 dark:text-red-400">
                                                <IconComp className="size-6" />
                                            </div>
                                            <span className="rounded-full bg-red-600 px-3.5 py-1 text-xs font-black text-white shadow-sm shadow-red-600/30">
                                                +{act.points} POIN
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                                                {meta.category} &bull;{' '}
                                                {meta.highlight}
                                            </span>
                                            <h3 className="text-xl font-bold text-zinc-900 transition-colors group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400">
                                                {act.name}
                                            </h3>
                                            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                                                {act.description ||
                                                    'Layanan resmi berkualitas Honda di seluruh bengkel AHASS dengan mekanik tersertifikasi.'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4 text-xs text-zinc-500 dark:border-zinc-800">
                                        <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                            <QrCode className="size-3.5" /> Scan
                                            QR di Kasir AHASS
                                        </span>
                                        <span className="font-mono text-[11px] text-zinc-400">
                                            ID: {act.id}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Banner CTA jika aktivitas > 6 atau ajakan membuka detail lengkap */}
                    <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-6 text-white shadow-xl sm:flex-row sm:p-8">
                        <div className="space-y-2 text-center sm:text-left">
                            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-600/20 px-3 py-1 text-xs font-bold text-red-400">
                                <Wrench className="size-3.5" />
                                <span>
                                    Tersedia {totalActivitiesCount} Aktivitas
                                    Resmi di Jaringan AHASS
                                </span>
                            </div>
                            <h4 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                                Ingin Melihat Seluruh Aktivitas & Riwayat Servis
                                Anda?
                            </h4>
                            <p className="max-w-xl text-xs text-zinc-300 sm:text-sm">
                                Masuk ke dashboard akun untuk memantau akumulasi
                                poin, rincian pekerjaan servis di bengkel, dan
                                katalog reward yang siap ditukarkan.
                            </p>
                        </div>
                        <div className="shrink-0">
                            {auth.user ? (
                                <Link
                                    href="/activities"
                                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold whitespace-nowrap text-white shadow-md shadow-red-600/30 transition-all hover:bg-red-700 active:scale-95"
                                >
                                    <span>
                                        Lihat Semua Aktivitas di Dashboard
                                    </span>
                                    <ArrowRight className="size-4" />
                                </Link>
                            ) : (
                                <div className="flex flex-col items-center gap-3 sm:flex-row">
                                    <Link
                                        href={login()}
                                        className="w-full rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-center text-xs font-bold text-white transition-all hover:bg-white/20 sm:w-auto sm:text-sm"
                                    >
                                        Masuk Akun
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-600 px-6 py-2.5 text-center text-xs font-bold text-white shadow-md shadow-red-600/30 transition-all hover:bg-red-700 sm:w-auto sm:text-sm"
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
            <section
                id="katalog-hadiah"
                className="border-t border-zinc-200/80 bg-zinc-50 py-20 dark:border-zinc-800/80 dark:bg-zinc-900/30"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl space-y-4 text-center">
                        <span className="inline-block text-xs font-extrabold tracking-widest text-red-600 uppercase dark:text-red-400">
                            Reward Eksklusif Honda
                        </span>
                        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
                            Katalog Hadiah Penukaran Poin
                        </h2>
                        <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                            Tukarkan saldo poin aktif Anda dengan berbagai
                            hadiah menarik berstandar pabrikan resmi Honda.
                            Klaim dapat dilakukan secara mandiri di web/aplikasi
                            dan diambil langsung di counter kasir AHASS.
                        </p>

                        {/* Filter Tabs */}
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                            {(
                                [
                                    { key: 'semua', label: 'Semua Hadiah' },
                                    {
                                        key: 'servis',
                                        label: 'Layanan Servis & Oli',
                                    },
                                    {
                                        key: 'aksesori',
                                        label: 'Produk & Aksesori',
                                    },
                                    {
                                        key: 'spesial',
                                        label: 'Hadiah Spesial & Undian',
                                    },
                                ] as const
                            ).map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setCatalogFilter(tab.key)}
                                    className={`cursor-pointer rounded-full px-5 py-2 text-xs font-bold transition-all ${catalogFilter === tab.key
                                            ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
                                            : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rewards Grid dari Database (Top 6) */}
                    <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredRewards.map((reward) => {
                            const meta = getRewardCategory(reward.name);
                            return (
                                <div
                                    key={reward.id}
                                    className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-red-400 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
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
                                            <span className="rounded-md bg-zinc-900/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
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
                                    <div className="flex flex-1 flex-col justify-between space-y-4 p-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Badge
                                                    variant="outline"
                                                    className={`px-2 py-0.5 text-[10px] font-bold ${reward.stock > 0
                                                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                            : 'border-zinc-300 bg-zinc-100 text-zinc-600'
                                                        }`}
                                                >
                                                    {reward.stock > 0
                                                        ? `Tersedia (${reward.stock} Unit)`
                                                        : 'Stok Habis'}
                                                </Badge>
                                                <span className="font-mono text-[11px] text-zinc-400">
                                                    Kode: {reward.id}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-zinc-900 transition-colors group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400">
                                                {reward.name}
                                            </h3>
                                            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                                                {reward.description ||
                                                    'Hadiah resmi Honda terstandarisasi yang siap ditukarkan di seluruh jaringan AHASS.'}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
                                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                Ambil di Dealer / AHASS
                                            </span>
                                            {auth.user ? (
                                                <Link
                                                    href="/rewards"
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                >
                                                    <span>
                                                        Tukar di Dashboard
                                                    </span>
                                                    <ChevronRight className="size-3.5" />
                                                </Link>
                                            ) : (
                                                <Link
                                                    href={register()}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
                    <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:flex-row sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center gap-4">
                            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/50">
                                <Gift className="size-7" />
                            </div>
                            <div className="space-y-1 text-center sm:text-left">
                                <h4 className="text-lg font-bold text-zinc-900 sm:text-xl dark:text-white">
                                    {totalRewardsCount > 6
                                        ? `Tersedia ${totalRewardsCount} Pilihan Hadiah Reward di Sistem`
                                        : 'Katalog Reward Lengkap Siap Ditukarkan'}
                                </h4>
                                <p className="text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
                                    Login ke akun Anda untuk memilih reward,
                                    memverifikasi ketersediaan stok, dan
                                    mengambil voucher di counter AHASS.
                                </p>
                            </div>
                        </div>

                        <div className="shrink-0">
                            {auth.user ? (
                                <Link
                                    href="/rewards"
                                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold whitespace-nowrap text-white shadow-md shadow-red-600/30 transition-all hover:bg-red-700 active:scale-95"
                                >
                                    <span>Buka Katalog Reward</span>
                                    <ArrowRight className="size-4" />
                                </Link>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={login()}
                                        className="rounded-xl border border-zinc-300 px-5 py-2.5 text-xs font-bold text-zinc-800 transition-all hover:bg-zinc-100 sm:text-sm dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                    >
                                        Masuk
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/30 transition-all hover:bg-red-700 sm:text-sm"
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
            <section
                id="tier-member"
                className="border-t border-zinc-200/80 bg-white py-20 dark:border-zinc-800/80 dark:bg-zinc-950"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl space-y-4 text-center">
                        <span className="inline-block text-xs font-extrabold tracking-widest text-red-600 uppercase dark:text-red-400">
                            Tingkatan Loyalitas Member
                        </span>
                        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
                            5 Tingkatan Member (Member Tier Roadmap)
                        </h2>
                        <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                            Tingkat keanggotaan dihitung otomatis dari akumulasi
                            total poin seumur hidup (
                            <code className="font-mono text-xs font-bold">
                                lifetime_points
                            </code>
                            ). Semakin sering Anda merawat motor di AHASS,
                            semakin tinggi privilese yang Anda dapatkan.
                        </p>
                    </div>

                    {/* 5 Tier Cards Grid */}
                    <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {effectiveTiers.map((tierItem, idx) => (
                            <div
                                key={tierItem.tier}
                                className="flex flex-col justify-between space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 transition-all hover:border-red-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black ${tierItem.visualStyles.bg} ${tierItem.visualStyles.text} ${tierItem.visualStyles.border}`}
                                        >
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
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase">
                                            Level {idx + 1}
                                        </span>
                                    </div>

                                    <div>
                                        <div className="text-lg font-black text-zinc-900 dark:text-white">
                                            {tierItem.maxPoints !== null
                                                ? `${tierItem.minPoints.toLocaleString('id-ID')} – ${tierItem.maxPoints.toLocaleString('id-ID')}`
                                                : `≥ ${tierItem.minPoints.toLocaleString('id-ID')}`}{' '}
                                            <span className="text-xs font-semibold text-zinc-500">
                                                Pts
                                            </span>
                                        </div>
                                        <div className="mt-0.5 text-xs font-bold text-red-600 dark:text-red-400">
                                            {tierItem.name}
                                        </div>
                                    </div>

                                    <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                        {tierItem.benefit}
                                    </p>
                                </div>

                                <div className="border-t border-zinc-200/60 pt-3 text-[11px] font-medium text-zinc-400 dark:border-zinc-800">
                                    {idx === 0
                                        ? 'Tier awal registrasi akun'
                                        : `Akumulasi min. ${tierItem.minPoints.toLocaleString('id-ID')} Poin`}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Highlight Box: Retensi Tier */}
                    <div className="mt-8 flex items-start gap-3.5 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/50 dark:bg-amber-950/30">
                        <Info className="mt-0.5 size-5 shrink-0 text-amber-600" />
                        <div className="text-xs leading-relaxed text-amber-900 sm:text-sm dark:text-amber-200">
                            <strong>Prinsip Retensi Level Permanen:</strong>{' '}
                            Tingkatan member dihitung secara absolut dari
                            akumulasi total poin seumur hidup (
                            <code className="font-mono font-bold">
                                lifetime_points
                            </code>
                            ). Ketika Anda menukarkan poin reward untuk voucher
                            atau merchandise, saldo yang berkurang hanyalah{' '}
                            <strong>Saldo Poin Aktif</strong> (
                            <code className="font-mono font-bold">points</code>
                            ).{' '}
                            <em>
                                Tingkat Member Anda tidak akan pernah turun!
                            </em>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 7. CARA KERJA (4 LANGKAH MUDAH SESUAI SISTEM SEKARANG)                    */}
            {/* ========================================================================= */}
            <section
                id="cara-kerja"
                className="border-t border-zinc-200/80 bg-zinc-50 py-20 dark:border-zinc-800/80 dark:bg-zinc-900/40"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl space-y-4 text-center">
                        <span className="inline-block text-xs font-extrabold tracking-widest text-red-600 uppercase dark:text-red-400">
                            Alur Program AHASS
                        </span>
                        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
                            4 Langkah Mudah Menikmati Hadiah
                        </h2>
                        <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                            Bergabung dan mengumpulkan poin sangatlah praktis.
                            Cukup 4 langkah sederhana dari pendaftaran hingga
                            penyerahan hadiah di AHASS.
                        </p>
                    </div>

                    <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {/* Step 1 */}
                        <div className="relative flex flex-col justify-between space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-red-600 text-lg font-black text-white shadow-md shadow-red-600/30">
                                        1
                                    </div>
                                    <span className="text-xs font-bold text-zinc-400">
                                        Langkah 1
                                    </span>
                                </div>
                                <h3 className="mb-2 text-base font-bold text-zinc-900 dark:text-white">
                                    Daftar & Miliki ID MEMBER Digital
                                </h3>
                                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                    Pelanggan mendaftar secara online dan
                                    memverifikasi email untuk langsung
                                    mendapatkan Kartu Digital ID Member 10-digit
                                    beserta QR scanner pribadi.
                                </p>
                            </div>
                            <div className="border-t border-zinc-100 pt-3 text-[11px] font-semibold text-red-600 dark:border-zinc-800 dark:text-red-400">
                                Gratis & Otomatis Aktif
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative flex flex-col justify-between space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-red-600 text-lg font-black text-white shadow-md shadow-red-600/30">
                                        2
                                    </div>
                                    <span className="text-xs font-bold text-zinc-400">
                                        Langkah 2
                                    </span>
                                </div>
                                <h3 className="mb-2 text-base font-bold text-zinc-900 dark:text-white">
                                    Servis & Transaksi di AHASS
                                </h3>
                                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                    Kunjungi bengkel resmi AHASS atau dealer
                                    Honda untuk servis berkala, ganti oli
                                    MPX/SPX, pembelian suku cadang asli HGP,
                                    atau unit motor baru.
                                </p>
                            </div>
                            <div className="border-t border-zinc-100 pt-3 text-[11px] font-semibold text-red-600 dark:border-zinc-800 dark:text-red-400">
                                Sesuai Standar Pabrikan
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative flex flex-col justify-between space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-red-600 text-lg font-black text-white shadow-md shadow-red-600/30">
                                        3
                                    </div>
                                    <span className="text-xs font-bold text-zinc-400">
                                        Langkah 3
                                    </span>
                                </div>
                                <h3 className="mb-2 text-base font-bold text-zinc-900 dark:text-white">
                                    Pindai QR Kasir & Kredit Poin
                                </h3>
                                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                    Tunjukkan QR ID Member ke kasir AHASS saat
                                    pembayaran. Staf memindai QR Anda dan poin
                                    aktif beserta poin akumulasi langsung
                                    terkreditkan secara real-time.
                                </p>
                            </div>
                            <div className="border-t border-zinc-100 pt-3 text-[11px] font-semibold text-red-600 dark:border-zinc-800 dark:text-red-400">
                                Poin Langsung Masuk
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="relative flex flex-col justify-between space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-red-600 text-lg font-black text-white shadow-md shadow-red-600/30">
                                        4
                                    </div>
                                    <span className="text-xs font-bold text-zinc-400">
                                        Langkah 4
                                    </span>
                                </div>
                                <h3 className="mb-2 text-base font-bold text-zinc-900 dark:text-white">
                                    Tukar Hadiah & Serah Terima
                                </h3>
                                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                    Pilih reward di katalog online (status
                                    'Hold'). Datang ke counter kasir AHASS
                                    membawa kode klaim untuk serah terima barang
                                    atau aktivasi voucher (status 'Claimed').
                                </p>
                            </div>
                            <div className="border-t border-zinc-100 pt-3 text-[11px] font-semibold text-red-600 dark:border-zinc-800 dark:text-red-400">
                                Auto-Refund Jika Batal
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 8. KALKULATOR SIMULASI POIN (BERDASARKAN DATA DB RIIL)                     */}
            {/* ========================================================================= */}
            <section className="border-t border-zinc-200/80 bg-white py-20 dark:border-zinc-800/80 dark:bg-zinc-950">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
                        {/* Kolom Kiri: Promo Banner */}
                        <div className="space-y-6 lg:col-span-5">
                            <span className="inline-block text-xs font-extrabold tracking-widest text-red-600 uppercase dark:text-red-400">
                                Simulasi & Potensi Poin
                            </span>
                            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
                                Hitung Potensi Poin Reward Anda
                            </h2>
                            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                                Setiap servis berkala, ganti oli rutin, hingga
                                pembelian motor baru memiliki poin reward
                                terstandarisasi. Centang aktivitas servis yang
                                Anda rencanakan untuk melihat seberapa cepat
                                poin Anda terkumpul!
                            </p>

                            <div className="space-y-4">
                                <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 dark:border-red-900/40 dark:bg-red-950/40">
                                    <div className="flex items-center gap-3">
                                        <Tag className="size-5 text-red-600" />
                                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                                            Bonus Sambutan 50 Poin
                                        </h4>
                                    </div>
                                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                                        Langsung raih poin bonus sambutan
                                        pertama setelah Anda mendaftarkan akun
                                        dan memverifikasi email resmi.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                                    <div className="flex items-center gap-3">
                                        <Gift className="size-5 text-red-600" />
                                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                                            Klaim Langsung di Bengkel AHASS
                                        </h4>
                                    </div>
                                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                                        Tukarkan voucher oli MPX, diskon jasa
                                        servis, hingga merchandise resmi
                                        langsung saat Anda melakukan perawatan
                                        motor.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Kolom Kanan: Simulasi Poin Interaktif dari Database */}
                        <div className="lg:col-span-7">
                            <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-xl sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
                                <div className="flex flex-col justify-between gap-4 border-b border-zinc-100 pb-5 sm:flex-row sm:items-center dark:border-zinc-800">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-white">
                                            <Coins className="size-5 text-red-600" />
                                            Kalkulator Simulasi Poin AHASS
                                        </h3>
                                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                            Pilih aktivitas resmi dari database
                                            untuk melihat estimasi saldo poin
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-semibold text-zinc-400 uppercase">
                                            Estimasi Saldo
                                        </span>
                                        <div className="text-2xl font-black text-red-600 dark:text-red-500">
                                            {totalSimulatedPoints} POIN
                                        </div>
                                    </div>
                                </div>

                                {/* Pilihan Item Simulasi dari Database */}
                                <div className="mt-6 max-h-80 space-y-2.5 overflow-y-auto pr-1">
                                    {activeSimList.map((item) => {
                                        const isChecked =
                                            selectedSimItems.includes(item.id);
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() =>
                                                    toggleSimItem(item.id)
                                                }
                                                className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all select-none ${isChecked
                                                        ? 'border-red-500/80 bg-red-50/50 text-zinc-900 shadow-xs dark:bg-red-950/30 dark:text-white'
                                                        : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex size-5 items-center justify-center rounded border transition-colors ${isChecked
                                                                ? 'border-red-600 bg-red-600 text-white'
                                                                : 'border-zinc-300 dark:border-zinc-600'
                                                            }`}
                                                    >
                                                        {isChecked && (
                                                            <CheckCircle2 className="size-3.5" />
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-medium sm:text-sm">
                                                        {item.name}
                                                    </span>
                                                </div>
                                                <span className="ml-2 shrink-0 text-xs font-black text-red-600 dark:text-red-400">
                                                    +{item.points} Pts
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Hadiah yang Bisa Ditukar Berdasarkan Simulasi */}
                                <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-zinc-100 pt-5 sm:flex-row dark:border-zinc-800">
                                    <div className="text-center text-xs text-zinc-500 sm:text-left dark:text-zinc-400">
                                        {totalSimulatedPoints >= 200 ? (
                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                🎉 Hebat! Estimasi poin ini
                                                cukup untuk ditukarkan dengan
                                                Oli Honda MPX atau Voucher
                                                Servis AHASS!
                                            </span>
                                        ) : totalSimulatedPoints >= 100 ? (
                                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                                                👍 Cukup untuk diskon pembelian
                                                aksesoris atau kupon undian
                                                spesial Honda!
                                            </span>
                                        ) : (
                                            <span>
                                                Centang lebih banyak aktivitas
                                                untuk melihat potensi reward
                                                yang bisa Anda raih.
                                            </span>
                                        )}
                                    </div>
                                    <div className="shrink-0">
                                        {auth.user ? (
                                            <Link
                                                href={dashboardUrl}
                                                className="inline-flex w-full items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/30 transition-all hover:bg-red-700 sm:w-auto"
                                            >
                                                Buka Dashboard Member
                                            </Link>
                                        ) : (
                                            <Link
                                                href={register()}
                                                className="inline-flex w-full items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/30 transition-all hover:bg-red-700 sm:w-auto"
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
            <footer
                id="kontak"
                className="border-t border-zinc-800 bg-zinc-950 text-white"
            >
                <div className="mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">
                        {/* Brand & Tagline Column */}
                        <div className="space-y-4 lg:col-span-4">
                            <div className="flex items-center gap-3">
                                <img
                                    src="/images/logo/anper_sartika_logo_white.png"
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

                            <p className="text-sm leading-relaxed text-zinc-400">
                                Program loyalitas digital resmi dealer dan
                                bengkel AHASS untuk mengapresiasi setiap
                                transaksi, servis berkala, dan aktivitas Anda
                                bersama sepeda motor Honda.
                            </p>

                            <div className="pt-2 text-xs text-zinc-500">
                                Dikelola secara profesional berstandar CV
                                Anugerah Perdana.
                            </div>
                        </div>

                        {/* Kontak Dealer & AHASS */}
                        <div className="space-y-3 lg:col-span-3">
                            <h4 className="text-sm font-bold tracking-wider text-zinc-200 uppercase">
                                Layanan Pelanggan & AHASS
                            </h4>
                            <ul className="space-y-3 text-sm text-zinc-400">
                                <li className="flex items-start gap-3">
                                    <MapPin className="mt-0.5 size-5 shrink-0 text-red-500" />
                                    <span>
                                        Jaringan Dealer & Bengkel Resmi AHASS
                                        Terdekat di Kota Anda
                                    </span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Phone className="size-4 shrink-0 text-red-500" />
                                    <span>
                                        Hotline CS: (021) 500-989 / 0811-987-654
                                    </span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Mail className="size-4 shrink-0 text-red-500" />
                                    <span>support@hondarewards.id</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Clock className="size-4 shrink-0 text-red-500" />
                                    <span>
                                        Senin - Minggu: 08.00 - 17.00 WIB
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* Tautan Cepat */}
                        <div className="space-y-3 lg:col-span-2">
                            <h4 className="text-sm font-bold tracking-wider text-zinc-200 uppercase">
                                Navigasi Cepat
                            </h4>
                            <ul className="space-y-2 text-sm text-zinc-400">
                                <li>
                                    <a
                                        href="#beranda"
                                        className="transition-colors hover:text-red-400"
                                    >
                                        Beranda
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#cara-poin"
                                        className="transition-colors hover:text-red-400"
                                    >
                                        Cara Dapat Poin
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#katalog-hadiah"
                                        className="transition-colors hover:text-red-400"
                                    >
                                        Katalog Hadiah
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#tier-member"
                                        className="transition-colors hover:text-red-400"
                                    >
                                        Tingkatan Member
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#cara-kerja"
                                        className="transition-colors hover:text-red-400"
                                    >
                                        Cara Kerja
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#tentang"
                                        className="transition-colors hover:text-red-400"
                                    >
                                        Tentang Program
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Tautan Legal & Akun */}
                        <div className="space-y-3 lg:col-span-3">
                            <h4 className="text-sm font-bold tracking-wider text-zinc-200 uppercase">
                                Informasi & Akun
                            </h4>
                            <ul className="space-y-2 text-sm text-zinc-400">
                                {auth.user ? (
                                    <li>
                                        <Link
                                            href={dashboardUrl}
                                            className="font-semibold text-white transition-colors hover:text-red-400"
                                        >
                                            Buka Dashboard Member
                                        </Link>
                                    </li>
                                ) : (
                                    <>
                                        <li>
                                            <Link
                                                href={login()}
                                                className="transition-colors hover:text-red-400"
                                            >
                                                Masuk ke Akun Member
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href={register()}
                                                className="transition-colors hover:text-red-400"
                                            >
                                                Daftar ID MEMBER Baru
                                            </Link>
                                        </li>
                                    </>
                                )}
                                <li>
                                    <a
                                        href="#tentang"
                                        className="transition-colors hover:text-red-400"
                                    >
                                        Syarat & Ketentuan Program
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#tentang"
                                        className="transition-colors hover:text-red-400"
                                    >
                                        Kebijakan Privasi
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#cara-kerja"
                                        className="transition-colors hover:text-red-400"
                                    >
                                        Panduan Klaim Reward AHASS
                                    </a>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            window.dispatchEvent(
                                                new CustomEvent(
                                                    'pwa-install-requested',
                                                ),
                                            )
                                        }
                                        className="flex cursor-pointer items-center gap-1.5 text-left text-zinc-400 transition-colors hover:text-red-400"
                                    >
                                        <Download className="size-3.5 shrink-0 text-red-500" />
                                        <span>Pasang Aplikasi (PWA)</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Copyright and Social Links */}
                    <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-800/80 pt-8 text-xs text-zinc-500 sm:flex-row">
                        <p>
                            &copy; {new Date().getFullYear()} Honda Customer
                            Rewards &bull; All Rights Reserved. Dealer & AHASS
                            Resmi.
                        </p>
                        <div className="flex items-center gap-4 text-zinc-400">
                            <span className="cursor-pointer hover:text-red-500">
                                Instagram
                            </span>
                            <span>&bull;</span>
                            <span className="cursor-pointer hover:text-red-500">
                                Facebook
                            </span>
                            <span>&bull;</span>
                            <span className="cursor-pointer hover:text-red-500">
                                YouTube
                            </span>
                            <span>&bull;</span>
                            <span className="cursor-pointer hover:text-red-500">
                                TikTok
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
