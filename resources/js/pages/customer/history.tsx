import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowLeft,
    ArrowRight,
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
    FileText,
    Filter,
    Flame,
    Gift,
    MessageSquare,
    QrCode,
    RotateCcw,
    Search,
    Shield,
    ShoppingBag,
    Sparkles,
    Star,
    Users,
    Wrench,
    X,
    Zap,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import CustomerLayout from '@/layouts/customer-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type HistoryItem = {
    id: string;
    activity_id: string;
    title: string;
    dealer: string;
    admin_name: string;
    points: number;
    type: 'credit' | 'debit';
    notes: string | null;
    date: string;
    raw_date: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedHistories = {
    data: HistoryItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
};

type Stats = {
    currentPoints: number;
    lifetimePoints: number;
    totalActivities: number;
    pointsThisMonth: number;
    tier: string;
    tierBadge: string;
};

type EarningActivity = {
    id: string;
    name: string;
    points: number;
    description: string;
};

type Props = {
    histories: PaginatedHistories;
    earningActivities?: EarningActivity[];
    stats: Stats;
    filters: {
        search: string;
        period: string;
    };
    memberId: string;
};

export default function CustomerHistoryPage({
    histories,
    earningActivities = [],
    stats,
    filters,
    memberId,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedPeriod, setSelectedPeriod] = useState(
        filters.period || 'all',
    );
    const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(
        null,
    );
    const [copiedTxId, setCopiedTxId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'history' | 'earning'>(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('tab') === 'earning') return 'earning';
        }
        return 'history';
    });

    const formattedMemberId = memberId
        .padStart(10, '0')
        .replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/activities',
            {
                search: search.trim() || undefined,
                period: selectedPeriod !== 'all' ? selectedPeriod : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handlePeriodChange = (period: string) => {
        setSelectedPeriod(period);
        router.get(
            '/activities',
            {
                search: search.trim() || undefined,
                period: period !== 'all' ? period : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        setSelectedPeriod('all');
        router.get(
            '/activities',
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleCopyTxId = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedTxId(id);
        toast.success(`No. Referensi #${id} berhasil disalin`);
        setTimeout(() => setCopiedTxId(null), 2000);
    };

    const getActivityIcon = (title: string) => {
        const lower = title.toLowerCase();
        if (
            lower.includes('servis') ||
            lower.includes('tune') ||
            lower.includes('ahass')
        ) {
            return (
                <Wrench className="size-4.5 text-red-600 dark:text-red-400" />
            );
        }
        if (
            lower.includes('suku cadang') ||
            lower.includes('aksesori') ||
            lower.includes('part')
        ) {
            return (
                <ShoppingBag className="size-4.5 text-amber-600 dark:text-amber-400" />
            );
        }
        if (lower.includes('beli motor') || lower.includes('pembelian motor')) {
            return (
                <Sparkles className="size-4.5 text-rose-600 dark:text-rose-400" />
            );
        }
        if (lower.includes('event')) {
            return (
                <Calendar className="size-4.5 text-blue-600 dark:text-blue-400" />
            );
        }
        if (lower.includes('test ride')) {
            return (
                <Zap className="size-4.5 text-orange-600 dark:text-orange-400" />
            );
        }
        if (
            lower.includes('referral') ||
            lower.includes('teman') ||
            lower.includes('keluarga')
        ) {
            return (
                <Users className="size-4.5 text-purple-600 dark:text-purple-400" />
            );
        }
        if (
            lower.includes('ulasan') ||
            lower.includes('penilaian') ||
            lower.includes('rating')
        ) {
            return (
                <MessageSquare className="size-4.5 text-emerald-600 dark:text-emerald-400" />
            );
        }
        if (
            lower.includes('bonus') ||
            lower.includes('hadiah') ||
            lower.includes('selamat')
        ) {
            return (
                <Gift className="size-4.5 text-emerald-600 dark:text-emerald-400" />
            );
        }
        return <Award className="size-4.5 text-red-600 dark:text-red-400" />;
    };

    const getActivityBg = (title: string) => {
        const lower = title.toLowerCase();
        if (
            lower.includes('servis') ||
            lower.includes('tune') ||
            lower.includes('ahass')
        ) {
            return 'bg-red-50 dark:bg-red-950/60 border-red-200/60 dark:border-red-900/40';
        }
        if (
            lower.includes('suku cadang') ||
            lower.includes('aksesori') ||
            lower.includes('part')
        ) {
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
        if (
            lower.includes('referral') ||
            lower.includes('teman') ||
            lower.includes('keluarga')
        ) {
            return 'bg-purple-50 dark:bg-purple-950/60 border-purple-200/60 dark:border-purple-900/40';
        }
        if (
            lower.includes('ulasan') ||
            lower.includes('penilaian') ||
            lower.includes('rating')
        ) {
            return 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/60 dark:border-emerald-900/40';
        }
        if (
            lower.includes('bonus') ||
            lower.includes('hadiah') ||
            lower.includes('selamat')
        ) {
            return 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/60 dark:border-emerald-900/40';
        }
        return 'bg-red-50 dark:bg-red-950/60 border-red-200/60 dark:border-red-900/40';
    };

    const isFiltered = !!filters.search || filters.period !== 'all';

    return (
        <CustomerLayout activeTab="activities">
            <Head title="Aktivitas & Perolehan Poin - Honda Loyalty Rewards" />

            <div className="mx-auto w-full max-w-4xl space-y-6 pb-8">
                {/* ========================================================================= */}
                {/* 1. HEADER SECTION DENGAN BREADCRUMB & IDENTITAS                           */}
                {/* ========================================================================= */}
                <div className="flex flex-col justify-between gap-3 pt-2 sm:flex-row sm:items-center">
                    <div className="space-y-1">
                        <Link
                            href="/dashboard"
                            className="group mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 transition-colors hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
                        >
                            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                            <span>Kembali ke Beranda</span>
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/20">
                                <Clock className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight text-zinc-900 sm:text-2xl dark:text-white">
                                    Aktivitas & Perolehan Poin
                                </h1>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Periksa riwayat transaksi servis Anda di
                                    AHASS serta daftar aktivitas resmi Honda
                                    yang dapat menghasilkan poin rewards
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className="border-zinc-200 bg-white px-3 py-1 font-mono text-[11px] font-semibold dark:border-zinc-800 dark:bg-zinc-900"
                        >
                            <Shield className="mr-1.5 size-3 text-red-600" />
                            ID: {formattedMemberId}
                        </Badge>
                        <Badge className="bg-red-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-red-700">
                            {stats.tierBadge}
                        </Badge>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 2. STATISTIK RINGKAS (OVERVIEW METRICS)                                   */}
                {/* ========================================================================= */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {/* Card 1: Saldo Poin Aktif */}
                    <div className="relative overflow-hidden rounded-2xl border border-red-200/80 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent p-4 dark:border-red-900/40 dark:from-red-950/40">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                                Saldo Poin Aktif
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/80 dark:text-red-400">
                                <Coins className="size-3.5" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="font-mono text-xl font-black text-red-600 sm:text-2xl dark:text-red-500">
                                {stats.currentPoints.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-500">
                                Poin
                            </span>
                        </div>
                    </div>

                    {/* Card 2: Total Poin Diperoleh */}
                    <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 dark:border-amber-900/40 dark:from-amber-950/40">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                                Total Poin Didapat
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400">
                                <Award className="size-3.5" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="font-mono text-xl font-black text-amber-600 sm:text-2xl dark:text-amber-400">
                                {stats.lifetimePoints.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-500">
                                Poin
                            </span>
                        </div>
                    </div>

                    {/* Card 3: Total Transaksi */}
                    <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-4 dark:border-emerald-900/40 dark:from-emerald-950/40">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                                Total Transaksi
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
                                <CheckCircle2 className="size-3.5" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="font-mono text-xl font-black text-emerald-600 sm:text-2xl dark:text-emerald-400">
                                {stats.totalActivities.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-500">
                                Aktivitas
                            </span>
                        </div>
                    </div>

                    {/* Card 4: Poin Bulan Ini */}
                    <div className="relative overflow-hidden rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent p-4 dark:border-blue-900/40 dark:from-blue-950/40">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                                Poin Bulan Ini
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
                                <Flame className="size-3.5" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="font-mono text-xl font-black text-blue-600 sm:text-2xl dark:text-blue-400">
                                +{stats.pointsThisMonth.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-500">
                                Poin
                            </span>
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 3. TABS NAVIGASI: RIWAYAT AKTIVITAS & DAFTAR AKTIVITAS BERHADIAH POIN     */}
                {/* ========================================================================= */}
                <div className="flex items-center gap-2 rounded-2xl border border-zinc-200/80 bg-zinc-200/60 p-1.5 dark:border-zinc-700/60 dark:bg-zinc-800/60">
                    <button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                            activeTab === 'history'
                                ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white'
                                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                        }`}
                    >
                        <Clock className="size-4 text-red-600 dark:text-red-500" />
                        <span>Riwayat Aktivitas Saya</span>
                        <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            {histories.total}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('earning')}
                        className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                            activeTab === 'earning'
                                ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white'
                                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                        }`}
                    >
                        <Sparkles className="size-4 text-amber-500" />
                        <span>Aktivitas Berhadiah Poin</span>
                        <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                            {earningActivities.length} Pilihan
                        </span>
                    </button>
                </div>

                {/* TAB 1: RIWAYAT AKTIVITAS TRANSAKSI SAYA */}
                {activeTab === 'history' && (
                    <div className="space-y-6">
                        {/* Callout Banner ke Daftar Aktivitas */}
                        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-red-200/70 bg-gradient-to-r from-red-600/10 via-amber-500/10 to-transparent p-4 sm:flex-row sm:items-center dark:border-red-900/40">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
                                    <Sparkles className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                                        Ingin Menambah Poin Rewards Anda?
                                    </h3>
                                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                                        Terdapat {earningActivities.length}{' '}
                                        aktivitas resmi servis di AHASS yang
                                        dapat menghasilkan hingga ratusan poin
                                        setiap transaksi.
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                onClick={() => setActiveTab('earning')}
                                className="h-9 shrink-0 cursor-pointer rounded-xl bg-red-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-red-700"
                            >
                                Lihat Daftar Aktivitas
                                <ArrowRight className="ml-1.5 size-3.5" />
                            </Button>
                        </div>

                        {/* Toolbar Pencarian & Filter */}
                        <div className="space-y-3 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                            <form
                                onSubmit={handleSearchSubmit}
                                className="flex flex-col gap-2 sm:flex-row"
                            >
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400" />
                                    <Input
                                        type="text"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Cari nama aktivitas, nomor ID transaksi (#10 digit), atau catatan..."
                                        className="rounded-xl border-zinc-200 bg-zinc-50/70 pr-8 pl-9 text-xs focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-950"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => setSearch('')}
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="submit"
                                        size="sm"
                                        className="rounded-xl bg-red-600 px-4 text-xs font-semibold text-white hover:bg-red-700"
                                    >
                                        Cari
                                    </Button>
                                    {isFiltered && (
                                        <Button
                                            type="button"
                                            onClick={handleResetFilters}
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl border-zinc-200 text-xs dark:border-zinc-800"
                                            title="Reset semua filter"
                                        >
                                            <RotateCcw className="mr-1 size-3.5" />
                                            Reset
                                        </Button>
                                    )}
                                </div>
                            </form>

                            {/* Filter Periode Pills */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 text-xs">
                                <span className="mr-1 flex shrink-0 items-center gap-1 text-[11px] font-semibold text-zinc-400">
                                    <Filter className="size-3" /> Periode:
                                </span>
                                {[
                                    { id: 'all', label: 'Semua Waktu' },
                                    { id: 'this_month', label: 'Bulan Ini' },
                                    {
                                        id: 'last_3_months',
                                        label: '3 Bulan Terakhir',
                                    },
                                    { id: 'this_year', label: 'Tahun Ini' },
                                ].map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => handlePeriodChange(p.id)}
                                        className={`cursor-pointer rounded-xl px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all ${
                                            selectedPeriod === p.id
                                                ? 'bg-red-600 text-white shadow-xs'
                                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ========================================================================= */}
                        {/* 4. DAFTAR MUTASI RIWAYAT TRANSAKSI                                        */}
                        {/* ========================================================================= */}
                        <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <Clock className="size-4 text-red-600" />
                                    <h2 className="text-xs font-bold tracking-wider text-zinc-900 uppercase dark:text-zinc-100">
                                        Catatan Mutasi Transaksi
                                    </h2>
                                </div>
                                <span className="text-xs font-semibold text-zinc-500">
                                    Menampilkan {histories.data.length} dari{' '}
                                    {histories.total} transaksi
                                </span>
                            </div>

                            {histories.data.length > 0 ? (
                                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {histories.data.map((h) => (
                                        <div
                                            key={h.id}
                                            onClick={() =>
                                                setSelectedHistory(h)
                                            }
                                            className="group flex cursor-pointer flex-col justify-between gap-3 p-4 transition-colors hover:bg-zinc-50/80 sm:flex-row sm:items-center sm:p-5 dark:hover:bg-zinc-800/40"
                                        >
                                            {/* Left: Icon, Title, Dealer, Date */}
                                            <div className="flex items-start gap-3.5">
                                                <div
                                                    className={`flex size-10 shrink-0 items-center justify-center rounded-2xl border shadow-xs transition-transform group-hover:scale-105 ${getActivityBg(
                                                        h.title,
                                                    )}`}
                                                >
                                                    {getActivityIcon(h.title)}
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-xs font-bold text-zinc-900 transition-colors group-hover:text-red-600 sm:text-sm dark:text-white dark:group-hover:text-red-400">
                                                            {h.title}
                                                        </h3>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopyTxId(
                                                                    h.id,
                                                                );
                                                            }}
                                                            className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-bold text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                                            title="Salin No. Transaksi"
                                                        >
                                                            <span>#{h.id}</span>
                                                            {copiedTxId ===
                                                            h.id ? (
                                                                <Check className="size-2.5 text-emerald-600" />
                                                            ) : (
                                                                <Copy className="size-2.5 text-zinc-400" />
                                                            )}
                                                        </button>
                                                    </div>

                                                    <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                                                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                                            {h.dealer}
                                                        </span>
                                                        <span>&bull;</span>
                                                        <span className="inline-flex items-center gap-1">
                                                            <Calendar className="size-3 text-zinc-400" />
                                                            {h.date} WIB
                                                        </span>
                                                    </p>

                                                    {h.notes && (
                                                        <p className="inline-block rounded-md bg-zinc-100/70 px-2 py-0.5 text-[11px] font-normal text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400">
                                                            &ldquo;{h.notes}
                                                            &rdquo;
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: Points Pill & Details Trigger */}
                                            <div className="flex shrink-0 items-center justify-between border-t border-zinc-100 pt-2 sm:flex-col sm:items-end sm:justify-center sm:border-t-0 sm:pt-0 dark:border-zinc-800">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 dark:border-emerald-900/50 dark:bg-emerald-950/60">
                                                        <ArrowUpRight className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                                        <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                                                            +{h.points} Poin
                                                        </span>
                                                    </div>
                                                </div>

                                                <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-red-400">
                                                    Detail Transaksi{' '}
                                                    <ChevronRight className="size-3" />
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Empty State */
                                <div className="space-y-4 p-8 text-center sm:p-12">
                                    <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                                        <Clock className="size-7" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                                            {isFiltered
                                                ? 'Tidak Ada Riwayat yang Cocok'
                                                : 'Belum Ada Riwayat Transaksi'}
                                        </h3>
                                        <p className="mx-auto max-w-sm text-xs text-zinc-500">
                                            {isFiltered
                                                ? 'Coba ganti kata kunci pencarian atau ubah pilihan filter periode waktu Anda.'
                                                : 'Lakukan servis motor atau pembelian suku cadang di bengkel resmi AHASS untuk mulai mengumpulkan poin rewards.'}
                                        </p>
                                    </div>
                                    {isFiltered ? (
                                        <Button
                                            type="button"
                                            onClick={handleResetFilters}
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl text-xs"
                                        >
                                            Reset Filter
                                        </Button>
                                    ) : (
                                        <Link
                                            href="/dashboard"
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-700"
                                        >
                                            Tunjukkan QR ke Kasir AHASS
                                        </Link>
                                    )}
                                </div>
                            )}

                            {/* ========================================================================= */}
                            {/* PAGINATION                                                                */}
                            {/* ========================================================================= */}
                            {histories.last_page > 1 && (
                                <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/50 px-5 py-3.5 sm:flex-row dark:border-zinc-800 dark:bg-zinc-900/50">
                                    <span className="text-xs text-zinc-500">
                                        Halaman {histories.current_page} dari{' '}
                                        {histories.last_page}
                                    </span>

                                    <div className="flex items-center gap-1">
                                        {histories.links.map((link, idx) => {
                                            if (
                                                !link.url &&
                                                link.label.includes('Previous')
                                            ) {
                                                return (
                                                    <Button
                                                        key={idx}
                                                        variant="outline"
                                                        size="sm"
                                                        disabled
                                                        className="h-8 rounded-xl px-2.5 text-xs"
                                                    >
                                                        <ChevronLeft className="mr-1 size-3.5" />{' '}
                                                        Prev
                                                    </Button>
                                                );
                                            }
                                            if (
                                                !link.url &&
                                                link.label.includes('Next')
                                            ) {
                                                return (
                                                    <Button
                                                        key={idx}
                                                        variant="outline"
                                                        size="sm"
                                                        disabled
                                                        className="h-8 rounded-xl px-2.5 text-xs"
                                                    >
                                                        Next{' '}
                                                        <ChevronRight className="ml-1 size-3.5" />
                                                    </Button>
                                                );
                                            }

                                            if (
                                                link.label.includes('Previous')
                                            ) {
                                                return (
                                                    <Link
                                                        key={idx}
                                                        href={link.url!}
                                                        preserveScroll
                                                        preserveState
                                                        className="inline-flex h-8 items-center justify-center rounded-xl border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                                    >
                                                        <ChevronLeft className="mr-1 size-3.5" />{' '}
                                                        Prev
                                                    </Link>
                                                );
                                            }

                                            if (link.label.includes('Next')) {
                                                return (
                                                    <Link
                                                        key={idx}
                                                        href={link.url!}
                                                        preserveScroll
                                                        preserveState
                                                        className="inline-flex h-8 items-center justify-center rounded-xl border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                                    >
                                                        Next{' '}
                                                        <ChevronRight className="ml-1 size-3.5" />
                                                    </Link>
                                                );
                                            }

                                            return (
                                                <Link
                                                    key={idx}
                                                    href={link.url!}
                                                    preserveScroll
                                                    preserveState
                                                    className={`inline-flex h-8 min-w-8 items-center justify-center rounded-xl px-2.5 text-xs font-semibold transition-colors ${
                                                        link.active
                                                            ? 'bg-red-600 font-bold text-white shadow-xs'
                                                            : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                                                    }`}
                                                >
                                                    {link.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 2: DAFTAR AKTIVITAS YANG BISA MEMPEROLEH POIN (KATALOG AKTIVITAS RESMI) */}
                {activeTab === 'earning' && (
                    <div className="space-y-6">
                        {/* Banner Panduan Cara Dapat Poin */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-red-700 to-zinc-950 p-6 text-white shadow-xl shadow-red-950/20 sm:p-8">
                            <div className="pointer-events-none absolute -right-6 -bottom-10 opacity-15 select-none">
                                <img
                                    src="/images/logo/honda_logo_white.png"
                                    alt="Honda"
                                    className="h-auto w-64 sm:w-80"
                                />
                            </div>

                            <div className="relative z-10 max-w-2xl space-y-4">
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-bold text-white shadow-xs backdrop-blur-md">
                                    <Sparkles className="size-3.5 text-amber-300" />
                                    Panduan Perolehan Poin AHASS
                                </div>

                                <div>
                                    <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl md:text-3xl">
                                        Cara Kumpulkan Poin Rewards
                                    </h2>
                                    <p className="mt-1.5 text-xs leading-relaxed text-red-100/90 sm:text-sm">
                                        Setiap kali Anda melakukan servis motor
                                        Honda atau pembelian suku cadang asli di
                                        bengkel resmi AHASS, tunjukkan ID Member
                                        Anda ke kasir untuk mendapatkan poin
                                        reward yang terakumulasi!
                                    </p>
                                </div>

                                {/* Step Grid */}
                                <div className="grid grid-cols-1 gap-2.5 pt-1 text-xs sm:grid-cols-4">
                                    <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                                        <span className="font-mono text-[10px] font-bold text-red-300">
                                            LANGKAH 1
                                        </span>
                                        <p className="mt-1 font-bold text-white">
                                            Kunjungi AHASS
                                        </p>
                                        <p className="mt-0.5 text-[10px] text-red-200/80">
                                            Datang ke bengkel resmi AHASS
                                            terdekat.
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                                        <span className="font-mono text-[10px] font-bold text-red-300">
                                            LANGKAH 2
                                        </span>
                                        <p className="mt-1 font-bold text-white">
                                            Pilih Servis
                                        </p>
                                        <p className="mt-0.5 text-[10px] text-red-200/80">
                                            Lakukan servis motor atau beli
                                            sparepart asli.
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                                        <span className="font-mono text-[10px] font-bold text-red-300">
                                            LANGKAH 3
                                        </span>
                                        <p className="mt-1 font-bold text-white">
                                            Tunjukkan ID QR
                                        </p>
                                        <p className="mt-0.5 text-[10px] text-red-200/80">
                                            Kasir / staf akan memindai QR Member
                                            Anda.
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                                        <span className="font-mono text-[10px] font-bold text-red-300">
                                            LANGKAH 4
                                        </span>
                                        <p className="mt-1 font-bold text-white">
                                            Poin Dikreditkan!
                                        </p>
                                        <p className="mt-0.5 text-[10px] text-red-200/80">
                                            Poin langsung masuk ke e-wallet akun
                                            Anda.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="button"
                                        onClick={() =>
                                            window.dispatchEvent(
                                                new CustomEvent(
                                                    'open-customer-qr-modal',
                                                ),
                                            )
                                        }
                                        className="h-10 cursor-pointer rounded-xl bg-white px-5 text-xs font-bold text-red-700 shadow-md hover:bg-red-50"
                                    >
                                        <QrCode className="mr-2 size-4 text-red-600" />
                                        Tunjukkan QR ID Member Saya
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Daftar Kartu Aktivitas Berhadiah Poin */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <div>
                                    <h2 className="text-sm font-black tracking-tight text-zinc-900 sm:text-base dark:text-white">
                                        Daftar Aktivitas Resmi Berhadiah Poin
                                    </h2>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        Pilih jenis perawatan atau transaksi
                                        berikut di AHASS untuk klaim poin
                                    </p>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="px-2.5 py-1 text-xs font-semibold"
                                >
                                    {earningActivities.length} Aktivitas
                                    Tersedia
                                </Badge>
                            </div>

                            {earningActivities.length === 0 ? (
                                <div className="rounded-2xl border border-zinc-200/90 bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                                    <Clock className="mx-auto mb-2 size-8 opacity-50" />
                                    <p className="text-xs font-semibold">
                                        Belum ada aktivitas terdaftar saat ini.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {earningActivities.map((act) => (
                                        <div
                                            key={act.id}
                                            className="group flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs transition-all hover:border-red-500/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                                        >
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div
                                                        className={`flex size-11 shrink-0 items-center justify-center rounded-2xl border shadow-xs transition-transform group-hover:scale-105 ${getActivityBg(
                                                            act.name,
                                                        )}`}
                                                    >
                                                        {getActivityIcon(
                                                            act.name,
                                                        )}
                                                    </div>
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/80 bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 shadow-xs dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                                                        <Coins className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                                        +
                                                        {act.points.toLocaleString(
                                                            'id-ID',
                                                        )}{' '}
                                                        Poin
                                                    </span>
                                                </div>

                                                <div>
                                                    <h3 className="text-sm font-bold text-zinc-900 transition-colors group-hover:text-red-600 sm:text-base dark:text-white dark:group-hover:text-red-400">
                                                        {act.name}
                                                    </h3>
                                                    <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                                                        {act.description ||
                                                            'Lakukan aktivitas servis resmi ini di seluruh jaringan bengkel AHASS.'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs dark:border-zinc-800">
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                                                    <Shield className="size-3 text-red-600" />
                                                    Bengkel Resmi AHASS
                                                </span>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() =>
                                                        window.dispatchEvent(
                                                            new CustomEvent(
                                                                'open-customer-qr-modal',
                                                            ),
                                                        )
                                                    }
                                                    className="h-8 cursor-pointer rounded-xl border border-red-200 bg-red-50 px-3 text-[11px] font-bold text-red-700 transition-colors hover:bg-red-600 hover:text-white dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-600 dark:hover:text-white"
                                                >
                                                    <QrCode className="mr-1.5 size-3" />
                                                    Tunjukkan ID
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="pt-4 text-center">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('history')}
                                    className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-zinc-500 transition-colors hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
                                >
                                    <Clock className="size-3.5" />
                                    <span>
                                        Lihat Riwayat Transaksi & Catatan Mutasi
                                        Saya &rarr;
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* 5. MODAL RINCIAN TRANSAKSI DIGITAL RESMI                                  */}
            {/* ========================================================================= */}
            <Dialog
                open={!!selectedHistory}
                onOpenChange={(open) => !open && setSelectedHistory(null)}
            >
                <DialogContent className="overflow-hidden rounded-3xl border-zinc-200 bg-white p-0 sm:max-w-md dark:border-zinc-800 dark:bg-zinc-900">
                    {selectedHistory && (
                        <div>
                            {/* Header: Red Gradient Banner */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-red-600 to-rose-700 p-6 text-center text-white">
                                <div className="pointer-events-none absolute -right-8 -bottom-8 opacity-20 select-none">
                                    <img
                                        src="/images/logo/honda_logo_white.png"
                                        alt="Honda"
                                        className="h-auto w-40"
                                    />
                                </div>

                                <div className="relative z-10 space-y-2">
                                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-white shadow-md backdrop-blur-md">
                                        <CheckCircle2 className="size-7 text-emerald-300" />
                                    </div>
                                    <span className="font-mono text-[10px] font-bold tracking-widest text-red-200 uppercase">
                                        HONDA REWARDS OFFICIAL TRANSACTION
                                    </span>
                                    <DialogTitle className="text-lg font-black text-white">
                                        Poin Berhasil Ditambahkan
                                    </DialogTitle>
                                    <div className="pt-1">
                                        <span className="font-mono text-3xl font-black text-white drop-shadow-sm sm:text-4xl">
                                            +{selectedHistory.points}
                                        </span>
                                        <span className="ml-1 text-xs font-bold text-red-100">
                                            POIN
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Record Body: Details Breakdown */}
                            <div className="space-y-4 p-6">
                                <div className="space-y-2.5 rounded-2xl border border-zinc-200/90 bg-zinc-50/80 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                                    {/* No Referensi */}
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-zinc-500">
                                            No. Referensi (ID)
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono font-bold text-zinc-900 dark:text-white">
                                                #{selectedHistory.id}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleCopyTxId(
                                                        selectedHistory.id,
                                                    )
                                                }
                                                className="p-0.5 text-zinc-400 transition-colors hover:text-red-600"
                                                title="Salin No Referensi"
                                            >
                                                {copiedTxId ===
                                                selectedHistory.id ? (
                                                    <Check className="size-3 text-emerald-500" />
                                                ) : (
                                                    <Copy className="size-3" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Nama Aktivitas */}
                                    <div className="flex items-start justify-between border-t border-zinc-200/60 pt-2 dark:border-zinc-800">
                                        <span className="font-medium text-zinc-500">
                                            Aktivitas
                                        </span>
                                        <span className="max-w-[200px] text-right font-bold text-zinc-900 dark:text-white">
                                            {selectedHistory.title}
                                        </span>
                                    </div>

                                    {/* Tanggal & Waktu */}
                                    <div className="flex items-center justify-between border-t border-zinc-200/60 pt-2 dark:border-zinc-800">
                                        <span className="font-medium text-zinc-500">
                                            Tanggal & Waktu
                                        </span>
                                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                            {selectedHistory.date} WIB
                                        </span>
                                    </div>

                                    {/* Bengkel & Petugas */}
                                    <div className="flex items-start justify-between border-t border-zinc-200/60 pt-2 dark:border-zinc-800">
                                        <span className="font-medium text-zinc-500">
                                            Lokasi AHASS
                                        </span>
                                        <span className="max-w-[200px] text-right font-semibold text-zinc-800 dark:text-zinc-200">
                                            {selectedHistory.dealer}
                                        </span>
                                    </div>

                                    {/* Petugas Kasir */}
                                    <div className="flex items-center justify-between border-t border-zinc-200/60 pt-2 dark:border-zinc-800">
                                        <span className="font-medium text-zinc-500">
                                            Petugas Input
                                        </span>
                                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                            {selectedHistory.admin_name}
                                        </span>
                                    </div>

                                    {/* Catatan */}
                                    {selectedHistory.notes && (
                                        <div className="flex items-start justify-between border-t border-zinc-200/60 pt-2 dark:border-zinc-800">
                                            <span className="font-medium text-zinc-500">
                                                Catatan
                                            </span>
                                            <span className="max-w-[200px] text-right font-medium text-zinc-700 italic dark:text-zinc-300">
                                                {selectedHistory.notes}
                                            </span>
                                        </div>
                                    )}

                                    {/* Status Validasi */}
                                    <div className="flex items-center justify-between border-t border-zinc-200/60 pt-2 dark:border-zinc-800">
                                        <span className="font-medium text-zinc-500">
                                            Status Verifikasi
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                            <Check className="size-2.5" />{' '}
                                            Terverifikasi Sistem AHASS
                                        </span>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <p className="text-[10px] text-zinc-400">
                                        Bukti digital ini adalah rekaman resmi
                                        perolehan poin program Honda Customer
                                        Loyalty Rewards.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2 border-t border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                                <Button
                                    type="button"
                                    onClick={() =>
                                        handleCopyTxId(selectedHistory.id)
                                    }
                                    variant="outline"
                                    className="flex-1 rounded-xl border-zinc-300 text-xs font-semibold dark:border-zinc-700"
                                >
                                    {copiedTxId === selectedHistory.id ? (
                                        <>
                                            <Check className="mr-1.5 size-3.5 text-emerald-500" />
                                            Disalin!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="mr-1.5 size-3.5" />
                                            Salin No. Referensi
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setSelectedHistory(null)}
                                    className="flex-1 rounded-xl bg-red-600 text-xs font-semibold text-white hover:bg-red-700"
                                >
                                    Tutup Detail
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </CustomerLayout>
    );
}
