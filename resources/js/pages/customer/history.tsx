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
    const [selectedPeriod, setSelectedPeriod] = useState(filters.period || 'all');
    const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(null);
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
        router.get('/activities', {}, { preserveState: true, preserveScroll: true });
    };

    const handleCopyTxId = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedTxId(id);
        toast.success(`No. Referensi #${id} berhasil disalin`);
        setTimeout(() => setCopiedTxId(null), 2000);
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
        if (lower.includes('bonus') || lower.includes('hadiah') || lower.includes('selamat')) {
            return <Gift className="size-4.5 text-emerald-600 dark:text-emerald-400" />;
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
        if (lower.includes('bonus') || lower.includes('hadiah') || lower.includes('selamat')) {
            return 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/60 dark:border-emerald-900/40';
        }
        return 'bg-red-50 dark:bg-red-950/60 border-red-200/60 dark:border-red-900/40';
    };

    const isFiltered = !!filters.search || filters.period !== 'all';

    return (
        <CustomerLayout activeTab="activities">
            <Head title="Aktivitas & Perolehan Poin - Honda Loyalty Rewards" />

            <div className="space-y-6 max-w-4xl mx-auto w-full pb-8">
                {/* ========================================================================= */}
                {/* 1. HEADER SECTION DENGAN BREADCRUMB & IDENTITAS                           */}
                {/* ========================================================================= */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="space-y-1">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition-colors group mb-1"
                        >
                            <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
                            <span>Kembali ke Beranda</span>
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/20">
                                <Clock className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                                    Aktivitas & Perolehan Poin
                                </h1>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Periksa riwayat transaksi servis Anda di AHASS serta daftar aktivitas resmi Honda yang dapat menghasilkan poin rewards
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className="px-3 py-1 text-[11px] font-mono font-semibold bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        >
                            <Shield className="size-3 text-red-600 mr-1.5" />
                            ID: {formattedMemberId}
                        </Badge>
                        <Badge className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-3 py-1">
                            {stats.tierBadge}
                        </Badge>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 2. STATISTIK RINGKAS (OVERVIEW METRICS)                                   */}
                {/* ========================================================================= */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Card 1: Saldo Poin Aktif */}
                    <div className="relative overflow-hidden rounded-2xl border border-red-200/80 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent p-4 dark:border-red-900/40 dark:from-red-950/40">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                                Saldo Poin Aktif
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400">
                                <Coins className="size-3.5" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="font-mono text-xl sm:text-2xl font-black text-red-600 dark:text-red-500">
                                {stats.currentPoints.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-500">Poin</span>
                        </div>
                    </div>

                    {/* Card 2: Total Poin Diperoleh */}
                    <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 dark:border-amber-900/40 dark:from-amber-950/40">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                                Total Poin Didapat
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
                                <Award className="size-3.5" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="font-mono text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                                {stats.lifetimePoints.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-500">Poin</span>
                        </div>
                    </div>

                    {/* Card 3: Total Transaksi */}
                    <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-4 dark:border-emerald-900/40 dark:from-emerald-950/40">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                                Total Transaksi
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-3.5" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="font-mono text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {stats.totalActivities.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-500">Aktivitas</span>
                        </div>
                    </div>

                    {/* Card 4: Poin Bulan Ini */}
                    <div className="relative overflow-hidden rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent p-4 dark:border-blue-900/40 dark:from-blue-950/40">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                                Poin Bulan Ini
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                                <Flame className="size-3.5" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="font-mono text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
                                +{stats.pointsThisMonth.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-500">Poin</span>
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 3. TABS NAVIGASI: RIWAYAT AKTIVITAS & DAFTAR AKTIVITAS BERHADIAH POIN     */}
                {/* ========================================================================= */}
                <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
                    <button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'history'
                                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                    >
                        <Clock className="size-4 text-red-600 dark:text-red-500" />
                        <span>Riwayat Aktivitas Saya</span>
                        <span className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            {histories.total}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('earning')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'earning'
                                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                    >
                        <Sparkles className="size-4 text-amber-500" />
                        <span>Aktivitas Berhadiah Poin</span>
                        <span className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                            {earningActivities.length} Pilihan
                        </span>
                    </button>
                </div>

                {/* TAB 1: RIWAYAT AKTIVITAS TRANSAKSI SAYA */}
                {activeTab === 'history' && (
                    <div className="space-y-6">
                        {/* Callout Banner ke Daftar Aktivitas */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-red-600/10 via-amber-500/10 to-transparent border border-red-200/70 dark:border-red-900/40">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-red-600 text-white shrink-0 shadow-sm">
                                    <Sparkles className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                                        Ingin Menambah Poin Rewards Anda?
                                    </h3>
                                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                                        Terdapat {earningActivities.length} aktivitas resmi servis di AHASS yang dapat menghasilkan hingga ratusan poin setiap transaksi.
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                onClick={() => setActiveTab('earning')}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl h-9 px-4 shrink-0 cursor-pointer shadow-xs"
                            >
                                Lihat Daftar Aktivitas
                                <ArrowRight className="size-3.5 ml-1.5" />
                            </Button>
                        </div>

                        {/* Toolbar Pencarian & Filter */}
                        <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
                            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                                    <Input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Cari nama aktivitas, nomor ID transaksi (#10 digit), atau catatan..."
                                        className="pl-9 pr-8 text-xs rounded-xl bg-zinc-50/70 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:border-red-500"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => setSearch('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="submit"
                                        size="sm"
                                        className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4"
                                    >
                                        Cari
                                    </Button>
                                    {isFiltered && (
                                        <Button
                                            type="button"
                                            onClick={handleResetFilters}
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl text-xs border-zinc-200 dark:border-zinc-800"
                                            title="Reset semua filter"
                                        >
                                            <RotateCcw className="size-3.5 mr-1" />
                                            Reset
                                        </Button>
                                    )}
                                </div>
                            </form>

                            {/* Filter Periode Pills */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs no-scrollbar">
                                <span className="text-[11px] font-semibold text-zinc-400 mr-1 shrink-0 flex items-center gap-1">
                                    <Filter className="size-3" /> Periode:
                                </span>
                                {[
                                    { id: 'all', label: 'Semua Waktu' },
                                    { id: 'this_month', label: 'Bulan Ini' },
                                    { id: 'last_3_months', label: '3 Bulan Terakhir' },
                                    { id: 'this_year', label: 'Tahun Ini' },
                                ].map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => handlePeriodChange(p.id)}
                                        className={`rounded-xl px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
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
                <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <Clock className="size-4 text-red-600" />
                            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                                Catatan Mutasi Transaksi
                            </h2>
                        </div>
                        <span className="text-xs font-semibold text-zinc-500">
                            Menampilkan {histories.data.length} dari {histories.total} transaksi
                        </span>
                    </div>

                    {histories.data.length > 0 ? (
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {histories.data.map((h) => (
                                <div
                                    key={h.id}
                                    onClick={() => setSelectedHistory(h)}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                                >
                                    {/* Left: Icon, Title, Dealer, Date */}
                                    <div className="flex items-start gap-3.5">
                                        <div
                                            className={`flex size-10 shrink-0 items-center justify-center rounded-2xl border shadow-xs group-hover:scale-105 transition-transform ${getActivityBg(
                                                h.title,
                                            )}`}
                                        >
                                            {getActivityIcon(h.title)}
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                                    {h.title}
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCopyTxId(h.id);
                                                    }}
                                                    className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-bold text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                                                    title="Salin No. Transaksi"
                                                >
                                                    <span>#{h.id}</span>
                                                    {copiedTxId === h.id ? (
                                                        <Check className="size-2.5 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="size-2.5 text-zinc-400" />
                                                    )}
                                                </button>
                                            </div>

                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center gap-1.5">
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
                                                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 bg-zinc-100/70 dark:bg-zinc-800/60 rounded-md px-2 py-0.5 inline-block font-normal">
                                                    &ldquo;{h.notes}&rdquo;
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Points Pill & Details Trigger */}
                                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-1.5">
                                            <div className="flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 border border-emerald-200/80 dark:border-emerald-900/50">
                                                <ArrowUpRight className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                                <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                                                    +{h.points} Poin
                                                </span>
                                            </div>
                                        </div>

                                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 inline-flex items-center gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Detail Transaksi <ChevronRight className="size-3" />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="p-8 sm:p-12 text-center space-y-4">
                            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                                <Clock className="size-7" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                                    {isFiltered
                                        ? 'Tidak Ada Riwayat yang Cocok'
                                        : 'Belum Ada Riwayat Transaksi'}
                                </h3>
                                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
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
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 shadow-xs"
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
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3.5 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                            <span className="text-xs text-zinc-500">
                                Halaman {histories.current_page} dari {histories.last_page}
                            </span>

                            <div className="flex items-center gap-1">
                                {histories.links.map((link, idx) => {
                                    if (!link.url && link.label.includes('Previous')) {
                                        return (
                                            <Button
                                                key={idx}
                                                variant="outline"
                                                size="sm"
                                                disabled
                                                className="rounded-xl text-xs h-8 px-2.5"
                                            >
                                                <ChevronLeft className="size-3.5 mr-1" /> Prev
                                            </Button>
                                        );
                                    }
                                    if (!link.url && link.label.includes('Next')) {
                                        return (
                                            <Button
                                                key={idx}
                                                variant="outline"
                                                size="sm"
                                                disabled
                                                className="rounded-xl text-xs h-8 px-2.5"
                                            >
                                                Next <ChevronRight className="size-3.5 ml-1" />
                                            </Button>
                                        );
                                    }

                                    if (link.label.includes('Previous')) {
                                        return (
                                            <Link
                                                key={idx}
                                                href={link.url!}
                                                preserveScroll
                                                preserveState
                                                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 h-8 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors"
                                            >
                                                <ChevronLeft className="size-3.5 mr-1" /> Prev
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
                                                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 h-8 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors"
                                            >
                                                Next <ChevronRight className="size-3.5 ml-1" />
                                            </Link>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={idx}
                                            href={link.url!}
                                            preserveScroll
                                            preserveState
                                            className={`inline-flex items-center justify-center rounded-xl min-w-8 h-8 px-2.5 text-xs font-semibold transition-colors ${
                                                link.active
                                                    ? 'bg-red-600 text-white font-bold shadow-xs'
                                                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
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
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-red-700 to-zinc-950 p-6 sm:p-8 text-white shadow-xl shadow-red-950/20">
                    <div className="pointer-events-none absolute -right-6 -bottom-10 opacity-15 select-none">
                        <img
                            src="/images/logo/honda_logo_white.png"
                            alt="Honda"
                            className="w-64 sm:w-80 h-auto"
                        />
                    </div>

                    <div className="relative z-10 space-y-4 max-w-2xl">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-xs">
                            <Sparkles className="size-3.5 text-amber-300" />
                            Panduan Perolehan Poin AHASS
                        </div>

                        <div>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
                                Cara Kumpulkan Poin Rewards
                            </h2>
                            <p className="text-xs sm:text-sm text-red-100/90 mt-1.5 leading-relaxed">
                                Setiap kali Anda melakukan servis motor Honda atau pembelian suku cadang asli di bengkel resmi AHASS, tunjukkan ID Member Anda untuk mendapatkan poin reward otomatis yang terakumulasi seumur hidup!
                            </p>
                        </div>

                        {/* Step Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
                            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
                                <span className="font-mono text-red-300 text-[10px] font-bold">LANGKAH 1</span>
                                <p className="font-bold text-white mt-1">Kunjungi AHASS</p>
                                <p className="text-[10px] text-red-200/80 mt-0.5">Datang ke bengkel resmi AHASS terdekat.</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
                                <span className="font-mono text-red-300 text-[10px] font-bold">LANGKAH 2</span>
                                <p className="font-bold text-white mt-1">Pilih Servis</p>
                                <p className="text-[10px] text-red-200/80 mt-0.5">Lakukan servis motor atau beli sparepart asli.</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
                                <span className="font-mono text-red-300 text-[10px] font-bold">LANGKAH 3</span>
                                <p className="font-bold text-white mt-1">Tunjukkan ID QR</p>
                                <p className="text-[10px] text-red-200/80 mt-0.5">Kasir / staf akan memindai QR Member Anda.</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
                                <span className="font-mono text-red-300 text-[10px] font-bold">LANGKAH 4</span>
                                <p className="font-bold text-white mt-1">Poin Masuk!</p>
                                <p className="text-[10px] text-red-200/80 mt-0.5">Poin langsung otomatis masuk ke e-wallet.</p>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                type="button"
                                onClick={() => window.dispatchEvent(new CustomEvent('open-customer-qr-modal'))}
                                className="bg-white hover:bg-red-50 text-red-700 text-xs font-bold rounded-xl h-10 px-5 shadow-md cursor-pointer"
                            >
                                <QrCode className="size-4 mr-2 text-red-600" />
                                Tunjukkan QR ID Member Saya
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Daftar Kartu Aktivitas Berhadiah Poin */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <div>
                            <h2 className="text-sm sm:text-base font-black tracking-tight text-zinc-900 dark:text-white">
                                Daftar Aktivitas Resmi Berhadiah Poin
                            </h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Pilih jenis perawatan atau transaksi berikut di AHASS untuk klaim poin
                            </p>
                        </div>
                        <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1">
                            {earningActivities.length} Aktivitas Tersedia
                        </Badge>
                    </div>

                    {earningActivities.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl border border-zinc-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-500">
                            <Clock className="size-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs font-semibold">Belum ada aktivitas terdaftar saat ini.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {earningActivities.map((act) => (
                                <div
                                    key={act.id}
                                    className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs hover:border-red-500/40 hover:shadow-md transition-all group"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div
                                                className={`flex size-11 shrink-0 items-center justify-center rounded-2xl border shadow-xs group-hover:scale-105 transition-transform ${getActivityBg(
                                                    act.name,
                                                )}`}
                                            >
                                                {getActivityIcon(act.name)}
                                            </div>
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 shadow-xs">
                                                <Coins className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                                +{act.points.toLocaleString('id-ID')} Poin
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                                {act.name}
                                            </h3>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                                                {act.description || 'Lakukan aktivitas servis resmi ini di seluruh jaringan bengkel AHASS.'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                                            <Shield className="size-3 text-red-600" />
                                            Bengkel Resmi AHASS
                                        </span>
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => window.dispatchEvent(new CustomEvent('open-customer-qr-modal'))}
                                            className="rounded-xl bg-red-50 text-red-700 hover:bg-red-600 hover:text-white dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-600 dark:hover:text-white border border-red-200 dark:border-red-900/50 text-[11px] font-bold h-8 px-3 transition-colors cursor-pointer"
                                        >
                                            <QrCode className="size-3 mr-1.5" />
                                            Tunjukkan ID
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="text-center pt-4">
                        <button
                            type="button"
                            onClick={() => setActiveTab('history')}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 cursor-pointer transition-colors"
                        >
                            <Clock className="size-3.5" />
                            <span>Lihat Riwayat Transaksi & Catatan Mutasi Saya &rarr;</span>
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>

            {/* ========================================================================= */}
            {/* 5. MODAL RINCIAN TRANSAKSI DIGITAL RESMI                                  */}
            {/* ========================================================================= */}
            <Dialog open={!!selectedHistory} onOpenChange={(open) => !open && setSelectedHistory(null)}>
                <DialogContent className="sm:max-w-md rounded-3xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0 overflow-hidden">
                    {selectedHistory && (
                        <div>
                            {/* Header: Red Gradient Banner */}
                            <div className="relative bg-gradient-to-br from-red-600 to-rose-700 p-6 text-white text-center overflow-hidden">
                                <div className="pointer-events-none absolute -right-8 -bottom-8 opacity-20 select-none">
                                    <img
                                        src="/images/logo/honda_logo_white.png"
                                        alt="Honda"
                                        className="w-40 h-auto"
                                    />
                                </div>

                                <div className="relative z-10 space-y-2">
                                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-md">
                                        <CheckCircle2 className="size-7 text-emerald-300" />
                                    </div>
                                    <span className="text-[10px] font-mono tracking-widest text-red-200 uppercase font-bold">
                                        HONDA REWARDS OFFICIAL TRANSACTION
                                    </span>
                                    <DialogTitle className="text-lg font-black text-white">
                                        Poin Berhasil Ditambahkan
                                    </DialogTitle>
                                    <div className="pt-1">
                                        <span className="font-mono text-3xl sm:text-4xl font-black text-white drop-shadow-sm">
                                            +{selectedHistory.points}
                                        </span>
                                        <span className="text-xs font-bold text-red-100 ml-1">POIN</span>
                                    </div>
                                </div>
                            </div>

                            {/* Record Body: Details Breakdown */}
                            <div className="p-6 space-y-4">
                                <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950 space-y-2.5 text-xs">
                                    {/* No Referensi */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-500 font-medium">No. Referensi (ID)</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono font-bold text-zinc-900 dark:text-white">
                                                #{selectedHistory.id}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyTxId(selectedHistory.id)}
                                                className="text-zinc-400 hover:text-red-600 transition-colors p-0.5"
                                                title="Salin No Referensi"
                                            >
                                                {copiedTxId === selectedHistory.id ? (
                                                    <Check className="size-3 text-emerald-500" />
                                                ) : (
                                                    <Copy className="size-3" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Nama Aktivitas */}
                                    <div className="flex items-start justify-between border-t border-zinc-200/60 pt-2 dark:border-zinc-800">
                                        <span className="text-zinc-500 font-medium">Aktivitas</span>
                                        <span className="font-bold text-zinc-900 dark:text-white text-right max-w-[200px]">
                                            {selectedHistory.title}
                                        </span>
                                    </div>

                                    {/* Tanggal & Waktu */}
                                    <div className="flex items-center justify-between border-t border-zinc-200/60 pt-2 dark:border-zinc-800">
                                        <span className="text-zinc-500 font-medium">Tanggal & Waktu</span>
                                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                            {selectedHistory.date} WIB
                                        </span>
                                    </div>

                                    {/* Bengkel & Petugas */}
                                    <div className="flex items-start justify-between border-t border-zinc-200/60 pt-2 dark:border-zinc-800">
                                        <span className="text-zinc-500 font-medium">Lokasi AHASS</span>
                                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-right max-w-[200px]">
                                            {selectedHistory.dealer}
                                        </span>
                                    </div>

                                    {/* Petugas Kasir */}
                                    <div className="flex items-center justify-between border-t border-zinc-200/60 pt-2 dark:border-zinc-800">
                                        <span className="text-zinc-500 font-medium">Petugas Input</span>
                                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                            {selectedHistory.admin_name}
                                        </span>
                                    </div>

                                    {/* Catatan */}
                                    {selectedHistory.notes && (
                                        <div className="flex items-start justify-between border-t border-zinc-200/60 pt-2 dark:border-zinc-800">
                                            <span className="text-zinc-500 font-medium">Catatan</span>
                                            <span className="font-medium text-zinc-700 dark:text-zinc-300 text-right max-w-[200px] italic">
                                                {selectedHistory.notes}
                                            </span>
                                        </div>
                                    )}

                                    {/* Status Validasi */}
                                    <div className="flex items-center justify-between border-t border-zinc-200/60 pt-2 dark:border-zinc-800">
                                        <span className="text-zinc-500 font-medium">Status Verifikasi</span>
                                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                            <Check className="size-2.5" /> Terverifikasi Sistem AHASS
                                        </span>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <p className="text-[10px] text-zinc-400">
                                        Bukti digital ini adalah rekaman resmi perolehan poin program Honda Customer Loyalty Rewards.
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
                                <Button
                                    type="button"
                                    onClick={() => handleCopyTxId(selectedHistory.id)}
                                    variant="outline"
                                    className="flex-1 rounded-xl text-xs font-semibold border-zinc-300 dark:border-zinc-700"
                                >
                                    {copiedTxId === selectedHistory.id ? (
                                        <>
                                            <Check className="size-3.5 text-emerald-500 mr-1.5" />
                                            Disalin!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="size-3.5 mr-1.5" />
                                            Salin No. Referensi
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setSelectedHistory(null)}
                                    className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
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
