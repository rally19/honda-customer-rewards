import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Award,
    Check,
    CheckCircle2,
    Copy,
    Download,
    Edit3,
    Filter,
    History,
    Info,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    Plus,
    RefreshCw,
    Search,
    Sparkles,
    Trash2,
    X,
    Zap,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
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
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';

type ActivityItem = {
    id: string;
    name: string;
    points: number;
    description: string;
    is_active: boolean;
    histories_count: number;
    created_at: string;
};

type HistoryItem = {
    id: string;
    activity_id: string;
    activity_name: string;
    points: number;
    user_id: string;
    user_name: string;
    user_email: string;
    user_phone: string;
    user_address: string;
    admin_name: string;
    notes: string;
    created_at: string;
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
    totalActivities: number;
    activeActivities: number;
    totalPointsAwarded: number;
    totalTransactions: number;
};

type Props = {
    activities: ActivityItem[];
    histories: PaginatedHistories;
    stats: Stats;
    filters: {
        search: string;
        status: string;
        history_search: string;
    };
};

export default function AdminActivitiesIndex({
    activities,
    histories,
    stats,
    filters,
}: Props) {
    const [activeTab, setActiveTab] = useState<'activities' | 'histories'>(
        'activities',
    );

    // Search and Filters
    const [activitySearch, setActivitySearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [historySearch, setHistorySearch] = useState(
        filters.history_search || '',
    );

    // Modals
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(
        null,
    );
    const [deletingActivity, setDeletingActivity] =
        useState<ActivityItem | null>(null);
    const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(
        null,
    );
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [tempStatus, setTempStatus] = useState(filters.status || 'all');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const activeFilterCount = statusFilter !== 'all' ? 1 : 0;

    // Helper: generate random 10-digit ID
    const generateRandom10Digits = () => {
        return Math.floor(1000000000 + Math.random() * 9000000000).toString();
    };

    // Form for Create / Edit Activity
    const createForm = useForm({
        id: generateRandom10Digits(),
        name: '',
        points: 100,
        description: '',
        is_active: true,
    });

    const editForm = useForm({
        name: '',
        points: 100,
        description: '',
        is_active: true,
    });

    // Copy to clipboard with toast
    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(text);
        toast.success(`${label} berhasil disalin ke clipboard!`);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // CSV Exporter
    const exportCsv = (filename: string, content: string, label: string) => {
        try {
            const blob = new Blob([content], {
                type: 'text/csv;charset=utf-8;',
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success(`${label} berhasil diekspor.`);
        } catch {
            navigator.clipboard.writeText(content);
            toast.success(`${label} disalin ke clipboard.`);
        }
    };

    // Filter application
    const applyActivityFilters = (newSearch?: string, newStatus?: string) => {
        router.get(
            '/admin/activities',
            {
                search: newSearch !== undefined ? newSearch : activitySearch,
                status: newStatus !== undefined ? newStatus : statusFilter,
                history_search: historySearch,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const applyHistoryFilters = (newHistorySearch?: string) => {
        router.get(
            '/admin/activities',
            {
                search: activitySearch,
                status: statusFilter,
                history_search:
                    newHistorySearch !== undefined
                        ? newHistorySearch
                        : historySearch,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    // Open modals
    const openCreateModal = () => {
        createForm.reset();
        createForm.setData({
            id: generateRandom10Digits(),
            name: '',
            points: 100,
            description: '',
            is_active: true,
        });
        setCreateModalOpen(true);
    };

    const openEditModal = (act: ActivityItem) => {
        setEditingActivity(act);
        editForm.setData({
            name: act.name,
            points: act.points,
            description: act.description,
            is_active: act.is_active,
        });
    };

    // Form handlers
    const handleCreateActivity = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/admin/activities', {
            preserveScroll: true,
            onSuccess: () => {
                setCreateModalOpen(false);
                createForm.reset();
                toast.success('Aktivitas baru berhasil didaftarkan ke sistem!');
            },
            onError: (errs) => {
                toast.error(
                    Object.values(errs)[0] || 'Gagal menambahkan aktivitas.',
                );
            },
        });
    };

    const handleUpdateActivity = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingActivity) return;

        editForm.put(`/admin/activities/${editingActivity.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingActivity(null);
                toast.success('Data aktivitas berhasil diperbarui!');
            },
            onError: (errs) => {
                toast.error(
                    Object.values(errs)[0] || 'Gagal memperbarui aktivitas.',
                );
            },
        });
    };

    const handleDeleteActivity = () => {
        if (!deletingActivity) return;

        router.delete(`/admin/activities/${deletingActivity.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingActivity(null);
                toast.success('Aktivitas berhasil dihapus dari sistem.');
            },
            onError: () => {
                toast.error('Gagal menghapus aktivitas.');
            },
        });
    };

    return (
        <>
            <Head title="Manajemen Aktivitas & Riwayat Poin - Admin Honda Rewards" />

            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-8">
                {/* Hero Header Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-red-700 to-zinc-950 p-6 text-white shadow-xl shadow-red-950/20 md:p-8">
                    {/* Honda Watermark Vector */}
                    <div className="pointer-events-none absolute right-0 -bottom-11 opacity-15 select-none">
                        <img
                            src="/images/logo/honda_logo_white.png"
                            alt="Honda"
                            className="h-auto w-84 md:w-96"
                        />
                    </div>

                    <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-bold text-white shadow-xs backdrop-blur-md">
                                    <Sparkles className="size-3.5" />
                                    Modul Aktivitas & Poin AHASS
                                </span>
                            </div>
                            <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                                Manajemen Aktivitas & Riwayat Poin
                            </h1>
                            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-red-100/80 md:text-sm">
                                Kelola katalog layanan servis resmi, pembelian
                                parts Honda, dan aktivitas AHASS dengan sistem
                                poin bawaan, serta pantau rekaman riwayat
                                transaksi poin seluruh member pelanggan.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <Link
                                href="/admin/dashboard"
                                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/20 md:text-sm"
                            >
                                <ArrowLeft className="size-4" />
                                Kembali ke Dashboard
                            </Link>

                            <Button
                                onClick={openCreateModal}
                                className="h-10 cursor-pointer gap-2 rounded-xl bg-white px-4 text-xs font-bold text-red-700 shadow-md transition-all hover:bg-red-50 active:scale-98 md:text-sm"
                            >
                                <Plus className="size-4 text-red-600" />
                                Tambah Aktivitas Baru
                            </Button>
                        </div>
                    </div>
                </div>

                {/* KPI Metrics Strip */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Stat 1: Total Activities */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold tracking-wider text-zinc-600 uppercase dark:text-zinc-300">
                                Total Aktivitas
                            </span>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60">
                                <Award className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.totalActivities.toLocaleString('id-ID')}
                            </div>
                            <span className="mt-1 block text-xs text-zinc-500">
                                Katalog layanan resmi AHASS
                            </span>
                        </div>
                    </div>

                    {/* Stat 2: Active Activities */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold tracking-wider text-zinc-600 uppercase dark:text-zinc-300">
                                Aktivitas Aktif
                            </span>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60">
                                <CheckCircle2 className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.activeActivities.toLocaleString('id-ID')}
                            </div>
                            <span className="mt-1 block text-xs font-semibold text-emerald-600">
                                {stats.activeActivities} siap dipilih di scanner
                            </span>
                        </div>
                    </div>

                    {/* Stat 3: Total Points Awarded */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold tracking-wider text-zinc-600 uppercase dark:text-zinc-300">
                                Total Poin Diberikan
                            </span>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60">
                                <Zap className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.totalPointsAwarded.toLocaleString(
                                    'id-ID',
                                )}
                            </div>
                            <span className="mt-1 block text-xs font-semibold text-amber-600">
                                Akumulasi reward tersalurkan
                            </span>
                        </div>
                    </div>

                    {/* Stat 4: Total Transactions */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold tracking-wider text-zinc-600 uppercase dark:text-zinc-300">
                                Log Transaksi
                            </span>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60">
                                <History className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.totalTransactions.toLocaleString(
                                    'id-ID',
                                )}
                            </div>
                            <span className="mt-1 block text-xs font-semibold text-purple-600">
                                Rekaman riwayat tersimpan
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Card Container */}
                <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    {/* Tab Navigation Bar */}
                    <div className="flex gap-2 overflow-x-auto border-b border-zinc-200 bg-zinc-50/50 px-6 pt-3.5 dark:border-zinc-800 dark:bg-zinc-950/30">
                        <button
                            type="button"
                            onClick={() => setActiveTab('activities')}
                            className={`flex cursor-pointer items-center gap-2 border-b-2 px-3 pb-3.5 text-xs font-bold whitespace-nowrap transition-all md:text-sm ${
                                activeTab === 'activities'
                                    ? 'border-red-600 text-red-600 dark:text-red-400'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                            }`}
                        >
                            <Award className="size-4" />
                            <span>Katalog Layanan Aktivitas</span>
                            <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    activeTab === 'activities'
                                        ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300'
                                        : 'bg-zinc-200/80 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                                }`}
                            >
                                {activities.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('histories')}
                            className={`flex cursor-pointer items-center gap-2 border-b-2 px-3 pb-3.5 text-xs font-bold whitespace-nowrap transition-all md:text-sm ${
                                activeTab === 'histories'
                                    ? 'border-red-600 text-red-600 dark:text-red-400'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                            }`}
                        >
                            <History className="size-4" />
                            <span>Log Riwayat Aktivitas & Poin</span>
                            <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    activeTab === 'histories'
                                        ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300'
                                        : 'bg-zinc-200/80 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                                }`}
                            >
                                {histories.total}
                            </span>
                        </button>
                    </div>

                    {/* TAB 1: DAFTAR AKTIVITAS */}
                    {activeTab === 'activities' && (
                        <div>
                            {/* Filter & Search Bar */}
                            <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 p-6 md:flex-row md:items-center dark:border-zinc-800">
                                {/* Search */}
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                                    <Input
                                        type="text"
                                        placeholder="Cari aktivitas, ID 10-digit, deskripsi..."
                                        value={activitySearch}
                                        onChange={(e) => {
                                            setActivitySearch(e.target.value);
                                            applyActivityFilters(
                                                e.target.value,
                                                statusFilter,
                                            );
                                        }}
                                        className="h-9.5 rounded-xl pl-9 text-xs focus-visible:ring-red-500"
                                    />
                                    {activitySearch && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActivitySearch('');
                                                applyActivityFilters(
                                                    '',
                                                    statusFilter,
                                                );
                                            }}
                                            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-zinc-400 hover:text-zinc-600"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Actions: Filter & Export */}
                                <div className="flex items-center gap-2.5">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setTempStatus(statusFilter);
                                            setFilterModalOpen(true);
                                        }}
                                        className={`h-9.5 cursor-pointer gap-2 rounded-xl text-xs transition-all ${
                                            activeFilterCount > 0
                                                ? 'border-red-300 bg-red-50/70 font-bold text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400'
                                                : 'text-zinc-700 dark:text-zinc-300'
                                        }`}
                                    >
                                        <Filter className="size-3.5 text-red-600" />
                                        <span>Filter</span>
                                        {activeFilterCount > 0 && (
                                            <span className="flex size-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white">
                                                {activeFilterCount}
                                            </span>
                                        )}
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            const csv = activities
                                                .map(
                                                    (a) =>
                                                        `"${a.id}","${a.name.replace(/"/g, '""')}","${(a.description || '').replace(/"/g, '""')}","${a.points}","${a.is_active ? 'Aktif' : 'Nonaktif'}","${a.histories_count}","${a.created_at}"`,
                                                )
                                                .join('\n');
                                            const header =
                                                '"ID Aktivitas","Nama Aktivitas","Deskripsi Aktivitas","Default Poin","Status","Total Pemakaian","Dibuat Pada"\n';
                                            exportCsv(
                                                'katalog-aktivitas-honda.csv',
                                                header + csv,
                                                'Data Aktivitas (CSV)',
                                            );
                                        }}
                                        className="h-9.5 cursor-pointer gap-1.5 rounded-xl text-xs"
                                    >
                                        <Download className="size-3.5" />
                                        Ekspor CSV
                                    </Button>
                                </div>
                            </div>

                            {/* Active Filter Chips */}
                            {(activeFilterCount > 0 || activitySearch) && (
                                <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200/80 bg-zinc-50/70 px-6 py-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
                                    <span className="text-[11px] font-medium text-zinc-400">
                                        Filter Aktif:
                                    </span>

                                    {statusFilter !== 'all' && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                            Status:{' '}
                                            {statusFilter === 'active'
                                                ? 'Aktif'
                                                : 'Nonaktif'}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setStatusFilter('all');
                                                    applyActivityFilters(
                                                        activitySearch,
                                                        'all',
                                                    );
                                                }}
                                                className="cursor-pointer hover:text-emerald-900"
                                                title="Hapus filter status"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </span>
                                    )}

                                    {activitySearch && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                            Pencarian: "{activitySearch}"
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setActivitySearch('');
                                                    applyActivityFilters(
                                                        '',
                                                        statusFilter,
                                                    );
                                                }}
                                                className="cursor-pointer hover:text-zinc-900"
                                                title="Hapus filter pencarian"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </span>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActivitySearch('');
                                            setStatusFilter('all');
                                            applyActivityFilters('', 'all');
                                        }}
                                        className="ml-1 cursor-pointer text-[11px] text-zinc-500 underline hover:text-red-600"
                                    >
                                        Reset Semua
                                    </button>
                                </div>
                            )}

                            {/* MOBILE VIEW: Compact Card List */}
                            <div className="block divide-y divide-zinc-100 sm:hidden dark:divide-zinc-800/80">
                                {activities.length > 0 ? (
                                    activities.map((act) => (
                                        <div
                                            key={act.id}
                                            className="space-y-3 p-4"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                                                            #{act.id}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleCopy(
                                                                    act.id,
                                                                    `ID ${act.id}`,
                                                                )
                                                            }
                                                            className="cursor-pointer text-zinc-400 hover:text-zinc-600"
                                                            title="Salin ID Aktivitas"
                                                        >
                                                            {copiedId ===
                                                            act.id ? (
                                                                <Check className="size-3 text-emerald-500" />
                                                            ) : (
                                                                <Copy className="size-3" />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <h3 className="mt-0.5 truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                        {act.name}
                                                    </h3>
                                                    {act.description && (
                                                        <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-500">
                                                            {act.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <Badge className="shrink-0 border border-red-200 bg-red-50 font-mono text-xs font-bold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                                                    +{act.points} PTS
                                                </Badge>
                                            </div>

                                            <div className="flex items-center justify-between border-t border-zinc-100 pt-1 text-xs dark:border-zinc-800">
                                                <div className="flex items-center gap-2">
                                                    {act.is_active ? (
                                                        <Badge className="bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                            Aktif
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px]"
                                                        >
                                                            Nonaktif
                                                        </Badge>
                                                    )}
                                                    <span className="font-mono text-[11px] text-zinc-500">
                                                        {act.histories_count}x
                                                        dipakai
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            openEditModal(act)
                                                        }
                                                        className="h-8 cursor-pointer rounded-lg px-2 text-xs text-zinc-600 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                                                    >
                                                        <Edit3 className="mr-1 size-3.5 text-zinc-500" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            setDeletingActivity(
                                                                act,
                                                            )
                                                        }
                                                        className="h-8 cursor-pointer rounded-lg px-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center text-xs text-zinc-400">
                                        Tidak ada data aktivitas yang sesuai
                                        dengan filter pencarian.
                                    </div>
                                )}
                            </div>

                            {/* DESKTOP VIEW: Table */}
                            <div className="hidden overflow-x-auto sm:block">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-zinc-200 bg-zinc-50 font-bold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60">
                                        <tr>
                                            <th className="px-4 py-3.5">
                                                ID Aktivitas
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Nama Layanan & Deskripsi
                                            </th>
                                            <th className="px-4 py-3.5 text-center">
                                                Default Reward
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Status Layanan
                                            </th>
                                            <th className="px-4 py-3.5 text-center">
                                                Frekuensi Digunakan
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Dibuat Pada
                                            </th>
                                            <th className="px-4 py-3.5 text-right">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                        {activities.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={7}
                                                    className="py-12 text-center text-zinc-400"
                                                >
                                                    Tidak ada data aktivitas
                                                    yang sesuai dengan filter
                                                    pencarian.
                                                </td>
                                            </tr>
                                        ) : (
                                            activities.map((act) => (
                                                <tr
                                                    key={act.id}
                                                    className="transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40"
                                                >
                                                    <td className="px-4 py-3.5 font-mono font-bold whitespace-nowrap text-red-600 dark:text-red-400">
                                                        <div className="flex items-center gap-1.5">
                                                            <span>
                                                                #{act.id}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleCopy(
                                                                        act.id,
                                                                        `ID ${act.id}`,
                                                                    )
                                                                }
                                                                className="cursor-pointer text-zinc-400 hover:text-zinc-600"
                                                                title="Salin ID Aktivitas"
                                                            >
                                                                {copiedId ===
                                                                act.id ? (
                                                                    <Check className="size-3 text-emerald-500" />
                                                                ) : (
                                                                    <Copy className="size-3" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                            {act.name}
                                                        </div>
                                                        <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-500">
                                                            {act.description ||
                                                                'Tidak ada deskripsi tambahan.'}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                                        <Badge className="border border-red-200 bg-red-50 font-mono text-xs font-bold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                                                            +{act.points} PTS
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                                        {act.is_active ? (
                                                            <Badge className="bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                                Aktif
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-[10px]"
                                                            >
                                                                Nonaktif
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center font-mono whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                                                        {act.histories_count}x
                                                    </td>
                                                    <td className="px-4 py-3.5 font-mono whitespace-nowrap text-zinc-500">
                                                        {act.created_at}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        act,
                                                                    )
                                                                }
                                                                className="h-8 cursor-pointer rounded-lg px-2 text-xs text-zinc-600 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                                                                title="Edit Aktivitas"
                                                            >
                                                                <Edit3 className="mr-1 size-3.5" />
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    setDeletingActivity(
                                                                        act,
                                                                    )
                                                                }
                                                                className="h-8 cursor-pointer rounded-lg px-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                                                title="Hapus Aktivitas"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: RIWAYAT AKTIVITAS & POIN */}
                    {activeTab === 'histories' && (
                        <div>
                            {/* Filter & Search Bar */}
                            <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 p-6 md:flex-row md:items-center dark:border-zinc-800">
                                {/* Search */}
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                                    <Input
                                        type="text"
                                        placeholder="Cari ID riwayat, nama member, ID member, telepon..."
                                        value={historySearch}
                                        onChange={(e) => {
                                            setHistorySearch(e.target.value);
                                            applyHistoryFilters(e.target.value);
                                        }}
                                        className="h-9.5 rounded-xl pl-9 text-xs focus-visible:ring-red-500"
                                    />
                                    {historySearch && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setHistorySearch('');
                                                applyHistoryFilters('');
                                            }}
                                            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-zinc-400 hover:text-zinc-600"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Actions: Export */}
                                <div className="flex items-center gap-2.5">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            const csv = histories.data
                                                .map(
                                                    (h) =>
                                                        `"${h.id}","${h.created_at}","${h.activity_name}","${h.points}","${h.user_id}","${h.user_name}","${h.user_email}","${h.user_phone}","${h.admin_name}"`,
                                                )
                                                .join('\n');
                                            const header =
                                                '"ID Riwayat","Waktu Transaksi","Aktivitas Layanan","Poin Diberikan","ID Member","Nama Member","Email","No Telepon","Petugas Admin"\n';
                                            exportCsv(
                                                'riwayat-poin-honda.csv',
                                                header + csv,
                                                'Data Riwayat Transaksi (CSV)',
                                            );
                                        }}
                                        className="h-9.5 cursor-pointer gap-1.5 rounded-xl text-xs"
                                    >
                                        <Download className="size-3.5" />
                                        Ekspor CSV
                                    </Button>
                                </div>
                            </div>

                            {/* Active Filter Chips */}
                            {historySearch && (
                                <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200/80 bg-zinc-50/70 px-6 py-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
                                    <span className="text-[11px] font-medium text-zinc-400">
                                        Filter Aktif:
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                        Pencarian Riwayat: "{historySearch}"
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setHistorySearch('');
                                                applyHistoryFilters('');
                                            }}
                                            className="cursor-pointer hover:text-zinc-900"
                                            title="Hapus pencarian riwayat"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setHistorySearch('');
                                            applyHistoryFilters('');
                                        }}
                                        className="ml-1 cursor-pointer text-[11px] text-zinc-500 underline hover:text-red-600"
                                    >
                                        Reset Pencarian
                                    </button>
                                </div>
                            )}

                            {/* MOBILE VIEW: Compact Card List */}
                            <div className="block divide-y divide-zinc-100 sm:hidden dark:divide-zinc-800/80">
                                {histories.data.length > 0 ? (
                                    histories.data.map((h) => (
                                        <div
                                            key={h.id}
                                            className="space-y-2.5 p-4"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                                                            #{h.id}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleCopy(
                                                                    h.id,
                                                                    `ID ${h.id}`,
                                                                )
                                                            }
                                                            className="cursor-pointer text-zinc-400 hover:text-zinc-600"
                                                            title="Salin ID Riwayat"
                                                        >
                                                            {copiedId ===
                                                            h.id ? (
                                                                <Check className="size-3 text-emerald-500" />
                                                            ) : (
                                                                <Copy className="size-3" />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <h3 className="mt-0.5 truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                        {h.user_name}
                                                    </h3>
                                                    <div className="font-mono text-[10px] text-zinc-500">
                                                        ID Member: #{h.user_id}{' '}
                                                        &bull; {h.user_phone}
                                                    </div>
                                                </div>
                                                <Badge className="shrink-0 border border-emerald-200 bg-emerald-50 font-mono text-xs font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                    +{h.points} PTS
                                                </Badge>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                                                <span className="max-w-[180px] truncate font-medium">
                                                    {h.activity_name}
                                                </span>
                                                <span className="font-mono text-[10px] text-zinc-400">
                                                    {h.created_at}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between border-t border-zinc-100 pt-1 text-[11px] text-zinc-500 dark:border-zinc-800">
                                                <span>
                                                    Admin: {h.admin_name}
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        setSelectedHistory(h)
                                                    }
                                                    className="h-7 cursor-pointer gap-1 rounded-lg px-2 text-xs text-zinc-600 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                                                >
                                                    <Info className="size-3 text-red-600" />
                                                    Snapshot Member
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center text-xs text-zinc-400">
                                        Belum ada data riwayat transaksi yang
                                        sesuai pencarian.
                                    </div>
                                )}
                            </div>

                            {/* DESKTOP VIEW: Table */}
                            <div className="hidden overflow-x-auto sm:block">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-zinc-200 bg-zinc-50 font-bold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60">
                                        <tr>
                                            <th className="px-4 py-3.5">
                                                ID Riwayat
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Waktu Transaksi
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Aktivitas Layanan
                                            </th>
                                            <th className="px-4 py-3.5 text-center">
                                                Reward Poin
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Member Pelanggan
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Petugas Admin
                                            </th>
                                            <th className="px-4 py-3.5 text-right">
                                                Detail
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                        {histories.data.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={7}
                                                    className="py-12 text-center text-zinc-400"
                                                >
                                                    Belum ada data riwayat
                                                    transaksi yang sesuai
                                                    pencarian.
                                                </td>
                                            </tr>
                                        ) : (
                                            histories.data.map((h) => (
                                                <tr
                                                    key={h.id}
                                                    className="transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40"
                                                >
                                                    <td className="px-4 py-3.5 font-mono font-bold whitespace-nowrap text-red-600 dark:text-red-400">
                                                        <div className="flex items-center gap-1.5">
                                                            <span>#{h.id}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleCopy(
                                                                        h.id,
                                                                        `ID Riwayat ${h.id}`,
                                                                    )
                                                                }
                                                                className="cursor-pointer text-zinc-400 hover:text-zinc-600"
                                                                title="Salin ID Riwayat"
                                                            >
                                                                {copiedId ===
                                                                h.id ? (
                                                                    <Check className="size-3 text-emerald-500" />
                                                                ) : (
                                                                    <Copy className="size-3" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 font-mono text-[11px] whitespace-nowrap text-zinc-500">
                                                        {h.created_at}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                                            {h.activity_name}
                                                        </div>
                                                        <span className="font-mono text-[10px] text-zinc-400">
                                                            ID Aktivitas: #
                                                            {h.activity_id}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                                        <Badge className="border border-emerald-200 bg-emerald-50 font-mono text-xs font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                            +{h.points} PTS
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                                            {h.user_name}
                                                        </div>
                                                        <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
                                                            <span>
                                                                #{h.user_id}
                                                            </span>
                                                            {h.user_phone &&
                                                                h.user_phone !==
                                                                    '-' && (
                                                                    <>
                                                                        <span>
                                                                            &bull;
                                                                        </span>
                                                                        <span>
                                                                            {
                                                                                h.user_phone
                                                                            }
                                                                        </span>
                                                                        <a
                                                                            href={`https://wa.me/${h.user_phone.replace(/^0/, '62')}`}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="ml-0.5 inline-flex size-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                                                                            title="Hubungi via WhatsApp"
                                                                        >
                                                                            <MessageCircle className="size-3" />
                                                                        </a>
                                                                    </>
                                                                )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                                                        {h.admin_name}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                setSelectedHistory(
                                                                    h,
                                                                )
                                                            }
                                                            className="h-8 cursor-pointer rounded-lg px-2 text-xs text-zinc-600 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                                                            title="Lihat Detail Snapshot"
                                                        >
                                                            <Info className="mr-1 size-3.5 text-red-600" />
                                                            Snapshot
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {histories.last_page > 1 && (
                                <div className="flex items-center justify-between border-t border-zinc-200 p-4 text-xs dark:border-zinc-800">
                                    <span className="text-zinc-500">
                                        Menampilkan halaman{' '}
                                        <strong>
                                            {histories.current_page}
                                        </strong>{' '}
                                        dari{' '}
                                        <strong>{histories.last_page}</strong> (
                                        {histories.total} total data)
                                    </span>

                                    <div className="flex items-center gap-1">
                                        {histories.links.map((link, i) => (
                                            <Link
                                                key={i}
                                                href={link.url || '#'}
                                                preserveScroll
                                                className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                                                    link.active
                                                        ? 'bg-red-600 font-bold text-white'
                                                        : link.url
                                                          ? 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                                                          : 'pointer-events-none text-zinc-300 dark:text-zinc-600'
                                                }`}
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: TAMBAH AKTIVITAS BARU */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent className="rounded-3xl p-6 sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60">
                                <Award className="size-4" />
                            </div>
                            Tambah Aktivitas Baru
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Daftarkan jenis layanan AHASS atau pembelian suku
                            cadang baru dengan ID 10 digit dan default poin
                            reward.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={handleCreateActivity}
                        className="space-y-4 py-2 text-xs"
                    >
                        {/* ID Aktivitas (10 Digit) */}
                        <div>
                            <div className="mb-1 flex items-center justify-between">
                                <Label
                                    htmlFor="create_act_id"
                                    className="font-bold text-zinc-800 dark:text-zinc-200"
                                >
                                    ID Aktivitas (10 Digit Angka Unik)
                                </Label>
                                <button
                                    type="button"
                                    onClick={() =>
                                        createForm.setData(
                                            'id',
                                            generateRandom10Digits(),
                                        )
                                    }
                                    className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-red-600 hover:underline"
                                >
                                    <RefreshCw className="size-3" />
                                    Acak Ulang ID
                                </button>
                            </div>
                            <Input
                                id="create_act_id"
                                type="text"
                                maxLength={10}
                                value={createForm.data.id}
                                onChange={(e) =>
                                    createForm.setData(
                                        'id',
                                        e.target.value.replace(/\D/g, ''),
                                    )
                                }
                                className="h-9.5 rounded-xl font-mono text-xs font-bold tracking-wider"
                                required
                            />
                            {createForm.errors.id && (
                                <p className="mt-1 text-[11px] text-red-600">
                                    {createForm.errors.id}
                                </p>
                            )}
                        </div>

                        {/* Nama Aktivitas */}
                        <div>
                            <Label
                                htmlFor="create_act_name"
                                className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200"
                            >
                                Nama Layanan / Aktivitas
                            </Label>
                            <Input
                                id="create_act_name"
                                value={createForm.data.name}
                                onChange={(e) =>
                                    createForm.setData('name', e.target.value)
                                }
                                placeholder="Contoh: Servis Berkala & Ganti Busi AHASS"
                                required
                                className="h-9.5 rounded-xl text-xs"
                            />
                            {createForm.errors.name && (
                                <p className="mt-1 text-[11px] text-red-600">
                                    {createForm.errors.name}
                                </p>
                            )}
                        </div>

                        {/* Default Reward Poin */}
                        <div>
                            <Label
                                htmlFor="create_act_points"
                                className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200"
                            >
                                Default Poin Reward (INT)
                            </Label>
                            <div className="relative">
                                <Input
                                    id="create_act_points"
                                    type="number"
                                    min={0}
                                    max={100000}
                                    value={createForm.data.points}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'points',
                                            Number(e.target.value),
                                        )
                                    }
                                    required
                                    className="h-9.5 rounded-xl pr-14 font-mono text-xs font-bold"
                                />
                                <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-xs font-bold text-zinc-500">
                                    PTS
                                </span>
                            </div>
                            {createForm.errors.points && (
                                <p className="mt-1 text-[11px] text-red-600">
                                    {createForm.errors.points}
                                </p>
                            )}
                        </div>

                        {/* Deskripsi */}
                        <div>
                            <Label
                                htmlFor="create_act_desc"
                                className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200"
                            >
                                Deskripsi Layanan (Opsional)
                            </Label>
                            <textarea
                                id="create_act_desc"
                                rows={3}
                                placeholder="Penjelasan ringkas jenis servis, suku cadang resmi, atau kriteria aktivitas..."
                                value={createForm.data.description}
                                onChange={(e) =>
                                    createForm.setData(
                                        'description',
                                        e.target.value,
                                    )
                                }
                                className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs outline-none focus:ring-2 focus:ring-red-500 dark:border-zinc-800 dark:bg-zinc-900"
                            />
                        </div>

                        {/* Status Aktif */}
                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="create_act_is_active"
                                checked={createForm.data.is_active}
                                onChange={(e) =>
                                    createForm.setData(
                                        'is_active',
                                        e.target.checked,
                                    )
                                }
                                className="size-4 cursor-pointer rounded border-zinc-300 text-red-600 focus:ring-red-500"
                            />
                            <label
                                htmlFor="create_act_is_active"
                                className="cursor-pointer text-xs text-zinc-700 select-none dark:text-zinc-300"
                            >
                                Aktivitas <strong>Aktif</strong> (langsung
                                tampil di kamera scanner & dapat digunakan)
                            </label>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateModalOpen(false)}
                                className="h-9.5 cursor-pointer rounded-xl text-xs"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    createForm.processing ||
                                    !createForm.data.name.trim()
                                }
                                className="h-9.5 cursor-pointer rounded-xl bg-red-600 px-5 text-xs font-bold text-white hover:bg-red-700"
                            >
                                {createForm.processing
                                    ? 'Menyimpan...'
                                    : 'Daftarkan Aktivitas'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL: EDIT AKTIVITAS */}
            <Dialog
                open={!!editingActivity}
                onOpenChange={() => setEditingActivity(null)}
            >
                <DialogContent className="rounded-3xl p-6 sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60">
                                <Edit3 className="size-4" />
                            </div>
                            Edit Aktivitas Layanan
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Perbarui nama layanan, jumlah default poin reward,
                            atau status keaktifan #{editingActivity?.id}
                        </DialogDescription>
                    </DialogHeader>

                    {editingActivity && (
                        <form
                            onSubmit={handleUpdateActivity}
                            className="space-y-4 py-2 text-xs"
                        >
                            {/* ID Readonly */}
                            <div>
                                <Label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                    ID Aktivitas (Permanen)
                                </Label>
                                <Input
                                    value={`#${editingActivity.id}`}
                                    disabled
                                    className="h-9.5 rounded-xl bg-zinc-100 font-mono text-xs font-bold text-zinc-500 dark:bg-zinc-800"
                                />
                                <span className="mt-1 block text-[10px] text-zinc-400">
                                    ID 10-digit tidak dapat diubah untuk menjaga
                                    integritas database riwayat.
                                </span>
                            </div>

                            {/* Nama Aktivitas */}
                            <div>
                                <Label
                                    htmlFor="edit_act_name"
                                    className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200"
                                >
                                    Nama Layanan / Aktivitas
                                </Label>
                                <Input
                                    id="edit_act_name"
                                    value={editForm.data.name}
                                    onChange={(e) =>
                                        editForm.setData('name', e.target.value)
                                    }
                                    required
                                    className="h-9.5 rounded-xl text-xs"
                                />
                                {editForm.errors.name && (
                                    <p className="mt-1 text-[11px] text-red-600">
                                        {editForm.errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Default Reward Poin */}
                            <div>
                                <Label
                                    htmlFor="edit_act_points"
                                    className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200"
                                >
                                    Default Poin Reward (INT)
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="edit_act_points"
                                        type="number"
                                        min={0}
                                        max={100000}
                                        value={editForm.data.points}
                                        onChange={(e) =>
                                            editForm.setData(
                                                'points',
                                                Number(e.target.value),
                                            )
                                        }
                                        required
                                        className="h-9.5 rounded-xl pr-14 font-mono text-xs font-bold"
                                    />
                                    <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-xs font-bold text-zinc-500">
                                        PTS
                                    </span>
                                </div>
                                {editForm.errors.points && (
                                    <p className="mt-1 text-[11px] text-red-600">
                                        {editForm.errors.points}
                                    </p>
                                )}
                            </div>

                            {/* Deskripsi */}
                            <div>
                                <Label
                                    htmlFor="edit_act_desc"
                                    className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200"
                                >
                                    Deskripsi Layanan (Opsional)
                                </Label>
                                <textarea
                                    id="edit_act_desc"
                                    rows={3}
                                    value={editForm.data.description}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs outline-none focus:ring-2 focus:ring-red-500 dark:border-zinc-800 dark:bg-zinc-900"
                                />
                            </div>

                            {/* Status Aktif */}
                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="edit_act_is_active"
                                    checked={editForm.data.is_active}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'is_active',
                                            e.target.checked,
                                        )
                                    }
                                    className="size-4 cursor-pointer rounded border-zinc-300 text-red-600 focus:ring-red-500"
                                />
                                <label
                                    htmlFor="edit_act_is_active"
                                    className="cursor-pointer text-xs text-zinc-700 select-none dark:text-zinc-300"
                                >
                                    Aktivitas <strong>Aktif</strong> (tampil di
                                    scanner kamera & siap digunakan)
                                </label>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingActivity(null)}
                                    className="h-9.5 cursor-pointer rounded-xl text-xs"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        editForm.processing ||
                                        !editForm.data.name.trim()
                                    }
                                    className="h-9.5 cursor-pointer rounded-xl bg-red-600 px-5 text-xs font-bold text-white hover:bg-red-700"
                                >
                                    {editForm.processing
                                        ? 'Menyimpan...'
                                        : 'Perbarui Aktivitas'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* MODAL: KONFIRMASI HAPUS AKTIVITAS */}
            <Dialog
                open={!!deletingActivity}
                onOpenChange={() => setDeletingActivity(null)}
            >
                <DialogContent className="rounded-3xl p-6 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-rose-600">
                            <AlertCircle className="size-5" />
                            Konfirmasi Hapus Aktivitas
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Tindakan ini permanen dan menghapus jenis aktivitas
                            dari sistem AHASS
                        </DialogDescription>
                    </DialogHeader>

                    {deletingActivity && (
                        <div className="space-y-3 py-2 text-xs text-zinc-600 dark:text-zinc-300">
                            <p>
                                Apakah Anda yakin ingin menghapus layanan
                                aktivitas berikut dari database?
                            </p>
                            <div className="space-y-1 rounded-2xl border border-rose-200 bg-rose-50/50 p-3.5 dark:border-rose-900/40 dark:bg-rose-950/20">
                                <div className="text-sm font-bold text-zinc-900 dark:text-white">
                                    {deletingActivity.name}
                                </div>
                                <div className="font-mono text-[11px] text-zinc-500">
                                    ID: #{deletingActivity.id} &bull; Default
                                    Poin: +{deletingActivity.points} PTS
                                </div>
                                <div className="pt-1 text-[10px] text-zinc-500">
                                    Riwayat transaksi sebelumnya yang pernah
                                    menggunakan aktivitas ini akan tetap aman
                                    tersimpan di arsip database.
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 pt-1 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeletingActivity(null)}
                            className="h-9 cursor-pointer rounded-xl text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteActivity}
                            className="h-9 cursor-pointer rounded-xl bg-rose-600 text-xs font-bold hover:bg-rose-700"
                        >
                            Ya, Hapus Aktivitas Ini
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL: FILTER STATUS AKTIVITAS */}
            <Dialog open={filterModalOpen} onOpenChange={setFilterModalOpen}>
                <DialogContent className="rounded-3xl p-6 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60">
                                <Filter className="size-4" />
                            </div>
                            Filter Data Aktivitas
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Saring data katalog aktivitas berdasarkan status
                            keaktifan layanan
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2 text-xs">
                        <div className="space-y-2">
                            <label className="block font-bold text-zinc-800 dark:text-zinc-200">
                                Status Keaktifan Aktivitas
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTempStatus('all')}
                                    className={`cursor-pointer rounded-2xl border p-3 text-center transition-all ${
                                        tempStatus === 'all'
                                            ? 'border-red-600 bg-red-50/70 font-bold text-red-600 shadow-xs dark:bg-red-950/50'
                                            : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-300'
                                    }`}
                                >
                                    Semua Status
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTempStatus('active')}
                                    className={`cursor-pointer rounded-2xl border p-3 text-center transition-all ${
                                        tempStatus === 'active'
                                            ? 'border-emerald-600 bg-emerald-50/70 font-bold text-emerald-600 shadow-xs dark:bg-emerald-950/50'
                                            : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-300'
                                    }`}
                                >
                                    Hanya Aktif
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTempStatus('inactive')}
                                    className={`cursor-pointer rounded-2xl border p-3 text-center transition-all ${
                                        tempStatus === 'inactive'
                                            ? 'border-zinc-600 bg-zinc-100 font-bold text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
                                            : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-300'
                                    }`}
                                >
                                    Hanya Nonaktif
                                </button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 pt-3 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setTempStatus('all');
                                setStatusFilter('all');
                                applyActivityFilters(activitySearch, 'all');
                                setFilterModalOpen(false);
                                toast.success(
                                    'Filter aktivitas direset ke default.',
                                );
                            }}
                            className="h-9.5 cursor-pointer rounded-xl text-xs"
                        >
                            Reset Filter
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                setStatusFilter(tempStatus);
                                applyActivityFilters(
                                    activitySearch,
                                    tempStatus,
                                );
                                setFilterModalOpen(false);
                                toast.success(
                                    'Filter aktivitas berhasil diterapkan.',
                                );
                            }}
                            className="h-9.5 cursor-pointer rounded-xl bg-red-600 px-5 text-xs font-bold text-white hover:bg-red-700"
                        >
                            Terapkan Filter
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL: DETAIL SNAPSHOT RIWAYAT MEMBER */}
            <Dialog
                open={!!selectedHistory}
                onOpenChange={() => setSelectedHistory(null)}
            >
                <DialogContent className="rounded-3xl p-6 sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60">
                                <Info className="size-4" />
                            </div>
                            Snapshot Riwayat Transaksi #{selectedHistory?.id}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Rekaman data historis lengkap saat poin reward
                            ditambahkan kepada pelanggan.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedHistory && (
                        <div className="space-y-4 py-2 text-xs">
                            <div className="space-y-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700/80 dark:bg-zinc-800/50">
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">
                                        Aktivitas Layanan:
                                    </span>
                                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                        {selectedHistory.activity_name}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">
                                        ID Aktivitas:
                                    </span>
                                    <span className="font-mono text-zinc-700 dark:text-zinc-300">
                                        #{selectedHistory.activity_id}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">
                                        Reward Ditambahkan:
                                    </span>
                                    <Badge className="bg-emerald-600 font-mono font-bold text-white">
                                        +{selectedHistory.points} PTS
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">
                                        Waktu Transaksi:
                                    </span>
                                    <span className="font-mono text-zinc-600 dark:text-zinc-400">
                                        {selectedHistory.created_at}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">
                                        Petugas Admin:
                                    </span>
                                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                        {selectedHistory.admin_name}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 dark:bg-red-500/10">
                                <div className="text-[11px] font-bold tracking-wider text-red-600 uppercase dark:text-red-400">
                                    Data Snapshot Member Pelanggan
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <div>
                                        <span className="block text-[10px] text-zinc-400">
                                            Nama Lengkap Member
                                        </span>
                                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                            {selectedHistory.user_name}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-zinc-400">
                                            ID Member
                                        </span>
                                        <span className="font-mono font-bold text-red-600 dark:text-red-400">
                                            #{selectedHistory.user_id}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-zinc-400">
                                            Email Terdaftar
                                        </span>
                                        <span className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                                            <Mail className="size-3 text-zinc-400" />
                                            {selectedHistory.user_email}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-zinc-400">
                                            Nomor Telepon
                                        </span>
                                        <span className="flex items-center gap-1 font-mono text-zinc-700 dark:text-zinc-300">
                                            <Phone className="size-3 text-zinc-400" />
                                            {selectedHistory.user_phone}
                                        </span>
                                    </div>
                                </div>
                                <div className="border-t border-red-500/10 pt-1">
                                    <span className="block text-[10px] text-zinc-400">
                                        Alamat Domisili
                                    </span>
                                    <span className="mt-0.5 flex items-start gap-1 text-zinc-700 dark:text-zinc-300">
                                        <MapPin className="mt-0.5 size-3.5 shrink-0 text-zinc-400" />
                                        {selectedHistory.user_address}
                                    </span>
                                </div>
                            </div>

                            {selectedHistory.notes &&
                                selectedHistory.notes !== '-' && (
                                    <div className="rounded-xl bg-zinc-100 p-3 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                        <span className="block text-[10px] font-bold text-zinc-400">
                                            Catatan Admin
                                        </span>
                                        {selectedHistory.notes}
                                    </div>
                                )}

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    onClick={() => setSelectedHistory(null)}
                                    className="h-9.5 w-full cursor-pointer rounded-xl bg-zinc-900 text-xs font-bold text-white hover:bg-zinc-800"
                                >
                                    Tutup Snapshot
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

AdminActivitiesIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            {
                title: 'Admin Console',
                href: '/admin/dashboard',
            },
            {
                title: 'Manajemen Aktivitas',
                href: '/admin/activities',
            },
        ]}
    >
        {page}
    </AppLayout>
);
