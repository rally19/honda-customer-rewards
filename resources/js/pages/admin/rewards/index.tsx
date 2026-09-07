import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Coins,
    Copy,
    Download,
    Eye,
    Filter,
    Gift,
    History,
    Info,
    Mail,
    MapPin,
    MessageCircle,
    Pencil,
    Phone,
    Plus,
    RefreshCw,
    RotateCcw,
    Search,
    Shield,
    Sparkles,
    Tag,
    Trash2,
    UserCheck,
    Users,
    X,
    XCircle,
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

type RewardItem = {
    id: string;
    name: string;
    description: string;
    image_url: string;
    points_cost: number;
    stock: number;
    start_period: string | null;
    end_period: string | null;
    start_period_formatted: string;
    end_period_formatted: string;
    is_active: boolean;
    is_claimable: boolean;
    exchanges_count: number;
    created_at: string;
};

type PointExchangeItem = {
    id: string;
    reward_id: string;
    reward_name: string;
    reward_image: string;
    points_cost: number;
    user_id: string;
    user_name: string;
    user_email: string;
    user_phone: string;
    user_address: string;
    status: 'hold' | 'claimed' | 'rejected' | 'cancelled';
    admin_name: string;
    admin_notes: string;
    created_at: string;
    raw_date: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedExchanges = {
    data: PointExchangeItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
};

type Stats = {
    totalRewards: number;
    activeRewards: number;
    holdExchanges: number;
    totalPointsExchanged: number;
};

type Props = {
    rewards: RewardItem[];
    exchanges: PaginatedExchanges;
    stats: Stats;
    filters: {
        search: string;
        status: string;
        exchange_search: string;
        exchange_status: string;
    };
};

export default function AdminRewardsPage({
    rewards = [],
    exchanges,
    stats,
    filters,
}: Props) {
    const [currentTab, setCurrentTab] = useState<'rewards' | 'exchanges'>(
        'rewards',
    );

    // Reward Filters & State
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [tempStatus, setTempStatus] = useState(filters.status || 'all');

    // Exchange Filters & State
    const [exchangeSearch, setExchangeSearch] = useState(
        filters.exchange_search || '',
    );
    const [exchangeStatusFilter, setExchangeStatusFilter] = useState(
        filters.exchange_status || 'all',
    );
    const [exchangeFilterModalOpen, setExchangeFilterModalOpen] =
        useState(false);
    const [tempExchangeStatus, setTempExchangeStatus] = useState(
        filters.exchange_status || 'all',
    );

    // Modals
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [detailExchangeModalOpen, setDetailExchangeModalOpen] =
        useState(false);

    // Selected items
    const [selectedReward, setSelectedReward] = useState<RewardItem | null>(
        null,
    );
    const [selectedExchange, setSelectedExchange] =
        useState<PointExchangeItem | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        description: '',
        points_cost: 100,
        stock: 20,
        start_period: '',
        end_period: '',
        image_url: '',
        is_active: true,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [adminNoteInput, setAdminNoteInput] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const generateRandom10Digit = () => {
        return Math.floor(1000000000 + Math.random() * 9000000000).toString();
    };

    const handleCopy = (id: string, label?: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        toast.success(`${label || `ID #${id}`} berhasil disalin ke clipboard!`);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Reward search & filter handlers
    const applyRewardFilters = (newSearch?: string, newStatus?: string) => {
        router.get(
            '/admin/rewards',
            {
                search:
                    newSearch !== undefined
                        ? newSearch.trim() || undefined
                        : search.trim() || undefined,
                status:
                    newStatus !== undefined
                        ? newStatus !== 'all'
                            ? newStatus
                            : undefined
                        : statusFilter !== 'all'
                          ? statusFilter
                          : undefined,
                exchange_search: exchangeSearch.trim() || undefined,
                exchange_status:
                    exchangeStatusFilter !== 'all'
                        ? exchangeStatusFilter
                        : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleResetRewardFilters = () => {
        setSearch('');
        setStatusFilter('all');
        router.get(
            '/admin/rewards',
            {
                exchange_search: exchangeSearch.trim() || undefined,
                exchange_status:
                    exchangeStatusFilter !== 'all'
                        ? exchangeStatusFilter
                        : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    // Exchange search & filter handlers
    const applyExchangeFilters = (newSearch?: string, newStatus?: string) => {
        router.get(
            '/admin/rewards',
            {
                search: search.trim() || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                exchange_search:
                    newSearch !== undefined
                        ? newSearch.trim() || undefined
                        : exchangeSearch.trim() || undefined,
                exchange_status:
                    newStatus !== undefined
                        ? newStatus !== 'all'
                            ? newStatus
                            : undefined
                        : exchangeStatusFilter !== 'all'
                          ? exchangeStatusFilter
                          : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleResetExchangeFilters = () => {
        setExchangeSearch('');
        setExchangeStatusFilter('all');
        router.get(
            '/admin/rewards',
            {
                search: search.trim() || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    // CSV Exports
    const handleExportRewardsCsv = () => {
        const headers = [
            'ID Reward',
            'Nama Reward',
            'Deskripsi',
            'Biaya Poin',
            'Stok',
            'Mulai Periode',
            'Akhir Periode',
            'Status Aktif',
            'Total Ditukar',
            'Tanggal Dibuat',
        ];
        const rows = rewards.map((r) => [
            `"${r.id}"`,
            `"${r.name.replace(/"/g, '""')}"`,
            `"${(r.description || '').replace(/"/g, '""')}"`,
            r.points_cost,
            r.stock,
            r.start_period || '-',
            r.end_period || '-',
            r.is_active ? 'Aktif' : 'Nonaktif',
            r.exchanges_count,
            r.created_at,
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((e) => e.join(',')),
        ].join('\n');
        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
            'download',
            `katalog-reward-honda-${new Date().toISOString().slice(0, 10)}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        navigator.clipboard.writeText(csvContent);
        toast.success(
            'Data katalog reward berhasil diekspor ke file CSV & disalin ke clipboard!',
        );
    };

    const handleExportExchangesCsv = () => {
        const headers = [
            'ID Penukaran',
            'Nama Reward',
            'Biaya Poin',
            'ID Member',
            'Nama Member',
            'Email',
            'No Telepon',
            'Alamat',
            'Status',
            'Petugas',
            'Catatan Admin',
            'Tanggal Transaksi',
        ];
        const rows = exchanges.data.map((ex) => [
            `"${ex.id}"`,
            `"${ex.reward_name.replace(/"/g, '""')}"`,
            ex.points_cost,
            `"${ex.user_id}"`,
            `"${ex.user_name.replace(/"/g, '""')}"`,
            ex.user_email,
            ex.user_phone,
            `"${(ex.user_address || '').replace(/"/g, '""')}"`,
            ex.status.toUpperCase(),
            `"${ex.admin_name.replace(/"/g, '""')}"`,
            `"${(ex.admin_notes || '').replace(/"/g, '""')}"`,
            ex.created_at,
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((e) => e.join(',')),
        ].join('\n');
        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
            'download',
            `log-penukaran-poin-honda-${new Date().toISOString().slice(0, 10)}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        navigator.clipboard.writeText(csvContent);
        toast.success(
            'Data riwayat penukaran poin berhasil diekspor ke file CSV & disalin ke clipboard!',
        );
    };

    // Open Create Modal
    const openCreateModal = () => {
        setFormData({
            id: generateRandom10Digit(),
            name: '',
            description: '',
            points_cost: 100,
            stock: 20,
            start_period: '',
            end_period: '',
            image_url: '',
            is_active: true,
        });
        setImageFile(null);
        setCreateModalOpen(true);
    };

    // Open Edit Modal
    const openEditModal = (reward: RewardItem) => {
        setSelectedReward(reward);
        setFormData({
            id: reward.id,
            name: reward.name,
            description: reward.description || '',
            points_cost: reward.points_cost,
            stock: reward.stock,
            start_period: reward.start_period || '',
            end_period: reward.end_period || '',
            image_url: reward.image_url || '',
            is_active: reward.is_active,
        });
        setImageFile(null);
        setEditModalOpen(true);
    };

    // Form Submit Handlers
    const handleCreateReward = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = new FormData();
        payload.append('id', formData.id);
        payload.append('name', formData.name);
        payload.append('description', formData.description);
        payload.append('points_cost', formData.points_cost.toString());
        payload.append('stock', formData.stock.toString());
        if (formData.start_period)
            payload.append('start_period', formData.start_period);
        if (formData.end_period)
            payload.append('end_period', formData.end_period);
        if (formData.image_url) payload.append('image_url', formData.image_url);
        if (imageFile) payload.append('image_file', imageFile);
        payload.append('is_active', formData.is_active ? '1' : '0');

        router.post('/admin/rewards', payload as any, {
            onSuccess: () => {
                setCreateModalOpen(false);
                setIsSubmitting(false);
                toast.success('Reward baru berhasil ditambahkan!');
            },
            onError: (errs) => {
                setIsSubmitting(false);
                const msg = Object.values(errs)[0] as string;
                toast.error(msg || 'Gagal menambahkan reward');
            },
        });
    };

    const handleEditReward = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReward) return;
        setIsSubmitting(true);

        const payload = new FormData();
        payload.append('_method', 'PUT');
        payload.append('name', formData.name);
        payload.append('description', formData.description);
        payload.append('points_cost', formData.points_cost.toString());
        payload.append('stock', formData.stock.toString());
        if (formData.start_period)
            payload.append('start_period', formData.start_period);
        if (formData.end_period)
            payload.append('end_period', formData.end_period);
        if (formData.image_url) payload.append('image_url', formData.image_url);
        if (imageFile) payload.append('image_file', imageFile);
        payload.append('is_active', formData.is_active ? '1' : '0');

        router.post(`/admin/rewards/${selectedReward.id}`, payload as any, {
            onSuccess: () => {
                setEditModalOpen(false);
                setIsSubmitting(false);
                toast.success('Reward berhasil diperbarui!');
            },
            onError: (errs) => {
                setIsSubmitting(false);
                const msg = Object.values(errs)[0] as string;
                toast.error(msg || 'Gagal memperbarui reward');
            },
        });
    };

    const handleDeleteReward = () => {
        if (!selectedReward) return;
        setIsSubmitting(true);

        router.delete(`/admin/rewards/${selectedReward.id}`, {
            onSuccess: () => {
                setDeleteModalOpen(false);
                setIsSubmitting(false);
                toast.success(
                    `Reward '${selectedReward.name}' berhasil dihapus.`,
                );
            },
            onError: () => {
                setIsSubmitting(false);
                toast.error('Gagal menghapus reward');
            },
        });
    };

    const handleApproveExchange = () => {
        if (!selectedExchange) return;
        setIsSubmitting(true);

        router.post(
            `/admin/rewards/exchanges/${selectedExchange.id}/approve`,
            {
                admin_notes:
                    adminNoteInput.trim() || 'Disetujui oleh admin AHASS.',
            },
            {
                onSuccess: () => {
                    setApproveModalOpen(false);
                    setIsSubmitting(false);
                    setAdminNoteInput('');
                    toast.success(
                        `Klaim #${selectedExchange.id} berhasil disetujui!`,
                    );
                },
                onError: (errs) => {
                    setIsSubmitting(false);
                    const msg = Object.values(errs)[0] as string;
                    toast.error(msg || 'Gagal menyetujui klaim');
                },
            },
        );
    };

    const handleRejectExchange = () => {
        if (!selectedExchange) return;
        setIsSubmitting(true);

        router.post(
            `/admin/rewards/exchanges/${selectedExchange.id}/reject`,
            {
                admin_notes:
                    adminNoteInput.trim() ||
                    'Ditolak oleh admin AHASS. Poin telah dikembalikan.',
            },
            {
                onSuccess: () => {
                    setRejectModalOpen(false);
                    setIsSubmitting(false);
                    setAdminNoteInput('');
                    toast.success(
                        `Klaim #${selectedExchange.id} ditolak. Saldo & stok dikembalikan.`,
                    );
                },
                onError: (errs) => {
                    setIsSubmitting(false);
                    const msg = Object.values(errs)[0] as string;
                    toast.error(msg || 'Gagal menolak klaim');
                },
            },
        );
    };

    const getStatusBadge = (status: PointExchangeItem['status']) => {
        switch (status) {
            case 'hold':
                return (
                    <Badge className="border-amber-300 bg-amber-100 text-[10px] font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                        <Clock className="mr-1 size-3" />
                        HOLD (Menunggu)
                    </Badge>
                );
            case 'claimed':
                return (
                    <Badge className="border-emerald-300 bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                        <CheckCircle2 className="mr-1 size-3" />
                        Claimed (Disetujui)
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="border-rose-300 bg-rose-100 text-[10px] font-bold text-rose-700 dark:border-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                        <XCircle className="mr-1 size-3" />
                        Rejected (Ditolak)
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge className="border-zinc-200 bg-zinc-100 text-[10px] font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                        <RotateCcw className="mr-1 size-3" />
                        Cancelled (Batal)
                    </Badge>
                );
        }
    };

    return (
        <>
            <Head title="Manajemen Hadiah & Penukaran Poin - Honda Loyalty Admin" />

            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-8">
                {/* Header Banner */}
                <div className="relative flex flex-col gap-5 overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-red-700 to-zinc-950 p-6 text-white shadow-xl shadow-red-950/20 md:p-8 lg:flex-row lg:items-center lg:justify-between">
                    <div className="pointer-events-none absolute right-0 -bottom-11 opacity-15 select-none">
                        <img
                            src="/images/logo/honda_logo_white.png"
                            alt="Honda"
                            className="h-auto w-84 md:w-96"
                        />
                    </div>

                    <div className="relative z-10 max-w-2xl space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-bold text-white shadow-xs backdrop-blur-md">
                                <Gift className="size-3.5" />
                                Modul Hadiah & Penukaran AHASS
                            </span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl lg:text-4xl">
                            Manajemen Hadiah & Penukaran Poin
                        </h1>
                        <p className="text-xs leading-relaxed text-red-100/90 md:text-sm">
                            Kelola katalog merchandise resmi, voucher servis,
                            oli, serta monitor dan persetujuan klaim penukaran
                            poin member pelanggan Honda.
                        </p>
                    </div>

                    <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-3">
                        <Link
                            href="/admin/dashboard"
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-white/20 md:text-sm"
                        >
                            <ArrowLeft className="size-4" />
                            Kembali ke Dashboard
                        </Link>
                        <Button
                            onClick={openCreateModal}
                            className="h-10 cursor-pointer gap-2 rounded-xl bg-white px-4 text-xs font-bold text-red-700 shadow-md hover:bg-red-50 md:text-sm"
                        >
                            <Plus className="size-4 text-red-600" />
                            Tambah Reward Baru
                        </Button>
                    </div>
                </div>

                {/* KPI Metrics Strip */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Stat 1: Total Rewards */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold tracking-wider text-zinc-600 uppercase dark:text-zinc-300">
                                Total Katalog
                            </span>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60">
                                <Gift className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.totalRewards.toLocaleString('id-ID')}
                            </div>
                            <span className="mt-1 block text-xs text-zinc-500">
                                Item reward terdaftar
                            </span>
                        </div>
                    </div>

                    {/* Stat 2: Active Rewards */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold tracking-wider text-zinc-600 uppercase dark:text-zinc-300">
                                Reward Aktif
                            </span>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60">
                                <CheckCircle2 className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.activeRewards.toLocaleString('id-ID')}
                            </div>
                            <span className="mt-1 block text-xs font-semibold text-emerald-600">
                                {stats.activeRewards} item siap ditukarkan
                            </span>
                        </div>
                    </div>

                    {/* Stat 3: Hold Exchanges */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold tracking-wider text-zinc-600 uppercase dark:text-zinc-300">
                                Menunggu (HOLD)
                            </span>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60">
                                <Clock className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.holdExchanges.toLocaleString('id-ID')}
                            </div>
                            <span className="mt-1 block text-xs font-semibold text-amber-600">
                                Menunggu persetujuan admin
                            </span>
                        </div>
                    </div>

                    {/* Stat 4: Points Exchanged */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold tracking-wider text-zinc-600 uppercase dark:text-zinc-300">
                                Poin Ditukarkan
                            </span>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60">
                                <Coins className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.totalPointsExchanged.toLocaleString(
                                    'id-ID',
                                )}
                            </div>
                            <span className="mt-1 block text-xs font-semibold text-purple-600">
                                Akumulasi poin disalurkan
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Content Container with Tabs */}
                <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    {/* Tab Navigation Bar */}
                    <div className="flex gap-2 overflow-x-auto border-b border-zinc-200 bg-zinc-50/50 px-6 pt-3.5 dark:border-zinc-800 dark:bg-zinc-950/30">
                        <button
                            type="button"
                            onClick={() => setCurrentTab('rewards')}
                            className={`flex cursor-pointer items-center gap-2 border-b-2 px-3 pb-3.5 text-xs font-bold whitespace-nowrap transition-all md:text-sm ${
                                currentTab === 'rewards'
                                    ? 'border-red-600 text-red-600 dark:text-red-400'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                            }`}
                        >
                            <Gift className="size-4" />
                            <span>Katalog Hadiah & Reward</span>
                            <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    currentTab === 'rewards'
                                        ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300'
                                        : 'bg-zinc-200/80 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                                }`}
                            >
                                {rewards.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setCurrentTab('exchanges')}
                            className={`flex cursor-pointer items-center gap-2 border-b-2 px-3 pb-3.5 text-xs font-bold whitespace-nowrap transition-all md:text-sm ${
                                currentTab === 'exchanges'
                                    ? 'border-red-600 text-red-600 dark:text-red-400'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                            }`}
                        >
                            <History className="size-4" />
                            <span>Log Riwayat Penukaran Poin</span>
                            <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    currentTab === 'exchanges'
                                        ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300'
                                        : 'bg-zinc-200/80 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                                }`}
                            >
                                {exchanges.total}
                            </span>
                            {stats.holdExchanges > 0 && (
                                <span className="relative flex size-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex size-2 rounded-full bg-amber-500"></span>
                                </span>
                            )}
                        </button>
                    </div>

                    {/* ========================================================================= */}
                    {/* TAB 1: KATALOG REWARD                                                     */}
                    {/* ========================================================================= */}
                    {currentTab === 'rewards' && (
                        <div>
                            {/* Filter & Search Bar */}
                            <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 p-6 md:flex-row md:items-center dark:border-zinc-800">
                                {/* Search */}
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                                    <Input
                                        type="text"
                                        placeholder="Cari nama, ID reward, deskripsi..."
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            applyRewardFilters(
                                                e.target.value,
                                                statusFilter,
                                            );
                                        }}
                                        className="h-9.5 rounded-xl pl-9 text-xs focus-visible:ring-red-500"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearch('');
                                                applyRewardFilters(
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

                                {/* Actions: Filter Modal Trigger & Export */}
                                <div className="flex items-center gap-2.5">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setTempStatus(statusFilter);
                                            setFilterModalOpen(true);
                                        }}
                                        className={`h-9.5 cursor-pointer gap-2 rounded-xl text-xs transition-all ${
                                            statusFilter !== 'all'
                                                ? 'border-red-300 bg-red-50/70 font-bold text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400'
                                                : 'text-zinc-700 dark:text-zinc-300'
                                        }`}
                                    >
                                        <Filter className="size-3.5 text-red-600" />
                                        <span>Filter</span>
                                        {statusFilter !== 'all' && (
                                            <span className="flex size-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white">
                                                1
                                            </span>
                                        )}
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleExportRewardsCsv}
                                        className="h-9.5 cursor-pointer gap-1.5 rounded-xl text-xs"
                                    >
                                        <Download className="size-3.5" />
                                        Ekspor CSV
                                    </Button>
                                </div>
                            </div>

                            {/* Active Filter Chips */}
                            {(search || statusFilter !== 'all') && (
                                <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200/80 bg-zinc-50/70 px-6 py-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
                                    <span className="text-[11px] font-medium text-zinc-400">
                                        Filter Aktif:
                                    </span>

                                    {search && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                            Pencarian: "{search}"
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearch('');
                                                    applyRewardFilters(
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
                                                    applyRewardFilters(
                                                        search,
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

                                    <button
                                        type="button"
                                        onClick={handleResetRewardFilters}
                                        className="ml-1 cursor-pointer text-[11px] text-zinc-500 underline hover:text-red-600"
                                    >
                                        Reset Semua
                                    </button>
                                </div>
                            )}

                            {/* Desktop Table View */}
                            <div className="hidden overflow-x-auto sm:block">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-zinc-200 bg-zinc-50 font-bold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60">
                                        <tr>
                                            <th className="px-4 py-3.5">
                                                ID & Foto Reward
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Nama & Deskripsi Reward
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Biaya Poin
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Stok Fisik
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Periode Berlaku
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Status Katalog
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Klaim Sukses
                                            </th>
                                            <th className="px-4 py-3.5 text-right">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                        {rewards.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={8}
                                                    className="py-12 text-center text-zinc-400"
                                                >
                                                    Tidak ada data reward yang
                                                    sesuai dengan filter
                                                    pencarian.
                                                </td>
                                            </tr>
                                        ) : (
                                            rewards.map((reward) => (
                                                <tr
                                                    key={reward.id}
                                                    className="transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40"
                                                >
                                                    {/* ID & Foto */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-11 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                                                                {reward.image_url ? (
                                                                    <img
                                                                        src={
                                                                            reward.image_url
                                                                        }
                                                                        alt={
                                                                            reward.name
                                                                        }
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                                                        <Gift className="size-5" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-mono font-bold text-red-600 dark:text-red-400">
                                                                    #{reward.id}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleCopy(
                                                                            reward.id,
                                                                            `ID Reward ${reward.id}`,
                                                                        )
                                                                    }
                                                                    className="cursor-pointer text-zinc-400 hover:text-zinc-600"
                                                                    title="Salin ID Reward"
                                                                >
                                                                    {copiedId ===
                                                                    reward.id ? (
                                                                        <Check className="size-3 text-emerald-500" />
                                                                    ) : (
                                                                        <Copy className="size-3" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Nama & Deskripsi */}
                                                    <td className="max-w-xs px-4 py-3.5">
                                                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                                            {reward.name}
                                                        </div>
                                                        <div className="mt-0.5 line-clamp-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                                                            {reward.description ||
                                                                '-'}
                                                        </div>
                                                    </td>

                                                    {/* Biaya Poin */}
                                                    <td className="px-4 py-3.5">
                                                        <span className="inline-flex items-center gap-1 font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                                                            <Coins className="size-3.5" />
                                                            {reward.points_cost}{' '}
                                                            PTS
                                                        </span>
                                                    </td>

                                                    {/* Stok */}
                                                    <td className="px-4 py-3.5">
                                                        <span
                                                            className={`font-mono text-xs font-bold ${
                                                                reward.stock <=
                                                                5
                                                                    ? 'text-red-600 dark:text-red-400'
                                                                    : 'text-zinc-900 dark:text-zinc-100'
                                                            }`}
                                                        >
                                                            {reward.stock} unit
                                                        </span>
                                                    </td>

                                                    {/* Periode */}
                                                    <td className="px-4 py-3.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="size-3 shrink-0 text-zinc-400" />
                                                            <span>
                                                                {
                                                                    reward.start_period_formatted
                                                                }{' '}
                                                                s/d{' '}
                                                                {
                                                                    reward.end_period_formatted
                                                                }
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-4 py-3.5">
                                                        {reward.is_active ? (
                                                            <Badge className="border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                                <CheckCircle2 className="mr-1 size-3" />
                                                                Aktif
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-[10px] font-semibold text-zinc-500"
                                                            >
                                                                Nonaktif
                                                            </Badge>
                                                        )}
                                                    </td>

                                                    {/* Klaim Sukses */}
                                                    <td className="px-4 py-3.5 font-mono font-semibold text-zinc-600 dark:text-zinc-400">
                                                        {reward.exchanges_count}
                                                        x
                                                    </td>

                                                    {/* Aksi */}
                                                    <td className="px-4 py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        reward,
                                                                    )
                                                                }
                                                                className="h-8 cursor-pointer rounded-lg px-2 text-xs text-zinc-600 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                                                                title="Edit Reward"
                                                            >
                                                                <Pencil className="mr-1 size-3.5" />
                                                                Edit
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    setSelectedReward(
                                                                        reward,
                                                                    );
                                                                    setDeleteModalOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                                className="h-8 cursor-pointer rounded-lg px-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                                                title="Hapus Reward"
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

                            {/* Mobile Card List View */}
                            <div className="block divide-y divide-zinc-100 sm:hidden dark:divide-zinc-800/80">
                                {rewards.length === 0 ? (
                                    <div className="py-12 text-center text-xs text-zinc-400">
                                        Tidak ada data reward yang sesuai dengan
                                        pencarian.
                                    </div>
                                ) : (
                                    rewards.map((reward) => (
                                        <div
                                            key={reward.id}
                                            className="space-y-3 p-4"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="size-14 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                                                    {reward.image_url ? (
                                                        <img
                                                            src={
                                                                reward.image_url
                                                            }
                                                            alt={reward.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                                            <Gift className="size-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                                                            #{reward.id}
                                                        </span>
                                                        {reward.is_active ? (
                                                            <Badge className="bg-emerald-50 text-[10px] font-bold text-emerald-700">
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
                                                    </div>
                                                    <h3 className="mt-0.5 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                        {reward.name}
                                                    </h3>
                                                    <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-500">
                                                        {reward.description ||
                                                            '-'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between border-t border-zinc-100 pt-1 text-xs dark:border-zinc-800/60">
                                                <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                                                    {reward.points_cost} PTS
                                                </span>
                                                <span className="font-mono text-[11px] text-zinc-500">
                                                    Stok:{' '}
                                                    <strong>
                                                        {reward.stock}
                                                    </strong>{' '}
                                                    &bull; Ditukar:{' '}
                                                    <strong>
                                                        {reward.exchanges_count}
                                                        x
                                                    </strong>
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-end gap-2 pt-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        openEditModal(reward)
                                                    }
                                                    className="h-8 rounded-xl px-3 text-xs"
                                                >
                                                    <Pencil className="mr-1 size-3" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedReward(
                                                            reward,
                                                        );
                                                        setDeleteModalOpen(
                                                            true,
                                                        );
                                                    }}
                                                    className="h-8 rounded-xl px-2 text-xs text-red-600"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 2: LOG PENUKARAN POIN (POINT EXCHANGE)                                */}
                    {/* ========================================================================= */}
                    {currentTab === 'exchanges' && (
                        <div>
                            {/* Filter & Search Bar */}
                            <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 p-6 md:flex-row md:items-center dark:border-zinc-800">
                                {/* Search */}
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                                    <Input
                                        type="text"
                                        placeholder="Cari ID tiket, nama member, email, HP, reward..."
                                        value={exchangeSearch}
                                        onChange={(e) => {
                                            setExchangeSearch(e.target.value);
                                            applyExchangeFilters(
                                                e.target.value,
                                                exchangeStatusFilter,
                                            );
                                        }}
                                        className="h-9.5 rounded-xl pl-9 text-xs focus-visible:ring-red-500"
                                    />
                                    {exchangeSearch && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setExchangeSearch('');
                                                applyExchangeFilters(
                                                    '',
                                                    exchangeStatusFilter,
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
                                            setTempExchangeStatus(
                                                exchangeStatusFilter,
                                            );
                                            setExchangeFilterModalOpen(true);
                                        }}
                                        className={`h-9.5 cursor-pointer gap-2 rounded-xl text-xs transition-all ${
                                            exchangeStatusFilter !== 'all'
                                                ? 'border-red-300 bg-red-50/70 font-bold text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400'
                                                : 'text-zinc-700 dark:text-zinc-300'
                                        }`}
                                    >
                                        <Filter className="size-3.5 text-red-600" />
                                        <span>Filter Status</span>
                                        {exchangeStatusFilter !== 'all' && (
                                            <span className="flex size-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white">
                                                1
                                            </span>
                                        )}
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleExportExchangesCsv}
                                        className="h-9.5 cursor-pointer gap-1.5 rounded-xl text-xs"
                                    >
                                        <Download className="size-3.5" />
                                        Ekspor CSV
                                    </Button>
                                </div>
                            </div>

                            {/* Active Filter Chips */}
                            {(exchangeSearch ||
                                exchangeStatusFilter !== 'all') && (
                                <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200/80 bg-zinc-50/70 px-6 py-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
                                    <span className="text-[11px] font-medium text-zinc-400">
                                        Filter Aktif:
                                    </span>

                                    {exchangeSearch && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                            Pencarian: "{exchangeSearch}"
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setExchangeSearch('');
                                                    applyExchangeFilters(
                                                        '',
                                                        exchangeStatusFilter,
                                                    );
                                                }}
                                                className="cursor-pointer hover:text-zinc-900"
                                                title="Hapus filter pencarian"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </span>
                                    )}

                                    {exchangeStatusFilter !== 'all' && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-300">
                                            Status:{' '}
                                            {exchangeStatusFilter.toUpperCase()}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setExchangeStatusFilter(
                                                        'all',
                                                    );
                                                    applyExchangeFilters(
                                                        exchangeSearch,
                                                        'all',
                                                    );
                                                }}
                                                className="cursor-pointer hover:text-red-900"
                                                title="Hapus filter status"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </span>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleResetExchangeFilters}
                                        className="ml-1 cursor-pointer text-[11px] text-zinc-500 underline hover:text-red-600"
                                    >
                                        Reset Semua
                                    </button>
                                </div>
                            )}

                            {/* Desktop Table */}
                            <div className="hidden overflow-x-auto sm:block">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-zinc-200 bg-zinc-50 font-bold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60">
                                        <tr>
                                            <th className="px-4 py-3.5">
                                                ID & Waktu Klaim
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Item Hadiah Ditukar
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Member Pelanggan
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Biaya Poin
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Status Klaim
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Petugas & Catatan
                                            </th>
                                            <th className="px-4 py-3.5 text-right">
                                                Aksi Verifikasi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                        {exchanges.data.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={7}
                                                    className="py-12 text-center text-zinc-400"
                                                >
                                                    Tidak ada rekaman log
                                                    penukaran poin yang sesuai
                                                    dengan filter.
                                                </td>
                                            </tr>
                                        ) : (
                                            exchanges.data.map((ex) => (
                                                <tr
                                                    key={ex.id}
                                                    className="transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40"
                                                >
                                                    {/* ID & Waktu */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-mono font-bold text-red-600 dark:text-red-400">
                                                                #{ex.id}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleCopy(
                                                                        ex.id,
                                                                        `ID Klaim #${ex.id}`,
                                                                    )
                                                                }
                                                                className="cursor-pointer text-zinc-400 hover:text-zinc-600"
                                                                title="Salin ID Klaim"
                                                            >
                                                                {copiedId ===
                                                                ex.id ? (
                                                                    <Check className="size-3 text-emerald-500" />
                                                                ) : (
                                                                    <Copy className="size-3" />
                                                                )}
                                                            </button>
                                                        </div>
                                                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-400">
                                                            <Clock className="size-3" />
                                                            <span>
                                                                {ex.created_at}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Item Hadiah */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="size-9 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                                                                {ex.reward_image ? (
                                                                    <img
                                                                        src={
                                                                            ex.reward_image
                                                                        }
                                                                        alt={
                                                                            ex.reward_name
                                                                        }
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                                                        <Gift className="size-4" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                                                    {
                                                                        ex.reward_name
                                                                    }
                                                                </div>
                                                                <span className="font-mono text-[10px] text-zinc-400">
                                                                    ID Reward: #
                                                                    {
                                                                        ex.reward_id
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Member Pelanggan */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                                            {ex.user_name}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                                                            <Phone className="size-3 text-zinc-400" />
                                                            <span className="font-mono">
                                                                {ex.user_phone}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Biaya Poin */}
                                                    <td className="px-4 py-3.5">
                                                        <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                                                            {ex.points_cost} PTS
                                                        </span>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-4 py-3.5">
                                                        {getStatusBadge(
                                                            ex.status,
                                                        )}
                                                    </td>

                                                    {/* Petugas & Catatan */}
                                                    <td className="max-w-xs px-4 py-3.5">
                                                        <div className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                                                            {ex.admin_name}
                                                        </div>
                                                        <p
                                                            className="truncate text-[11px] text-zinc-500"
                                                            title={
                                                                ex.admin_notes
                                                            }
                                                        >
                                                            {ex.admin_notes ||
                                                                '-'}
                                                        </p>
                                                    </td>

                                                    {/* Aksi */}
                                                    <td className="px-4 py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    setSelectedExchange(
                                                                        ex,
                                                                    );
                                                                    setDetailExchangeModalOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                                className="h-8 cursor-pointer rounded-lg px-2 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800"
                                                                title="Lihat Detail Snapshot"
                                                            >
                                                                <Eye className="mr-1 size-3.5" />
                                                                Detail
                                                            </Button>

                                                            {ex.status ===
                                                                'hold' && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => {
                                                                            setSelectedExchange(
                                                                                ex,
                                                                            );
                                                                            setAdminNoteInput(
                                                                                '',
                                                                            );
                                                                            setApproveModalOpen(
                                                                                true,
                                                                            );
                                                                        }}
                                                                        className="h-8 cursor-pointer rounded-lg px-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                                                        title="Setujui Klaim"
                                                                    >
                                                                        <CheckCircle2 className="mr-1 size-3.5" />
                                                                        Setujui
                                                                    </Button>

                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => {
                                                                            setSelectedExchange(
                                                                                ex,
                                                                            );
                                                                            setAdminNoteInput(
                                                                                '',
                                                                            );
                                                                            setRejectModalOpen(
                                                                                true,
                                                                            );
                                                                        }}
                                                                        className="h-8 cursor-pointer rounded-lg px-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                                                        title="Tolak Klaim & Refund Poin"
                                                                    >
                                                                        <XCircle className="mr-1 size-3.5" />
                                                                        Tolak
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card List View for Exchanges */}
                            <div className="block divide-y divide-zinc-100 sm:hidden dark:divide-zinc-800/80">
                                {exchanges.data.length === 0 ? (
                                    <div className="py-12 text-center text-xs text-zinc-400">
                                        Tidak ada data log penukaran poin.
                                    </div>
                                ) : (
                                    exchanges.data.map((ex) => (
                                        <div
                                            key={ex.id}
                                            className="space-y-2.5 p-4"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                                                        #{ex.id}
                                                    </span>
                                                    <h3 className="mt-0.5 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                        {ex.reward_name}
                                                    </h3>
                                                    <div className="font-mono text-[11px] text-zinc-500">
                                                        Member: {ex.user_name} (
                                                        {ex.user_phone})
                                                    </div>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    {getStatusBadge(ex.status)}
                                                    <div className="mt-1 font-mono text-xs font-black text-amber-600">
                                                        {ex.points_cost} PTS
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between border-t border-zinc-100 pt-1 text-xs dark:border-zinc-800/60">
                                                <span className="text-[11px] text-zinc-400">
                                                    {ex.created_at}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedExchange(
                                                                ex,
                                                            );
                                                            setDetailExchangeModalOpen(
                                                                true,
                                                            );
                                                        }}
                                                        className="h-7 rounded-lg px-2 text-[11px]"
                                                    >
                                                        Detail
                                                    </Button>
                                                    {ex.status === 'hold' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedExchange(
                                                                        ex,
                                                                    );
                                                                    setAdminNoteInput(
                                                                        '',
                                                                    );
                                                                    setApproveModalOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                                className="h-7 rounded-lg bg-emerald-600 px-2 text-[11px] font-bold text-white hover:bg-emerald-700"
                                                            >
                                                                Setujui
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setSelectedExchange(
                                                                        ex,
                                                                    );
                                                                    setAdminNoteInput(
                                                                        '',
                                                                    );
                                                                    setRejectModalOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                                className="h-7 rounded-lg border-rose-200 px-2 text-[11px] font-bold text-rose-600"
                                                            >
                                                                Tolak
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Pagination */}
                            {exchanges.last_page > 1 && (
                                <div className="flex items-center justify-between border-t border-zinc-200 p-4 text-xs dark:border-zinc-800">
                                    <span className="text-zinc-500">
                                        Menampilkan halaman{' '}
                                        <strong>
                                            {exchanges.current_page}
                                        </strong>{' '}
                                        dari{' '}
                                        <strong>{exchanges.last_page}</strong> (
                                        {exchanges.total} total penukaran)
                                    </span>

                                    <div className="flex items-center gap-1">
                                        {exchanges.links.map((link, i) => (
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

            {/* ========================================================================= */}
            {/* MODAL 1: TAMBAH REWARD BARU                                               */}
            {/* ========================================================================= */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent className="rounded-3xl p-6 sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60">
                                <Gift className="size-4" />
                            </div>
                            Tambah Reward Baru
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Daftarkan merchandise resmi, voucher servis, atau
                            oli Honda baru ke katalog rewards.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={handleCreateReward}
                        className="space-y-4 py-2 text-xs"
                    >
                        {/* ID */}
                        <div>
                            <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                ID Reward (10 Digit Acak)
                            </label>
                            <Input
                                value={formData.id}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        id: e.target.value,
                                    })
                                }
                                maxLength={10}
                                required
                                className="h-9.5 rounded-xl font-mono text-xs"
                            />
                        </div>

                        {/* Nama */}
                        <div>
                            <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                Nama Reward / Merchandise
                            </label>
                            <Input
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
                                placeholder="Contoh: Oli Mesin AHM Oil SPX 2 800ml"
                                required
                                className="h-9.5 rounded-xl text-xs"
                            />
                        </div>

                        {/* Deskripsi */}
                        <div>
                            <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                Deskripsi Reward
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        description: e.target.value,
                                    })
                                }
                                placeholder="Jelaskan spesifikasi, ketentuan penukaran, atau lokasi AHASS..."
                                rows={3}
                                className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs outline-none focus:ring-2 focus:ring-red-500 dark:border-zinc-800 dark:bg-zinc-900"
                            />
                        </div>

                        {/* Biaya Poin & Stok */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                    Biaya Poin (Cost)
                                </label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={formData.points_cost}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            points_cost:
                                                parseInt(e.target.value) || 0,
                                        })
                                    }
                                    required
                                    className="h-9.5 rounded-xl font-mono text-xs"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                    Stok Fisik Tersedia
                                </label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={formData.stock}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            stock:
                                                parseInt(e.target.value) || 0,
                                        })
                                    }
                                    required
                                    className="h-9.5 rounded-xl font-mono text-xs"
                                />
                            </div>
                        </div>

                        {/* Periode Klaim */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                    Mulai Periode (Opsional)
                                </label>
                                <Input
                                    type="date"
                                    value={formData.start_period}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            start_period: e.target.value,
                                        })
                                    }
                                    className="h-9.5 rounded-xl text-xs"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                    Akhir Periode (Opsional)
                                </label>
                                <Input
                                    type="date"
                                    value={formData.end_period}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            end_period: e.target.value,
                                        })
                                    }
                                    className="h-9.5 rounded-xl text-xs"
                                />
                            </div>
                        </div>

                        {/* Upload Gambar / URL */}
                        <div className="space-y-2">
                            <label className="block font-bold text-zinc-800 dark:text-zinc-200">
                                Foto / Gambar Reward
                            </label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    setImageFile(e.target.files?.[0] || null)
                                }
                                className="h-9.5 cursor-pointer rounded-xl text-xs"
                            />
                            <div className="text-[11px] text-zinc-400">
                                Atau masukkan URL gambar langsung:
                            </div>
                            <Input
                                type="text"
                                value={formData.image_url}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        image_url: e.target.value,
                                    })
                                }
                                placeholder="/images/pictures/spx2.png atau https://..."
                                className="h-9.5 rounded-xl font-mono text-xs"
                            />
                        </div>

                        {/* Status Aktif */}
                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="create_reward_active"
                                checked={formData.is_active}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        is_active: e.target.checked,
                                    })
                                }
                                className="size-4 cursor-pointer rounded border-zinc-300 text-red-600 focus:ring-red-500"
                            />
                            <label
                                htmlFor="create_reward_active"
                                className="cursor-pointer text-xs text-zinc-700 select-none dark:text-zinc-300"
                            >
                                Reward langsung berstatus <strong>Aktif</strong>{' '}
                                (siap ditukarkan pelanggan)
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
                                disabled={isSubmitting}
                                className="h-9.5 cursor-pointer rounded-xl bg-red-600 px-5 text-xs font-bold text-white hover:bg-red-700"
                            >
                                {isSubmitting
                                    ? 'Menyimpan...'
                                    : 'Simpan Reward'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* MODAL 2: EDIT REWARD                                                      */}
            {/* ========================================================================= */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="rounded-3xl p-6 sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60">
                                <Pencil className="size-4" />
                            </div>
                            Edit Data Reward #{selectedReward?.id}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Perbarui nama, biaya poin, kuota stok, periode, atau
                            foto reward.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={handleEditReward}
                        className="space-y-4 py-2 text-xs"
                    >
                        <div>
                            <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                Nama Reward
                            </label>
                            <Input
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
                                required
                                className="h-9.5 rounded-xl text-xs"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                Deskripsi Reward
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        description: e.target.value,
                                    })
                                }
                                rows={3}
                                className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs outline-none focus:ring-2 focus:ring-red-500 dark:border-zinc-800 dark:bg-zinc-900"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                    Biaya Poin (Cost)
                                </label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={formData.points_cost}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            points_cost:
                                                parseInt(e.target.value) || 0,
                                        })
                                    }
                                    required
                                    className="h-9.5 rounded-xl font-mono text-xs"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                    Stok Fisik Tersedia
                                </label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={formData.stock}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            stock:
                                                parseInt(e.target.value) || 0,
                                        })
                                    }
                                    required
                                    className="h-9.5 rounded-xl font-mono text-xs"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                    Mulai Periode
                                </label>
                                <Input
                                    type="date"
                                    value={formData.start_period}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            start_period: e.target.value,
                                        })
                                    }
                                    className="h-9.5 rounded-xl text-xs"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                    Akhir Periode
                                </label>
                                <Input
                                    type="date"
                                    value={formData.end_period}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            end_period: e.target.value,
                                        })
                                    }
                                    className="h-9.5 rounded-xl text-xs"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block font-bold text-zinc-800 dark:text-zinc-200">
                                Ganti Foto / Gambar
                            </label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    setImageFile(e.target.files?.[0] || null)
                                }
                                className="h-9.5 cursor-pointer rounded-xl text-xs"
                            />
                            <Input
                                type="text"
                                value={formData.image_url}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        image_url: e.target.value,
                                    })
                                }
                                placeholder="Atau URL gambar..."
                                className="h-9.5 rounded-xl font-mono text-xs"
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="edit_reward_active"
                                checked={formData.is_active}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        is_active: e.target.checked,
                                    })
                                }
                                className="size-4 cursor-pointer rounded border-zinc-300 text-red-600 focus:ring-red-500"
                            />
                            <label
                                htmlFor="edit_reward_active"
                                className="cursor-pointer text-xs text-zinc-700 select-none dark:text-zinc-300"
                            >
                                Status <strong>Aktif</strong> (tampil di
                                katalog)
                            </label>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditModalOpen(false)}
                                className="h-9.5 cursor-pointer rounded-xl text-xs"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-9.5 cursor-pointer rounded-xl bg-red-600 px-5 text-xs font-bold text-white hover:bg-red-700"
                            >
                                {isSubmitting
                                    ? 'Memperbarui...'
                                    : 'Simpan Perubahan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* MODAL 3: HAPUS REWARD                                                     */}
            {/* ========================================================================= */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="rounded-3xl p-6 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-rose-600">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60">
                                <Trash2 className="size-4" />
                            </div>
                            Konfirmasi Hapus Reward
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Tindakan ini tidak dapat dibatalkan. Reward yang
                            dihapus tidak lagi dapat dilihat atau ditukarkan
                            oleh pelanggan.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedReward && (
                        <div className="space-y-2 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 text-xs dark:border-zinc-700 dark:bg-zinc-800/50">
                            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                {selectedReward.name}
                            </div>
                            <div className="font-mono text-[11px] text-zinc-500">
                                ID: #{selectedReward.id} &bull; Biaya:{' '}
                                {selectedReward.points_cost} PTS &bull; Stok:{' '}
                                {selectedReward.stock}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleteModalOpen(false)}
                            className="h-9.5 cursor-pointer rounded-xl text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleDeleteReward}
                            disabled={isSubmitting}
                            className="h-9.5 cursor-pointer rounded-xl bg-red-600 px-5 text-xs font-bold text-white hover:bg-red-700"
                        >
                            {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Reward'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* MODAL 4: FILTER KATALOG REWARD                                            */}
            {/* ========================================================================= */}
            <Dialog open={filterModalOpen} onOpenChange={setFilterModalOpen}>
                <DialogContent className="rounded-3xl p-6 sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            <Filter className="size-4 text-red-600" />
                            Filter Status Katalog Reward
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-2 py-2 text-xs">
                        {[
                            {
                                id: 'all',
                                label: 'Semua Status (Aktif & Nonaktif)',
                            },
                            { id: 'active', label: 'Hanya Reward Aktif' },
                            { id: 'inactive', label: 'Hanya Reward Nonaktif' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setTempStatus(item.id)}
                                className={`flex w-full cursor-pointer items-center justify-between rounded-xl p-3 text-xs font-semibold transition-colors ${
                                    tempStatus === item.id
                                        ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                                        : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                                }`}
                            >
                                <span>{item.label}</span>
                                {tempStatus === item.id && (
                                    <Check className="size-4" />
                                )}
                            </button>
                        ))}
                    </div>

                    <DialogFooter className="flex items-center justify-between gap-2 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setTempStatus('all');
                                setStatusFilter('all');
                                applyRewardFilters(search, 'all');
                                setFilterModalOpen(false);
                            }}
                            className="h-9.5 rounded-xl text-xs text-zinc-500"
                        >
                            Reset Filter
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                setStatusFilter(tempStatus);
                                applyRewardFilters(search, tempStatus);
                                setFilterModalOpen(false);
                                toast.success(
                                    'Filter katalog berhasil diterapkan.',
                                );
                            }}
                            className="h-9.5 rounded-xl bg-red-600 px-5 text-xs font-bold text-white hover:bg-red-700"
                        >
                            Terapkan Filter
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* MODAL 5: FILTER STATUS PENUKARAN POIN                                     */}
            {/* ========================================================================= */}
            <Dialog
                open={exchangeFilterModalOpen}
                onOpenChange={setExchangeFilterModalOpen}
            >
                <DialogContent className="rounded-3xl p-6 sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            <Filter className="size-4 text-red-600" />
                            Filter Status Penukaran Poin
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-2 py-2 text-xs">
                        {[
                            { id: 'all', label: 'Semua Status' },
                            {
                                id: 'hold',
                                label: 'HOLD (Menunggu Persetujuan)',
                            },
                            { id: 'claimed', label: 'Claimed (Disetujui)' },
                            {
                                id: 'rejected',
                                label: 'Rejected (Ditolak / Dikembalikan)',
                            },
                            {
                                id: 'cancelled',
                                label: 'Cancelled (Dibatalkan Member)',
                            },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setTempExchangeStatus(item.id)}
                                className={`flex w-full cursor-pointer items-center justify-between rounded-xl p-3 text-xs font-semibold transition-colors ${
                                    tempExchangeStatus === item.id
                                        ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                                        : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                                }`}
                            >
                                <span>{item.label}</span>
                                {tempExchangeStatus === item.id && (
                                    <Check className="size-4" />
                                )}
                            </button>
                        ))}
                    </div>

                    <DialogFooter className="flex items-center justify-between gap-2 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setTempExchangeStatus('all');
                                setExchangeStatusFilter('all');
                                applyExchangeFilters(exchangeSearch, 'all');
                                setExchangeFilterModalOpen(false);
                            }}
                            className="h-9.5 rounded-xl text-xs text-zinc-500"
                        >
                            Reset Filter
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                setExchangeStatusFilter(tempExchangeStatus);
                                applyExchangeFilters(
                                    exchangeSearch,
                                    tempExchangeStatus,
                                );
                                setExchangeFilterModalOpen(false);
                                toast.success(
                                    'Filter riwayat penukaran berhasil diterapkan.',
                                );
                            }}
                            className="h-9.5 rounded-xl bg-red-600 px-5 text-xs font-bold text-white hover:bg-red-700"
                        >
                            Terapkan Filter
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* MODAL 6: SETUJUI KLAIM PENUKARAN (APPROVE)                                */}
            {/* ========================================================================= */}
            <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
                <DialogContent className="rounded-3xl p-6 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-emerald-600">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60">
                                <CheckCircle2 className="size-4" />
                            </div>
                            Persetujuan Klaim Hadiah
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Konfirmasi penyerahan hadiah kepada member
                            pelanggan. Status tiket akan diubah menjadi CLAIMED.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedExchange && (
                        <div className="space-y-3 text-xs">
                            <div className="space-y-1.5 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                    {selectedExchange.reward_name}
                                </div>
                                <div className="text-[11px] text-zinc-500">
                                    Pemohon:{' '}
                                    <strong>
                                        {selectedExchange.user_name}
                                    </strong>{' '}
                                    (ID: #{selectedExchange.user_id})
                                </div>
                                <div className="font-mono text-[11px] font-bold text-amber-600">
                                    Biaya Poin: {selectedExchange.points_cost}{' '}
                                    PTS
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                    Catatan Persetujuan (Opsional)
                                </label>
                                <Input
                                    value={adminNoteInput}
                                    onChange={(e) =>
                                        setAdminNoteInput(e.target.value)
                                    }
                                    placeholder="Contoh: Telah diserahkan di counter AHASS pusat"
                                    className="h-9.5 rounded-xl text-xs"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setApproveModalOpen(false)}
                            className="h-9.5 cursor-pointer rounded-xl text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleApproveExchange}
                            disabled={isSubmitting}
                            className="h-9.5 cursor-pointer rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white hover:bg-emerald-700"
                        >
                            {isSubmitting ? 'Memproses...' : 'Setujui Klaim'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* MODAL 7: TOLAK KLAIM PENUKARAN (REJECT & REFUND)                          */}
            {/* ========================================================================= */}
            <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
                <DialogContent className="rounded-3xl p-6 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-rose-600">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60">
                                <XCircle className="size-4" />
                            </div>
                            Penolakan Klaim & Refund Poin
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Saldo poin pelanggan dan 1 unit stok reward akan
                            otomatis dikembalikan (refund) secara aman ke akun
                            member.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedExchange && (
                        <div className="space-y-3 text-xs">
                            <div className="space-y-1.5 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                    {selectedExchange.reward_name}
                                </div>
                                <div className="text-[11px] text-zinc-500">
                                    Pemohon:{' '}
                                    <strong>
                                        {selectedExchange.user_name}
                                    </strong>{' '}
                                    (ID: #{selectedExchange.user_id})
                                </div>
                                <div className="font-mono text-[11px] font-bold text-emerald-600">
                                    Poin yang akan dikembalikan: +
                                    {selectedExchange.points_cost} PTS
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                    Alasan Penolakan (Wajib/Direkomendasikan)
                                </label>
                                <Input
                                    value={adminNoteInput}
                                    onChange={(e) =>
                                        setAdminNoteInput(e.target.value)
                                    }
                                    placeholder="Contoh: Stok fisik rusak di gudang / dibatalkan sesuai instruksi"
                                    className="h-9.5 rounded-xl text-xs"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setRejectModalOpen(false)}
                            className="h-9.5 cursor-pointer rounded-xl text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleRejectExchange}
                            disabled={isSubmitting}
                            className="h-9.5 cursor-pointer rounded-xl bg-red-600 px-5 text-xs font-bold text-white hover:bg-red-700"
                        >
                            {isSubmitting
                                ? 'Memproses...'
                                : 'Tolak & Kembalikan Poin'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* MODAL 8: SNAPSHOT DETAIL PENUKARAN POIN                                   */}
            {/* ========================================================================= */}
            <Dialog
                open={detailExchangeModalOpen}
                onOpenChange={setDetailExchangeModalOpen}
            >
                <DialogContent className="rounded-3xl p-6 sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60">
                                <Info className="size-4" />
                            </div>
                            Snapshot Detail Penukaran #{selectedExchange?.id}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Rekaman resmi data transaksi klaim reward program
                            Honda Customer Loyalty Rewards
                        </DialogDescription>
                    </DialogHeader>

                    {selectedExchange && (
                        <div className="space-y-4 py-2 text-xs">
                            {/* Header Status Bar */}
                            <div className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-zinc-50 p-3.5 dark:border-zinc-700 dark:bg-zinc-800/60">
                                <div>
                                    <span className="block font-mono text-[11px] text-zinc-400">
                                        STATUS KLAIM
                                    </span>
                                    <div className="mt-1">
                                        {getStatusBadge(
                                            selectedExchange.status,
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block font-mono text-[11px] text-zinc-400">
                                        BIAYA POIN
                                    </span>
                                    <span className="font-mono text-sm font-black text-amber-600">
                                        {selectedExchange.points_cost} PTS
                                    </span>
                                </div>
                            </div>

                            {/* Detail Reward */}
                            <div className="space-y-2 rounded-2xl border border-zinc-200/80 p-4 dark:border-zinc-700">
                                <span className="font-mono text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                                    Item Reward Yang Ditukar
                                </span>
                                <div className="flex items-center gap-3">
                                    <div className="size-12 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                                        {selectedExchange.reward_image ? (
                                            <img
                                                src={
                                                    selectedExchange.reward_image
                                                }
                                                alt={
                                                    selectedExchange.reward_name
                                                }
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                                <Gift className="size-5" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                            {selectedExchange.reward_name}
                                        </h4>
                                        <span className="font-mono text-[11px] text-zinc-500">
                                            ID Reward: #
                                            {selectedExchange.reward_id}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Data Member Pemohon */}
                            <div className="space-y-2 rounded-2xl border border-zinc-200/80 p-4 dark:border-zinc-700">
                                <span className="font-mono text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                                    Profil Member Pelanggan
                                </span>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <span className="block text-[11px] text-zinc-400">
                                            Nama Lengkap
                                        </span>
                                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                            {selectedExchange.user_name}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[11px] text-zinc-400">
                                            ID Member
                                        </span>
                                        <span className="font-mono font-bold text-red-600">
                                            #{selectedExchange.user_id}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[11px] text-zinc-400">
                                            Alamat Email
                                        </span>
                                        <span className="text-zinc-700 dark:text-zinc-300">
                                            {selectedExchange.user_email}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[11px] text-zinc-400">
                                            Kontak Telepon
                                        </span>
                                        <div className="flex items-center gap-1.5 font-mono text-zinc-700 dark:text-zinc-300">
                                            <span>
                                                {selectedExchange.user_phone}
                                            </span>
                                            {selectedExchange.user_phone &&
                                                selectedExchange.user_phone !==
                                                    '-' && (
                                                    <a
                                                        href={`https://wa.me/${selectedExchange.user_phone.replace(/^0/, '62')}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex size-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600"
                                                        title="Chat via WhatsApp"
                                                    >
                                                        <MessageCircle className="size-3" />
                                                    </a>
                                                )}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="block text-[11px] text-zinc-400">
                                            Alamat Domisili
                                        </span>
                                        <span className="text-zinc-700 dark:text-zinc-300">
                                            {selectedExchange.user_address ||
                                                '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Info Petugas & Waktu */}
                            <div className="space-y-1 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 text-xs dark:border-zinc-700 dark:bg-zinc-800/50">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">
                                        Waktu Pengajuan:
                                    </span>
                                    <span className="font-mono font-semibold">
                                        {selectedExchange.created_at}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">
                                        Petugas Terakhir:
                                    </span>
                                    <span className="font-semibold">
                                        {selectedExchange.admin_name}
                                    </span>
                                </div>
                                {selectedExchange.admin_notes && (
                                    <div className="mt-2 border-t border-zinc-200/60 pt-2 dark:border-zinc-700">
                                        <span className="block text-[11px] text-zinc-500">
                                            Catatan Petugas:
                                        </span>
                                        <p className="mt-0.5 text-zinc-700 italic dark:text-zinc-300">
                                            "{selectedExchange.admin_notes}"
                                        </p>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    onClick={() =>
                                        setDetailExchangeModalOpen(false)
                                    }
                                    className="h-9.5 w-full cursor-pointer rounded-xl bg-zinc-900 text-xs font-bold text-white hover:bg-zinc-800"
                                >
                                    Tutup Detail
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

AdminRewardsPage.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            {
                title: 'Admin Console',
                href: '/admin/dashboard',
            },
            {
                title: 'Manajemen Reward',
                href: '/admin/rewards',
            },
        ]}
    >
        {page}
    </AppLayout>
);
