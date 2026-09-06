import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    Award,
    Bike,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Flame,
    Gift,
    HeartHandshake,
    HelpCircle,
    Info,
    Mail,
    MapPin,
    Menu,
    Phone,
    QrCode,
    RefreshCw,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Star,
    Tag,
    ThumbsUp,
    Users,
    Wrench,
    X,
    Zap,
} from 'lucide-react';
import ThemeToggle from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { dashboard, login, register } from '@/routes';
import type { User } from '@/types';

type PageProps = {
    auth: {
        user: User | null;
    };
    currentTeam?: {
        slug: string;
        name: string;
    } | null;
};

// Hero Carousel Posters
const HERO_SLIDES = [
    {
        image: '/images/pictures/poster_hero_1.jpg',
        title: 'Honda Customer Rewards',
        subtitle: 'Semakin Aktif Bersama Honda, Semakin Banyak Hadiahnya',
        description: 'Setiap servis di AHASS dan transaksi suku cadang kini berbuah poin loyalitas bernilai tinggi.',
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
        subtitle: 'Dari Oli Gratis Hingga Voucher Motor Baru',
        description: 'Kumpulkan poin Anda dan pilih langsung reward favorit dari katalog eksklusif Honda.',
        badge: 'Hadiah & Merchandise Asli',
    },
];

// Cara Mengumpulkan Poin
const POINT_ACTIVITIES = [
    {
        icon: Wrench,
        title: 'Servis Berkala di AHASS',
        points: '+50 - 150 Poin',
        category: 'Perawatan',
        description: 'Lakukan servis rutin, tune-up, ganti oli, atau perbaikan berkala di seluruh bengkel resmi AHASS.',
        highlight: 'Setiap Kunjungan Servis',
    },
    {
        icon: ShoppingBag,
        title: 'Beli Suku Cadang & Aksesori Asli',
        points: '+10 Poin / Rp 50.000',
        category: 'Pembelian Part',
        description: 'Beli suku cadang Honda Genuine Parts (HGP) dan aksesori motor resmi Honda untuk menambah poin.',
        highlight: 'Akumulatif Otomatis',
    },
    {
        icon: Bike,
        title: 'Beli Unit Motor Honda Baru',
        points: '+500 - 1.000 Poin',
        category: 'Unit Baru',
        description: 'Membeli unit motor matic, bebek, maupun sport di jaringan dealer resmi kami berhak bonus poin besar.',
        highlight: 'Bonus Langsung Member',
    },
    {
        icon: Calendar,
        title: 'Event Dealer & Test Ride',
        points: '+30 Poin',
        category: 'Aktivitas',
        description: 'Ikuti pameran dealer, peluncuran produk baru, atau coba sensasi berkendara di sesi test ride resmi.',
        highlight: 'Event & Pameran',
    },
    {
        icon: Users,
        title: 'Program Referral Teman/Keluarga',
        points: '+200 Poin',
        category: 'Rekomendasi',
        description: 'Ajak sahabat atau kerabat untuk membeli motor Honda di dealer kami menggunakan kode referral Anda.',
        highlight: 'Per Transaksi Berhasil',
    },
    {
        icon: Star,
        title: 'Ulasan & Penilaian Layanan',
        points: '+20 Poin',
        category: 'Feedback',
        description: 'Beri bintang dan review jujur terhadap keramahan staf dealer dan ketepatan servis teknisi AHASS.',
        highlight: 'Feedback Berkala',
    },
];

// Katalog Hadiah Resmi Honda
const REWARD_CATALOG = [
    {
        id: 1,
        title: 'Voucher Servis',
        category: 'servis',
        categoryLabel: 'Layanan Servis',
        points: 150,
        image: '/images/pictures/voucher_service_img.jpg',
        description: 'Voucher gratis atau potongan biaya jasa servis berkala paket lengkap di seluruh bengkel resmi AHASS.',
        badge: 'Terpopuler',
        popular: true,
    },
    {
        id: 2,
        title: 'Oli Honda Gratis',
        category: 'servis',
        categoryLabel: 'Layanan Servis',
        points: 200,
        image: '/images/pictures/oli_honda_img.jpg',
        description: 'Gratis 1 botol pelumas resmi mesin motor Honda AHM Oil MPX / SPX berstandar pabrikan.',
        badge: 'Favorit Member',
        popular: true,
    },
    {
        id: 3,
        title: 'Potongan Pembelian Aksesori',
        category: 'aksesori',
        categoryLabel: 'Produk & Aksesori',
        points: 100,
        image: '/images/pictures/potongan_pembelian_aksesori_img.jpg',
        description: 'Diskon langsung untuk pembelian Honda Genuine Accessories (HGA) resmi di seluruh jaringan dealer.',
        badge: 'Diskon Spesial',
    },
    {
        id: 4,
        title: 'Merchandise Resmi Honda',
        category: 'aksesori',
        categoryLabel: 'Produk & Aksesori',
        points: 350,
        image: '/images/pictures/merchandise_resmi_honda_img.jpg',
        description: 'Koleksi merchandise eksklusif seperti jaket riding elegan, t-shirt kasual, payung, dan topi resmi Honda.',
        badge: 'Edisi Eksklusif',
    },
    {
        id: 5,
        title: 'Voucher Pembelian Motor',
        category: 'spesial',
        categoryLabel: 'Hadiah Spesial',
        points: 800,
        image: '/images/pictures/voucher_pembelian_motor_img.jpg',
        description: 'Voucher potongan tambahan uang muka (DP) atau cashback pembelian unit baru sepeda motor Honda di dealer resmi.',
        badge: 'Nilai Tertinggi',
    },
    {
        id: 6,
        title: 'Kesempatan Mengikuti Undian Hadiah Khusus',
        category: 'spesial',
        categoryLabel: 'Hadiah Spesial',
        points: 50,
        image: '/images/pictures/kesempatan_mengikuti_undian_hadiah_khusus_img.jpg',
        description: 'Kupon partisipasi undian reward tahunan dengan kesempatan memenangkan hadiah grand prize khusus Honda.',
        badge: 'Kesempatan Emas',
    },
];

// Simulasi Poin Interaktif (Aktivitas Resmi)
const SIMULATION_ITEMS = [
    { id: 'servis_ahass', name: 'Servis berkala di AHASS', points: 150 },
    { id: 'sparepart_aksesori', name: 'Pembelian suku cadang atau aksesori Honda', points: 100 },
    { id: 'beli_motor', name: 'Pembelian motor Honda', points: 500 },
    { id: 'event_dealer', name: 'Mengikuti event dealer', points: 75 },
    { id: 'test_ride', name: 'Mengikuti test ride', points: 50 },
    { id: 'referral_motor', name: 'Mengajak teman atau keluarga membeli motor Honda (program referral)', points: 300 },
    { id: 'ulasan_dealer', name: 'Memberikan ulasan atau penilaian layanan dealer saat servis atau pembelian motor', points: 40 },
];

export default function Welcome() {
    const { auth } = usePage<PageProps>().props;
    const dashboardUrl = '/dashboard';

    // State Hero Carousel
    const [currentSlide, setCurrentSlide] = useState(0);

    // State Mobile Menu
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // State Filter Katalog
    const [catalogFilter, setCatalogFilter] = useState<'semua' | 'servis' | 'aksesori' | 'spesial'>('semua');

    // State Simulasi Poin
    const [selectedSimItems, setSelectedSimItems] = useState<string[]>([
        'servis_rutin',
        'oli_transaksi',
        'review',
    ]);

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

    // Filter katalog
    const filteredRewards = catalogFilter === 'semua'
        ? REWARD_CATALOG
        : REWARD_CATALOG.filter((item) => item.category === catalogFilter);

    // Hitung total simulasi poin
    const totalSimulatedPoints = SIMULATION_ITEMS
        .filter((item) => selectedSimItems.includes(item.id))
        .reduce((sum, item) => sum + item.points, 0);

    const toggleSimItem = (id: string) => {
        setSelectedSimItems((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="min-h-screen bg-white text-zinc-900 antialiased selection:bg-red-600 selection:text-white dark:bg-zinc-950 dark:text-zinc-100">
            <Head title="Honda Customer Rewards - Program Loyalitas Resmi Honda & AHASS">
                <meta
                    name="description"
                    content="Semakin aktif bersama Honda, semakin banyak hadiahnya. Kumpulkan poin loyalitas dari servis AHASS, beli suku cadang, dan nikmati hadiah eksklusif."
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
                            Hubungi Dealer
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
                                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3.5 py-2 xl:px-4.5 xl:py-2.5 text-xs xl:text-sm font-semibold text-white shadow-md shadow-red-600/25 transition-all hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 active:scale-95 whitespace-nowrap"
                                >
                                    <span className="hidden xl:inline">Daftar / Dapatkan ID MEMBER</span>
                                    <span className="xl:hidden">Daftar ID MEMBER</span>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu & Theme Button */}
                    <div className="flex lg:hidden items-center gap-2">
                        <ThemeToggle />
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 cursor-pointer"
                            aria-label="Buka Menu"
                        >
                            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Drawer Menu */}
                {mobileMenuOpen && (
                    <div className="lg:hidden border-b border-zinc-200 bg-white px-4 pt-3 pb-6 dark:border-zinc-800 dark:bg-zinc-950">
                        <nav className="flex flex-col space-y-3 font-medium text-sm text-zinc-700 dark:text-zinc-300">
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
                                <span>Program Loyalitas Resmi Dealer & AHASS</span>
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
                                hingga partisipasi event kini bernilai poin yang siap ditukar.
                            </p>

                            {/* CTA Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                                <Link
                                    href={register()}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-red-600 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-red-600/30 transition-all hover:bg-red-700 hover:shadow-red-600/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                                >
                                    <Sparkles className="size-5" />
                                    <span>Daftar Sekarang & Dapatkan ID MEMBER</span>
                                </Link>

                                <a
                                    href="#cara-kerja"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white/80 px-6 py-3.5 text-base font-semibold text-zinc-800 backdrop-blur-sm transition-all hover:bg-zinc-100 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800 active:scale-95"
                                >
                                    <span>Pelajari Cara Kerja</span>
                                </a>
                            </div>

                            {/* Trust Badges */}
                            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-zinc-200 dark:border-zinc-800 text-left">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold text-sm">
                                        <CheckCircle2 className="size-4" />
                                        <span>Resmi AHASS</span>
                                    </div>
                                    <p className="text-xs text-zinc-500">100% Layanan & Part Orisinil</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold text-sm">
                                        <Zap className="size-4" />
                                        <span>Poin Otomatis</span>
                                    </div>
                                    <p className="text-xs text-zinc-500">Scan ID Langsung Masuk</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold text-sm">
                                        <Gift className="size-4" />
                                        <span>Banyak Hadiah</span>
                                    </div>
                                    <p className="text-xs text-zinc-500">Oli, Voucher, Undian</p>
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
                        <div className="relative rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-red-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-900/60">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 mb-5">
                                <HeartHandshake className="size-6" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                                Apresiasi Nyata
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                Setiap rupiah yang Anda belanjakan untuk servis atau suku cadang di AHASS tidak terbuang sia-sia, melainkan berbuah poin hadiah.
                            </p>
                        </div>

                        <div className="relative rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-red-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-900/60">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 mb-5">
                                <ShieldCheck className="size-6" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                                100% Resmi & Aman
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                Sistem pencatatan digital terintegrasi langsung dengan dealer resmi dan AHASS terpercaya dengan standar kualitas pabrikan Honda.
                            </p>
                        </div>

                        <div className="relative rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-red-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-900/60">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 mb-5">
                                <Award className="size-6" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                                Pilihan Reward Beragam
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                Tukarkan poin dengan potongan biaya jasa servis, oli Honda asli gratis, aksesoris, merchandise eksklusif, hingga voucher motor.
                            </p>
                        </div>

                        <div className="relative rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-red-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-900/60">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 mb-5">
                                <Sparkles className="size-6" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                                Undian Hadiah Spesial
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                Peluang mengikuti undian khusus member berhadiah gadget canggih, voucher belanja, dan hadiah kejutan berkala dari dealer.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 4. CARA MENGUMPULKAN POIN                                                 */}
            {/* ========================================================================= */}
            <section id="cara-poin" className="py-20 bg-white dark:bg-zinc-950">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center space-y-4">
                        <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400">
                            Aktivitas Berhadiah
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
                            Cara Mudah Mengumpulkan Poin
                        </h2>
                        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Kumpulkan poin dari berbagai macam kegiatan Anda bersama dealer dan AHASS.
                            Semakin sering Anda berinteraksi, semakin cepat poin Anda bertambah!
                        </p>
                    </div>

                    <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {POINT_ACTIVITIES.map((act, idx) => {
                            const IconComp = act.icon;
                            return (
                                <div
                                    key={idx}
                                    className="group relative rounded-2xl border border-zinc-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-red-500/50 hover:shadow-xl hover:shadow-red-600/5 dark:border-zinc-800 dark:bg-zinc-900/70"
                                >
                                    <div className="flex items-start justify-between gap-4 mb-5">
                                        <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/40 group-hover:scale-110 transition-transform">
                                            <IconComp className="size-6" />
                                        </div>
                                        <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-sm shadow-red-600/30">
                                            {act.points}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                            {act.category} &bull; {act.highlight}
                                        </span>
                                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                            {act.title}
                                        </h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                            {act.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Banner ajakan daftar di bawah grid poin */}
                    <div className="mt-12 rounded-2xl bg-gradient-to-r from-red-600 via-red-700 to-rose-700 p-8 text-white shadow-xl shadow-red-600/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="space-y-2 text-center sm:text-left">
                            <h4 className="text-xl sm:text-2xl font-extrabold">
                                Siap Mulai Mengumpulkan Poin Pertama Anda?
                            </h4>
                            <p className="text-sm text-red-100 max-w-xl">
                                Dapatkan bonus 50 Poin sambutan saat pertama kali Anda mendaftar dan memverifikasi ID MEMBER.
                            </p>
                        </div>
                        <Link
                            href={register()}
                            className="whitespace-nowrap rounded-xl bg-white px-6 py-3 text-sm font-bold text-red-700 shadow-md transition-all hover:bg-red-50 hover:scale-105 active:scale-95"
                        >
                            Daftar Sekarang
                        </Link>
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 5. KATALOG HADIAH (PENUKARAN POIN)                                        */}
            {/* ========================================================================= */}
            <section id="katalog-hadiah" className="py-20 bg-zinc-50 border-t border-zinc-200/80 dark:bg-zinc-900/30 dark:border-zinc-800/80">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center space-y-4">
                        <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400">
                            Reward Eksklusif
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
                            Katalog Hadiah Penukaran Poin
                        </h2>
                        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Pilih hadiah menarik yang bisa Anda tukarkan dengan saldo poin Anda.
                            Semua hadiah dijamin orisinil dan dapat diklaim melalui aplikasi atau staf dealer.
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

                    {/* Rewards Grid */}
                    <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredRewards.map((reward) => (
                            <div
                                key={reward.id}
                                className="group flex flex-col rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-red-400 dark:border-zinc-800 dark:bg-zinc-900"
                            >
                                {/* Image Container */}
                                <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                    <img
                                        src={reward.image}
                                        alt={reward.title}
                                        className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    <div className="absolute top-3 left-3">
                                        <span className="rounded-md bg-zinc-900/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white">
                                            {reward.categoryLabel}
                                        </span>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-extrabold text-white shadow-md shadow-red-600/40">
                                            {reward.points} POIN
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex flex-1 flex-col justify-between p-6 space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-red-600 dark:text-red-400">
                                                {reward.badge}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                            {reward.title}
                                        </h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                            {reward.description}
                                        </p>
                                    </div>

                                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                            Tukar di Dealer / AHASS
                                        </span>
                                        <Link
                                            href={register()}
                                            className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                        >
                                            <span>Daftar & Klaim</span>
                                            <ChevronRight className="size-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 6. CARA KERJA (LANGKAH-LANGKAH MUDAH)                                      */}
            {/* ========================================================================= */}
            <section id="cara-kerja" className="py-20 bg-white dark:bg-zinc-950">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center space-y-4">
                        <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400">
                            Alur Program
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
                            4 Langkah Mudah Menikmati Hadiah
                        </h2>
                        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Bergabung dan mengumpulkan poin sangatlah praktis. Cukup 4 langkah sederhana dari pendaftaran hingga penukaran.
                        </p>
                    </div>

                    <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                        {/* Step 1 */}
                        <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-sm">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white font-extrabold text-xl shadow-lg shadow-red-600/30 mb-6">
                                1
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                                Dapatkan ID MEMBER
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                Pelanggan mendaftar melalui aplikasi/website atau dibantu staf di dealer dan akan mendapatkan ID MEMBER resmi.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-sm">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white font-extrabold text-xl shadow-lg shadow-red-600/30 mb-6">
                                2
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                                Tunjukkan ID MEMBER
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                Tunjukkan ID MEMBER Anda kepada staf dealer setiap kali Anda selesai transaksi (servis, suku cadang, motor) atau event.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-sm">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white font-extrabold text-xl shadow-lg shadow-red-600/30 mb-6">
                                3
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                                Poin Otomatis Masuk
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                Staf dealer akan melakukan scan ID MEMBER atau meng-input data aktivitas Anda agar poin langsung bertambah ke akun Anda.
                            </p>
                        </div>

                        {/* Step 4 */}
                        <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-sm">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white font-extrabold text-xl shadow-lg shadow-red-600/30 mb-6">
                                4
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                                Tukarkan dengan Hadiah
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                Pantau saldo poin yang telah terkumpul dan tukarkan dengan hadiah pilihan melalui aplikasi atau langsung di dealer resmi.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 7. PROMO KHUSUS & SIMULASI POIN INTERAKTIF                                */}
            {/* ========================================================================= */}
            <section className="py-20 bg-zinc-50 border-t border-zinc-200/80 dark:bg-zinc-900/40 dark:border-zinc-800/80">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        {/* Kolom Kiri: Promo Banner */}
                        <div className="lg:col-span-5 space-y-6">
                            <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-red-600 dark:text-red-400">
                                Promo Khusus Dealer
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
                                Dapatkan Poin Ganda di Bulan Ini
                            </h2>
                            <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                Kami rutin menghadirkan promo personal dan kejutan poin ganda untuk hari pelanggan,
                                servis berkala kelipatan 5.000 KM, serta festival AHASS.
                            </p>

                            <div className="space-y-4">
                                <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 dark:border-red-900/40 dark:bg-red-950/40">
                                    <div className="flex items-center gap-3">
                                        <Tag className="size-5 text-red-600" />
                                        <h4 className="font-bold text-zinc-900 dark:text-white text-sm">
                                            Double Poin Servis Hari Pelanggan
                                        </h4>
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                        Dapatkan poin 2x lipat untuk servis tune up lengkap di hari Senin & Rabu.
                                    </p>
                                </div>

                                <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                                    <div className="flex items-center gap-3">
                                        <Gift className="size-5 text-red-600" />
                                        <h4 className="font-bold text-zinc-900 dark:text-white text-sm">
                                            Bonus Sambutan Anggota Baru
                                        </h4>
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                        Langsung raih 50 Poin pertama tanpa transaksi setelah mendaftarkan akun ID MEMBER Anda.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Kolom Kanan: Simulasi Poin Interaktif */}
                        <div className="lg:col-span-7">
                            <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5 dark:border-zinc-800">
                                    <div>
                                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                                            Kalkulator Simulasi Poin
                                        </h3>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                            Pilih aktivitas yang Anda rencanakan untuk melihat potensi poin Anda
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-semibold text-zinc-400 uppercase">Estimasi Saldo</span>
                                        <div className="text-2xl font-black text-red-600 dark:text-red-500">
                                            {totalSimulatedPoints} POIN
                                        </div>
                                    </div>
                                </div>

                                {/* Pilihan Item Simulasi */}
                                <div className="mt-6 space-y-3">
                                    {SIMULATION_ITEMS.map((item) => {
                                        const isChecked = selectedSimItems.includes(item.id);
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => toggleSimItem(item.id)}
                                                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                                                    isChecked
                                                        ? 'border-red-500/80 bg-red-50/50 dark:bg-red-950/30 text-zinc-900 dark:text-white'
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
                                                    <span className="text-sm font-medium">{item.name}</span>
                                                </div>
                                                <span className="text-xs font-bold text-red-600 dark:text-red-400">
                                                    +{item.points} Poin
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
                                                🎉 Hebat! Poin ini cukup untuk ditukarkan dengan Oli Honda Asli atau Voucher Servis!
                                            </span>
                                        ) : (
                                            <span>
                                                Pilih lebih banyak aktivitas untuk melihat reward yang bisa Anda bawa pulang.
                                            </span>
                                        )}
                                    </div>
                                    <Link
                                        href={register()}
                                        className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/30 hover:bg-red-700"
                                    >
                                        Mulai Kumpulkan Poin Ini
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* 8. FOOTER (BAWAH HALAMAN)                                                 */}
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
                                        Panduan Klaim Reward
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
