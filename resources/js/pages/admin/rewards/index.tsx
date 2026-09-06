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
    const [currentTab, setCurrentTab] = useState<'rewards' | 'exchanges'>('rewards');

    // Reward Filters & State
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [tempStatus, setTempStatus] = useState(filters.status || 'all');

    // Exchange Filters & State
    const [exchangeSearch, setExchangeSearch] = useState(filters.exchange_search || '');
    const [exchangeStatusFilter, setExchangeStatusFilter] = useState(filters.exchange_status || 'all');
    const [exchangeFilterModalOpen, setExchangeFilterModalOpen] = useState(false);
    const [tempExchangeStatus, setTempExchangeStatus] = useState(filters.exchange_status || 'all');

    // Modals
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [detailExchangeModalOpen, setDetailExchangeModalOpen] = useState(false);

    // Selected items
    const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
    const [selectedExchange, setSelectedExchange] = useState<PointExchangeItem | null>(null);

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
                search: newSearch !== undefined ? newSearch.trim() || undefined : search.trim() || undefined,
                status: newStatus !== undefined ? (newStatus !== 'all' ? newStatus : undefined) : (statusFilter !== 'all' ? statusFilter : undefined),
                exchange_search: exchangeSearch.trim() || undefined,
                exchange_status: exchangeStatusFilter !== 'all' ? exchangeStatusFilter : undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleResetRewardFilters = () => {
        setSearch('');
        setStatusFilter('all');
        router.get(
            '/admin/rewards',
            {
                exchange_search: exchangeSearch.trim() || undefined,
                exchange_status: exchangeStatusFilter !== 'all' ? exchangeStatusFilter : undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Exchange search & filter handlers
    const applyExchangeFilters = (newSearch?: string, newStatus?: string) => {
        router.get(
            '/admin/rewards',
            {
                search: search.trim() || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                exchange_search: newSearch !== undefined ? newSearch.trim() || undefined : exchangeSearch.trim() || undefined,
                exchange_status: newStatus !== undefined ? (newStatus !== 'all' ? newStatus : undefined) : (exchangeStatusFilter !== 'all' ? exchangeStatusFilter : undefined),
            },
            { preserveState: true, preserveScroll: true }
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
            { preserveState: true, preserveScroll: true }
        );
    };

    // CSV Exports
    const handleExportRewardsCsv = () => {
        const headers = ['ID Reward', 'Nama Reward', 'Deskripsi', 'Biaya Poin', 'Stok', 'Mulai Periode', 'Akhir Periode', 'Status Aktif', 'Total Ditukar', 'Tanggal Dibuat'];
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

        const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `katalog-reward-honda-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        navigator.clipboard.writeText(csvContent);
        toast.success('Data katalog reward berhasil diekspor ke file CSV & disalin ke clipboard!');
    };

    const handleExportExchangesCsv = () => {
        const headers = ['ID Penukaran', 'Nama Reward', 'Biaya Poin', 'ID Member', 'Nama Member', 'Email', 'No Telepon', 'Alamat', 'Status', 'Petugas', 'Catatan Admin', 'Tanggal Transaksi'];
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

        const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `log-penukaran-poin-honda-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        navigator.clipboard.writeText(csvContent);
        toast.success('Data riwayat penukaran poin berhasil diekspor ke file CSV & disalin ke clipboard!');
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
        if (formData.start_period) payload.append('start_period', formData.start_period);
        if (formData.end_period) payload.append('end_period', formData.end_period);
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
        if (formData.start_period) payload.append('start_period', formData.start_period);
        if (formData.end_period) payload.append('end_period', formData.end_period);
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
                toast.success(`Reward '${selectedReward.name}' berhasil dihapus.`);
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
            { admin_notes: adminNoteInput.trim() || 'Disetujui oleh admin AHASS.' },
            {
                onSuccess: () => {
                    setApproveModalOpen(false);
                    setIsSubmitting(false);
                    setAdminNoteInput('');
                    toast.success(`Klaim #${selectedExchange.id} berhasil disetujui!`);
                },
                onError: (errs) => {
                    setIsSubmitting(false);
                    const msg = Object.values(errs)[0] as string;
                    toast.error(msg || 'Gagal menyetujui klaim');
                },
            }
        );
    };

    const handleRejectExchange = () => {
        if (!selectedExchange) return;
        setIsSubmitting(true);

        router.post(
            `/admin/rewards/exchanges/${selectedExchange.id}/reject`,
            { admin_notes: adminNoteInput.trim() || 'Ditolak oleh admin AHASS. Poin telah dikembalikan.' },
            {
                onSuccess: () => {
                    setRejectModalOpen(false);
                    setIsSubmitting(false);
                    setAdminNoteInput('');
                    toast.success(`Klaim #${selectedExchange.id} ditolak. Saldo & stok dikembalikan.`);
                },
                onError: (errs) => {
                    setIsSubmitting(false);
                    const msg = Object.values(errs)[0] as string;
                    toast.error(msg || 'Gagal menolak klaim');
                },
            }
        );
    };

    const getStatusBadge = (status: PointExchangeItem['status']) => {
        switch (status) {
            case 'hold':
                return (
                    <Badge className="bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 text-[10px] font-bold">
                        <Clock className="size-3 mr-1" />
                        HOLD (Menunggu)
                    </Badge>
                );
            case 'claimed':
                return (
                    <Badge className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 text-[10px] font-bold">
                        <CheckCircle2 className="size-3 mr-1" />
                        Claimed (Disetujui)
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 text-[10px] font-bold">
                        <XCircle className="size-3 mr-1" />
                        Rejected (Ditolak)
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 text-[10px] font-semibold">
                        <RotateCcw className="size-3 mr-1" />
                        Cancelled (Batal)
                    </Badge>
                );
        }
    };

    return (
        <>
            <Head title="Manajemen Hadiah & Penukaran Poin - Honda Loyalty Admin" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header Banner */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 bg-gradient-to-r from-red-600 via-red-700 to-zinc-950 text-white p-6 md:p-8 rounded-3xl shadow-xl shadow-red-950/20 relative overflow-hidden">
                    <div className="absolute right-0 -bottom-11 opacity-15 pointer-events-none select-none">
                        <img src="/images/logo/honda_logo_white.png" alt="Honda" className="w-84 md:w-96 h-auto" />
                    </div>

                    <div className="relative z-10 space-y-2 max-w-2xl">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-xs">
                                <Gift className="size-3.5" />
                                Modul Hadiah & Penukaran AHASS
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white">
                            Manajemen Hadiah & Penukaran Poin
                        </h1>
                        <p className="text-xs md:text-sm text-red-100/90 leading-relaxed">
                            Kelola katalog merchandise resmi, voucher servis, oli, serta monitor dan persetujuan klaim penukaran poin member pelanggan Honda.
                        </p>
                    </div>

                    <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
                        <Link
                            href="/admin/dashboard"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
                        >
                            <ArrowLeft className="size-4" />
                            Kembali ke Dashboard
                        </Link>
                        <Button
                            onClick={openCreateModal}
                            className="bg-white text-red-700 hover:bg-red-50 text-xs md:text-sm font-bold gap-2 h-10 px-4 rounded-xl shadow-md cursor-pointer"
                        >
                            <Plus className="size-4 text-red-600" />
                            Tambah Reward Baru
                        </Button>
                    </div>
                </div>

                {/* KPI Metrics Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Stat 1: Total Rewards */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-2xl shadow-xs">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                Total Katalog
                            </span>
                            <div className="size-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
                                <Gift className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.totalRewards.toLocaleString('id-ID')}
                            </div>
                            <span className="text-xs text-zinc-500 mt-1 block">Item reward terdaftar</span>
                        </div>
                    </div>

                    {/* Stat 2: Active Rewards */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-2xl shadow-xs">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                Reward Aktif
                            </span>
                            <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.activeRewards.toLocaleString('id-ID')}
                            </div>
                            <span className="text-xs text-emerald-600 font-semibold mt-1 block">
                                {stats.activeRewards} item siap ditukarkan
                            </span>
                        </div>
                    </div>

                    {/* Stat 3: Hold Exchanges */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-2xl shadow-xs">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                Menunggu (HOLD)
                            </span>
                            <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                                <Clock className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.holdExchanges.toLocaleString('id-ID')}
                            </div>
                            <span className="text-xs text-amber-600 font-semibold mt-1 block">
                                Menunggu persetujuan admin
                            </span>
                        </div>
                    </div>

                    {/* Stat 4: Points Exchanged */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-2xl shadow-xs">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                Poin Ditukarkan
                            </span>
                            <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                                <Coins className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.totalPointsExchanged.toLocaleString('id-ID')}
                            </div>
                            <span className="text-xs text-purple-600 font-semibold mt-1 block">
                                Akumulasi poin disalurkan
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Content Container with Tabs */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs overflow-hidden">
                    {/* Tab Navigation Bar */}
                    <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6 pt-3.5 gap-2 bg-zinc-50/50 dark:bg-zinc-950/30 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setCurrentTab('rewards')}
                            className={`pb-3.5 px-3 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${currentTab === 'rewards'
                                ? 'border-red-600 text-red-600 dark:text-red-400'
                                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                                }`}
                        >
                            <Gift className="size-4" />
                            <span>Katalog Hadiah & Reward</span>
                            <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${currentTab === 'rewards'
                                    ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300'
                                    : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                    }`}
                            >
                                {rewards.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setCurrentTab('exchanges')}
                            className={`pb-3.5 px-3 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${currentTab === 'exchanges'
                                ? 'border-red-600 text-red-600 dark:text-red-400'
                                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                                }`}
                        >
                            <History className="size-4" />
                            <span>Log Riwayat Penukaran Poin</span>
                            <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${currentTab === 'exchanges'
                                    ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300'
                                    : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                    }`}
                            >
                                {exchanges.total}
                            </span>
                            {stats.holdExchanges > 0 && (
                                <span className="relative flex size-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full size-2 bg-amber-500"></span>
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
                            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                {/* Search */}
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                                    <Input
                                        type="text"
                                        placeholder="Cari nama, ID reward, deskripsi..."
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            applyRewardFilters(e.target.value, statusFilter);
                                        }}
                                        className="pl-9 h-9.5 text-xs rounded-xl focus-visible:ring-red-500"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearch('');
                                                applyRewardFilters('', statusFilter);
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
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
                                        className={`text-xs h-9.5 gap-2 rounded-xl transition-all cursor-pointer ${statusFilter !== 'all'
                                            ? 'border-red-300 dark:border-red-900 bg-red-50/70 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold'
                                            : 'text-zinc-700 dark:text-zinc-300'
                                            }`}
                                    >
                                        <Filter className="size-3.5 text-red-600" />
                                        <span>Filter</span>
                                        {statusFilter !== 'all' && (
                                            <span className="size-5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center">
                                                1
                                            </span>
                                        )}
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleExportRewardsCsv}
                                        className="text-xs h-9.5 gap-1.5 rounded-xl cursor-pointer"
                                    >
                                        <Download className="size-3.5" />
                                        Ekspor CSV
                                    </Button>
                                </div>
                            </div>

                            {/* Active Filter Chips */}
                            {(search || statusFilter !== 'all') && (
                                <div className="px-6 py-2.5 bg-zinc-50/70 dark:bg-zinc-950/40 border-b border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center gap-2 text-xs">
                                    <span className="text-zinc-400 text-[11px] font-medium">Filter Aktif:</span>

                                    {search && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-[11px]">
                                            Pencarian: "{search}"
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearch('');
                                                    applyRewardFilters('', statusFilter);
                                                }}
                                                className="hover:text-zinc-900 cursor-pointer"
                                                title="Hapus filter pencarian"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </span>
                                    )}

                                    {statusFilter !== 'all' && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                                            Status: {statusFilter === 'active' ? 'Aktif' : 'Nonaktif'}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setStatusFilter('all');
                                                    applyRewardFilters(search, 'all');
                                                }}
                                                className="hover:text-emerald-900 cursor-pointer"
                                                title="Hapus filter status"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </span>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleResetRewardFilters}
                                        className="text-[11px] text-zinc-500 hover:text-red-600 underline ml-1 cursor-pointer"
                                    >
                                        Reset Semua
                                    </button>
                                </div>
                            )}

                            {/* Desktop Table View */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-zinc-50 dark:bg-zinc-950/60 text-zinc-500 font-bold border-b border-zinc-200 dark:border-zinc-800">
                                        <tr>
                                            <th className="py-3.5 px-4">ID & Foto Reward</th>
                                            <th className="py-3.5 px-4">Nama & Deskripsi Reward</th>
                                            <th className="py-3.5 px-4">Biaya Poin</th>
                                            <th className="py-3.5 px-4">Stok Fisik</th>
                                            <th className="py-3.5 px-4">Periode Berlaku</th>
                                            <th className="py-3.5 px-4">Status Katalog</th>
                                            <th className="py-3.5 px-4">Klaim Sukses</th>
                                            <th className="py-3.5 px-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                        {rewards.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="py-12 text-center text-zinc-400">
                                                    Tidak ada data reward yang sesuai dengan filter pencarian.
                                                </td>
                                            </tr>
                                        ) : (
                                            rewards.map((reward) => (
                                                <tr
                                                    key={reward.id}
                                                    className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                                                >
                                                    {/* ID & Foto */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-11 shrink-0 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                                                {reward.image_url ? (
                                                                    <img
                                                                        src={reward.image_url}
                                                                        alt={reward.name}
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
                                                                    onClick={() => handleCopy(reward.id, `ID Reward ${reward.id}`)}
                                                                    className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
                                                                    title="Salin ID Reward"
                                                                >
                                                                    {copiedId === reward.id ? (
                                                                        <Check className="size-3 text-emerald-500" />
                                                                    ) : (
                                                                        <Copy className="size-3" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Nama & Deskripsi */}
                                                    <td className="py-3.5 px-4 max-w-xs">
                                                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                                            {reward.name}
                                                        </div>
                                                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                                                            {reward.description || '-'}
                                                        </div>
                                                    </td>

                                                    {/* Biaya Poin */}
                                                    <td className="py-3.5 px-4">
                                                        <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-xs inline-flex items-center gap-1">
                                                            <Coins className="size-3.5" />
                                                            {reward.points_cost} PTS
                                                        </span>
                                                    </td>

                                                    {/* Stok */}
                                                    <td className="py-3.5 px-4">
                                                        <span
                                                            className={`font-mono font-bold text-xs ${reward.stock <= 5
                                                                ? 'text-red-600 dark:text-red-400'
                                                                : 'text-zinc-900 dark:text-zinc-100'
                                                                }`}
                                                        >
                                                            {reward.stock} unit
                                                        </span>
                                                    </td>

                                                    {/* Periode */}
                                                    <td className="py-3.5 px-4 text-[11px] text-zinc-600 dark:text-zinc-400">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="size-3 text-zinc-400 shrink-0" />
                                                            <span>
                                                                {reward.start_period_formatted} s/d {reward.end_period_formatted}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="py-3.5 px-4">
                                                        {reward.is_active ? (
                                                            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                                                                <CheckCircle2 className="size-3 mr-1" />
                                                                Aktif
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-[10px] font-semibold text-zinc-500">
                                                                Nonaktif
                                                            </Badge>
                                                        )}
                                                    </td>

                                                    {/* Klaim Sukses */}
                                                    <td className="py-3.5 px-4 font-mono font-semibold text-zinc-600 dark:text-zinc-400">
                                                        {reward.exchanges_count}x
                                                    </td>

                                                    {/* Aksi */}
                                                    <td className="py-3.5 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => openEditModal(reward)}
                                                                className="h-8 px-2 text-xs text-zinc-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer"
                                                                title="Edit Reward"
                                                            >
                                                                <Pencil className="size-3.5 mr-1" />
                                                                Edit
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    setSelectedReward(reward);
                                                                    setDeleteModalOpen(true);
                                                                }}
                                                                className="h-8 px-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer"
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
                            <div className="block sm:hidden divide-y divide-zinc-100 dark:divide-zinc-800/80">
                                {rewards.length === 0 ? (
                                    <div className="py-12 text-center text-xs text-zinc-400">
                                        Tidak ada data reward yang sesuai dengan pencarian.
                                    </div>
                                ) : (
                                    rewards.map((reward) => (
                                        <div key={reward.id} className="p-4 space-y-3">
                                            <div className="flex items-start gap-3">
                                                <div className="size-14 shrink-0 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                                    {reward.image_url ? (
                                                        <img
                                                            src={reward.image_url}
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
                                                        <span className="font-mono font-bold text-xs text-red-600 dark:text-red-400">
                                                            #{reward.id}
                                                        </span>
                                                        {reward.is_active ? (
                                                            <Badge className="bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                                                                Aktif
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-[10px]">
                                                                Nonaktif
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-0.5">
                                                        {reward.name}
                                                    </h3>
                                                    <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                                                        {reward.description || '-'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                                                <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                                                    {reward.points_cost} PTS
                                                </span>
                                                <span className="text-zinc-500 font-mono text-[11px]">
                                                    Stok: <strong>{reward.stock}</strong> &bull; Ditukar: <strong>{reward.exchanges_count}x</strong>
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-end gap-2 pt-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openEditModal(reward)}
                                                    className="h-8 px-3 text-xs rounded-xl"
                                                >
                                                    <Pencil className="size-3 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedReward(reward);
                                                        setDeleteModalOpen(true);
                                                    }}
                                                    className="h-8 px-2 text-xs text-red-600 rounded-xl"
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
                            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                {/* Search */}
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                                    <Input
                                        type="text"
                                        placeholder="Cari ID tiket, nama member, email, HP, reward..."
                                        value={exchangeSearch}
                                        onChange={(e) => {
                                            setExchangeSearch(e.target.value);
                                            applyExchangeFilters(e.target.value, exchangeStatusFilter);
                                        }}
                                        className="pl-9 h-9.5 text-xs rounded-xl focus-visible:ring-red-500"
                                    />
                                    {exchangeSearch && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setExchangeSearch('');
                                                applyExchangeFilters('', exchangeStatusFilter);
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
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
                                            setTempExchangeStatus(exchangeStatusFilter);
                                            setExchangeFilterModalOpen(true);
                                        }}
                                        className={`text-xs h-9.5 gap-2 rounded-xl transition-all cursor-pointer ${exchangeStatusFilter !== 'all'
                                            ? 'border-red-300 dark:border-red-900 bg-red-50/70 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold'
                                            : 'text-zinc-700 dark:text-zinc-300'
                                            }`}
                                    >
                                        <Filter className="size-3.5 text-red-600" />
                                        <span>Filter Status</span>
                                        {exchangeStatusFilter !== 'all' && (
                                            <span className="size-5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center">
                                                1
                                            </span>
                                        )}
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleExportExchangesCsv}
                                        className="text-xs h-9.5 gap-1.5 rounded-xl cursor-pointer"
                                    >
                                        <Download className="size-3.5" />
                                        Ekspor CSV
                                    </Button>
                                </div>
                            </div>

                            {/* Active Filter Chips */}
                            {(exchangeSearch || exchangeStatusFilter !== 'all') && (
                                <div className="px-6 py-2.5 bg-zinc-50/70 dark:bg-zinc-950/40 border-b border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center gap-2 text-xs">
                                    <span className="text-zinc-400 text-[11px] font-medium">Filter Aktif:</span>

                                    {exchangeSearch && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-[11px]">
                                            Pencarian: "{exchangeSearch}"
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setExchangeSearch('');
                                                    applyExchangeFilters('', exchangeStatusFilter);
                                                }}
                                                className="hover:text-zinc-900 cursor-pointer"
                                                title="Hapus filter pencarian"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </span>
                                    )}

                                    {exchangeStatusFilter !== 'all' && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-semibold text-[11px]">
                                            Status: {exchangeStatusFilter.toUpperCase()}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setExchangeStatusFilter('all');
                                                    applyExchangeFilters(exchangeSearch, 'all');
                                                }}
                                                className="hover:text-red-900 cursor-pointer"
                                                title="Hapus filter status"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </span>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleResetExchangeFilters}
                                        className="text-[11px] text-zinc-500 hover:text-red-600 underline ml-1 cursor-pointer"
                                    >
                                        Reset Semua
                                    </button>
                                </div>
                            )}

                            {/* Desktop Table */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-zinc-50 dark:bg-zinc-950/60 text-zinc-500 font-bold border-b border-zinc-200 dark:border-zinc-800">
                                        <tr>
                                            <th className="py-3.5 px-4">ID & Waktu Klaim</th>
                                            <th className="py-3.5 px-4">Item Hadiah Ditukar</th>
                                            <th className="py-3.5 px-4">Member Pelanggan</th>
                                            <th className="py-3.5 px-4">Biaya Poin</th>
                                            <th className="py-3.5 px-4">Status Klaim</th>
                                            <th className="py-3.5 px-4">Petugas & Catatan</th>
                                            <th className="py-3.5 px-4 text-right">Aksi Verifikasi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                        {exchanges.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="py-12 text-center text-zinc-400">
                                                    Tidak ada rekaman log penukaran poin yang sesuai dengan filter.
                                                </td>
                                            </tr>
                                        ) : (
                                            exchanges.data.map((ex) => (
                                                <tr
                                                    key={ex.id}
                                                    className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                                                >
                                                    {/* ID & Waktu */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-mono font-bold text-red-600 dark:text-red-400">
                                                                #{ex.id}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopy(ex.id, `ID Klaim #${ex.id}`)}
                                                                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
                                                                title="Salin ID Klaim"
                                                            >
                                                                {copiedId === ex.id ? (
                                                                    <Check className="size-3 text-emerald-500" />
                                                                ) : (
                                                                    <Copy className="size-3" />
                                                                )}
                                                            </button>
                                                        </div>
                                                        <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                                                            <Clock className="size-3" />
                                                            <span>{ex.created_at}</span>
                                                        </div>
                                                    </td>

                                                    {/* Item Hadiah */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="size-9 shrink-0 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                                                {ex.reward_image ? (
                                                                    <img
                                                                        src={ex.reward_image}
                                                                        alt={ex.reward_name}
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
                                                                    {ex.reward_name}
                                                                </div>
                                                                <span className="font-mono text-[10px] text-zinc-400">
                                                                    ID Reward: #{ex.reward_id}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Member Pelanggan */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                                            {ex.user_name}
                                                        </div>
                                                        <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                                                            <Phone className="size-3 text-zinc-400" />
                                                            <span className="font-mono">{ex.user_phone}</span>
                                                        </div>
                                                    </td>

                                                    {/* Biaya Poin */}
                                                    <td className="py-3.5 px-4">
                                                        <span className="font-mono font-black text-xs text-amber-600 dark:text-amber-400">
                                                            {ex.points_cost} PTS
                                                        </span>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="py-3.5 px-4">{getStatusBadge(ex.status)}</td>

                                                    {/* Petugas & Catatan */}
                                                    <td className="py-3.5 px-4 max-w-xs">
                                                        <div className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                                                            {ex.admin_name}
                                                        </div>
                                                        <p className="text-[11px] text-zinc-500 truncate" title={ex.admin_notes}>
                                                            {ex.admin_notes || '-'}
                                                        </p>
                                                    </td>

                                                    {/* Aksi */}
                                                    <td className="py-3.5 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    setSelectedExchange(ex);
                                                                    setDetailExchangeModalOpen(true);
                                                                }}
                                                                className="h-8 px-2 text-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
                                                                title="Lihat Detail Snapshot"
                                                            >
                                                                <Eye className="size-3.5 mr-1" />
                                                                Detail
                                                            </Button>

                                                            {ex.status === 'hold' && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => {
                                                                            setSelectedExchange(ex);
                                                                            setAdminNoteInput('');
                                                                            setApproveModalOpen(true);
                                                                        }}
                                                                        className="h-8 px-2 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg cursor-pointer font-bold"
                                                                        title="Setujui Klaim"
                                                                    >
                                                                        <CheckCircle2 className="size-3.5 mr-1" />
                                                                        Setujui
                                                                    </Button>

                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => {
                                                                            setSelectedExchange(ex);
                                                                            setAdminNoteInput('');
                                                                            setRejectModalOpen(true);
                                                                        }}
                                                                        className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer font-bold"
                                                                        title="Tolak Klaim & Refund Poin"
                                                                    >
                                                                        <XCircle className="size-3.5 mr-1" />
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
                            <div className="block sm:hidden divide-y divide-zinc-100 dark:divide-zinc-800/80">
                                {exchanges.data.length === 0 ? (
                                    <div className="py-12 text-center text-xs text-zinc-400">
                                        Tidak ada data log penukaran poin.
                                    </div>
                                ) : (
                                    exchanges.data.map((ex) => (
                                        <div key={ex.id} className="p-4 space-y-2.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                                                        #{ex.id}
                                                    </span>
                                                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-0.5">
                                                        {ex.reward_name}
                                                    </h3>
                                                    <div className="text-[11px] text-zinc-500 font-mono">
                                                        Member: {ex.user_name} ({ex.user_phone})
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    {getStatusBadge(ex.status)}
                                                    <div className="font-mono font-black text-amber-600 text-xs mt-1">
                                                        {ex.points_cost} PTS
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                                                <span className="text-[11px] text-zinc-400">{ex.created_at}</span>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedExchange(ex);
                                                            setDetailExchangeModalOpen(true);
                                                        }}
                                                        className="h-7 px-2 text-[11px] rounded-lg"
                                                    >
                                                        Detail
                                                    </Button>
                                                    {ex.status === 'hold' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedExchange(ex);
                                                                    setAdminNoteInput('');
                                                                    setApproveModalOpen(true);
                                                                }}
                                                                className="h-7 px-2 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                                                            >
                                                                Setujui
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setSelectedExchange(ex);
                                                                    setAdminNoteInput('');
                                                                    setRejectModalOpen(true);
                                                                }}
                                                                className="h-7 px-2 text-[11px] text-rose-600 border-rose-200 rounded-lg font-bold"
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
                                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                                    <span className="text-zinc-500">
                                        Menampilkan halaman <strong>{exchanges.current_page}</strong> dari{' '}
                                        <strong>{exchanges.last_page}</strong> ({exchanges.total} total penukaran)
                                    </span>

                                    <div className="flex items-center gap-1">
                                        {exchanges.links.map((link, i) => (
                                            <Link
                                                key={i}
                                                href={link.url || '#'}
                                                preserveScroll
                                                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${link.active
                                                    ? 'bg-red-600 text-white font-bold'
                                                    : link.url
                                                        ? 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                                                        : 'text-zinc-300 dark:text-zinc-600 pointer-events-none'
                                                    }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
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
                <DialogContent className="sm:max-w-lg rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                            <div className="size-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
                                <Gift className="size-4" />
                            </div>
                            Tambah Reward Baru
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Daftarkan merchandise resmi, voucher servis, atau oli Honda baru ke katalog rewards.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateReward} className="space-y-4 py-2 text-xs">
                        {/* ID */}
                        <div>
                            <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                ID Reward (10 Digit Acak)
                            </label>
                            <Input
                                value={formData.id}
                                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                maxLength={10}
                                required
                                className="font-mono text-xs h-9.5 rounded-xl"
                            />
                        </div>

                        {/* Nama */}
                        <div>
                            <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                Nama Reward / Merchandise
                            </label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Contoh: Oli Mesin AHM Oil SPX 2 800ml"
                                required
                                className="text-xs h-9.5 rounded-xl"
                            />
                        </div>

                        {/* Deskripsi */}
                        <div>
                            <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                Deskripsi Reward
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Jelaskan spesifikasi, ketentuan penukaran, atau lokasi AHASS..."
                                rows={3}
                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-xs focus:ring-2 focus:ring-red-500 outline-none"
                            />
                        </div>

                        {/* Biaya Poin & Stok */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                    Biaya Poin (Cost)
                                </label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={formData.points_cost}
                                    onChange={(e) => setFormData({ ...formData, points_cost: parseInt(e.target.value) || 0 })}
                                    required
                                    className="font-mono text-xs h-9.5 rounded-xl"
                                />
                            </div>

                            <div>
                                <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                    Stok Fisik Tersedia
                                </label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={formData.stock}
                                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                    required
                                    className="font-mono text-xs h-9.5 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Periode Klaim */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                    Mulai Periode (Opsional)
                                </label>
                                <Input
                                    type="date"
                                    value={formData.start_period}
                                    onChange={(e) => setFormData({ ...formData, start_period: e.target.value })}
                                    className="text-xs h-9.5 rounded-xl"
                                />
                            </div>

                            <div>
                                <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                    Akhir Periode (Opsional)
                                </label>
                                <Input
                                    type="date"
                                    value={formData.end_period}
                                    onChange={(e) => setFormData({ ...formData, end_period: e.target.value })}
                                    className="text-xs h-9.5 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Upload Gambar / URL */}
                        <div className="space-y-2">
                            <label className="font-bold block text-zinc-800 dark:text-zinc-200">
                                Foto / Gambar Reward
                            </label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                className="text-xs h-9.5 rounded-xl cursor-pointer"
                            />
                            <div className="text-[11px] text-zinc-400">Atau masukkan URL gambar langsung:</div>
                            <Input
                                type="text"
                                value={formData.image_url}
                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                placeholder="/images/pictures/spx2.png atau https://..."
                                className="text-xs h-9.5 rounded-xl font-mono"
                            />
                        </div>

                        {/* Status Aktif */}
                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="create_reward_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="rounded border-zinc-300 text-red-600 focus:ring-red-500 size-4 cursor-pointer"
                            />
                            <label htmlFor="create_reward_active" className="text-zinc-700 dark:text-zinc-300 text-xs cursor-pointer select-none">
                                Reward langsung berstatus <strong>Aktif</strong> (siap ditukarkan pelanggan)
                            </label>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateModalOpen(false)}
                                className="text-xs h-9.5 rounded-xl cursor-pointer"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9.5 px-5 rounded-xl cursor-pointer"
                            >
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Reward'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* MODAL 2: EDIT REWARD                                                      */}
            {/* ========================================================================= */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="sm:max-w-lg rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                            <div className="size-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                                <Pencil className="size-4" />
                            </div>
                            Edit Data Reward #{selectedReward?.id}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Perbarui nama, biaya poin, kuota stok, periode, atau foto reward.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditReward} className="space-y-4 py-2 text-xs">
                        <div>
                            <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                Nama Reward
                            </label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="text-xs h-9.5 rounded-xl"
                            />
                        </div>

                        <div>
                            <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                Deskripsi Reward
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-xs focus:ring-2 focus:ring-red-500 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                    Biaya Poin (Cost)
                                </label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={formData.points_cost}
                                    onChange={(e) => setFormData({ ...formData, points_cost: parseInt(e.target.value) || 0 })}
                                    required
                                    className="font-mono text-xs h-9.5 rounded-xl"
                                />
                            </div>

                            <div>
                                <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                    Stok Fisik Tersedia
                                </label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={formData.stock}
                                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                    required
                                    className="font-mono text-xs h-9.5 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                    Mulai Periode
                                </label>
                                <Input
                                    type="date"
                                    value={formData.start_period}
                                    onChange={(e) => setFormData({ ...formData, start_period: e.target.value })}
                                    className="text-xs h-9.5 rounded-xl"
                                />
                            </div>

                            <div>
                                <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                    Akhir Periode
                                </label>
                                <Input
                                    type="date"
                                    value={formData.end_period}
                                    onChange={(e) => setFormData({ ...formData, end_period: e.target.value })}
                                    className="text-xs h-9.5 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="font-bold block text-zinc-800 dark:text-zinc-200">
                                Ganti Foto / Gambar
                            </label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                className="text-xs h-9.5 rounded-xl cursor-pointer"
                            />
                            <Input
                                type="text"
                                value={formData.image_url}
                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                placeholder="Atau URL gambar..."
                                className="text-xs h-9.5 rounded-xl font-mono"
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="edit_reward_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="rounded border-zinc-300 text-red-600 focus:ring-red-500 size-4 cursor-pointer"
                            />
                            <label htmlFor="edit_reward_active" className="text-zinc-700 dark:text-zinc-300 text-xs cursor-pointer select-none">
                                Status <strong>Aktif</strong> (tampil di katalog)
                            </label>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditModalOpen(false)}
                                className="text-xs h-9.5 rounded-xl cursor-pointer"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9.5 px-5 rounded-xl cursor-pointer"
                            >
                                {isSubmitting ? 'Memperbarui...' : 'Simpan Perubahan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* MODAL 3: HAPUS REWARD                                                     */}
            {/* ========================================================================= */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2 text-rose-600">
                            <div className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                                <Trash2 className="size-4" />
                            </div>
                            Konfirmasi Hapus Reward
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Tindakan ini tidak dapat dibatalkan. Reward yang dihapus tidak lagi dapat dilihat atau ditukarkan oleh pelanggan.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedReward && (
                        <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200/80 dark:border-zinc-700 space-y-2 text-xs">
                            <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                                {selectedReward.name}
                            </div>
                            <div className="font-mono text-zinc-500 text-[11px]">
                                ID: #{selectedReward.id} &bull; Biaya: {selectedReward.points_cost} PTS &bull; Stok: {selectedReward.stock}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleteModalOpen(false)}
                            className="text-xs h-9.5 rounded-xl cursor-pointer"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleDeleteReward}
                            disabled={isSubmitting}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9.5 px-5 rounded-xl cursor-pointer"
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
                <DialogContent className="sm:max-w-sm rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                            <Filter className="size-4 text-red-600" />
                            Filter Status Katalog Reward
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-2 py-2 text-xs">
                        {[
                            { id: 'all', label: 'Semua Status (Aktif & Nonaktif)' },
                            { id: 'active', label: 'Hanya Reward Aktif' },
                            { id: 'inactive', label: 'Hanya Reward Nonaktif' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setTempStatus(item.id)}
                                className={`flex w-full items-center justify-between rounded-xl p-3 text-xs font-semibold transition-colors cursor-pointer ${tempStatus === item.id
                                    ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                    }`}
                            >
                                <span>{item.label}</span>
                                {tempStatus === item.id && <Check className="size-4" />}
                            </button>
                        ))}
                    </div>

                    <DialogFooter className="pt-2 flex items-center justify-between gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setTempStatus('all');
                                setStatusFilter('all');
                                applyRewardFilters(search, 'all');
                                setFilterModalOpen(false);
                            }}
                            className="text-xs h-9.5 rounded-xl text-zinc-500"
                        >
                            Reset Filter
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                setStatusFilter(tempStatus);
                                applyRewardFilters(search, tempStatus);
                                setFilterModalOpen(false);
                                toast.success('Filter katalog berhasil diterapkan.');
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9.5 px-5 rounded-xl"
                        >
                            Terapkan Filter
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* MODAL 5: FILTER STATUS PENUKARAN POIN                                     */}
            {/* ========================================================================= */}
            <Dialog open={exchangeFilterModalOpen} onOpenChange={setExchangeFilterModalOpen}>
                <DialogContent className="sm:max-w-sm rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                            <Filter className="size-4 text-red-600" />
                            Filter Status Penukaran Poin
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-2 py-2 text-xs">
                        {[
                            { id: 'all', label: 'Semua Status' },
                            { id: 'hold', label: 'HOLD (Menunggu Persetujuan)' },
                            { id: 'claimed', label: 'Claimed (Disetujui)' },
                            { id: 'rejected', label: 'Rejected (Ditolak / Dikembalikan)' },
                            { id: 'cancelled', label: 'Cancelled (Dibatalkan Member)' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setTempExchangeStatus(item.id)}
                                className={`flex w-full items-center justify-between rounded-xl p-3 text-xs font-semibold transition-colors cursor-pointer ${tempExchangeStatus === item.id
                                    ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                    }`}
                            >
                                <span>{item.label}</span>
                                {tempExchangeStatus === item.id && <Check className="size-4" />}
                            </button>
                        ))}
                    </div>

                    <DialogFooter className="pt-2 flex items-center justify-between gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setTempExchangeStatus('all');
                                setExchangeStatusFilter('all');
                                applyExchangeFilters(exchangeSearch, 'all');
                                setExchangeFilterModalOpen(false);
                            }}
                            className="text-xs h-9.5 rounded-xl text-zinc-500"
                        >
                            Reset Filter
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                setExchangeStatusFilter(tempExchangeStatus);
                                applyExchangeFilters(exchangeSearch, tempExchangeStatus);
                                setExchangeFilterModalOpen(false);
                                toast.success('Filter riwayat penukaran berhasil diterapkan.');
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9.5 px-5 rounded-xl"
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
                <DialogContent className="sm:max-w-md rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2 text-emerald-600">
                            <div className="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 className="size-4" />
                            </div>
                            Persetujuan Klaim Hadiah
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Konfirmasi penyerahan hadiah kepada member pelanggan. Status tiket akan diubah menjadi CLAIMED.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedExchange && (
                        <div className="space-y-3 text-xs">
                            <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200/80 dark:border-zinc-700 space-y-1.5">
                                <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                                    {selectedExchange.reward_name}
                                </div>
                                <div className="text-zinc-500 text-[11px]">
                                    Pemohon: <strong>{selectedExchange.user_name}</strong> (ID: #{selectedExchange.user_id})
                                </div>
                                <div className="font-mono text-amber-600 font-bold text-[11px]">
                                    Biaya Poin: {selectedExchange.points_cost} PTS
                                </div>
                            </div>

                            <div>
                                <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                    Catatan Persetujuan (Opsional)
                                </label>
                                <Input
                                    value={adminNoteInput}
                                    onChange={(e) => setAdminNoteInput(e.target.value)}
                                    placeholder="Contoh: Telah diserahkan di counter AHASS pusat"
                                    className="text-xs h-9.5 rounded-xl"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setApproveModalOpen(false)}
                            className="text-xs h-9.5 rounded-xl cursor-pointer"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleApproveExchange}
                            disabled={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9.5 px-5 rounded-xl cursor-pointer"
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
                <DialogContent className="sm:max-w-md rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2 text-rose-600">
                            <div className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                                <XCircle className="size-4" />
                            </div>
                            Penolakan Klaim & Refund Poin
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Saldo poin pelanggan dan 1 unit stok reward akan otomatis dikembalikan (refund) secara aman ke akun member.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedExchange && (
                        <div className="space-y-3 text-xs">
                            <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200/80 dark:border-zinc-700 space-y-1.5">
                                <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                                    {selectedExchange.reward_name}
                                </div>
                                <div className="text-zinc-500 text-[11px]">
                                    Pemohon: <strong>{selectedExchange.user_name}</strong> (ID: #{selectedExchange.user_id})
                                </div>
                                <div className="font-mono text-emerald-600 font-bold text-[11px]">
                                    Poin yang akan dikembalikan: +{selectedExchange.points_cost} PTS
                                </div>
                            </div>

                            <div>
                                <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                    Alasan Penolakan (Wajib/Direkomendasikan)
                                </label>
                                <Input
                                    value={adminNoteInput}
                                    onChange={(e) => setAdminNoteInput(e.target.value)}
                                    placeholder="Contoh: Stok fisik rusak di gudang / dibatalkan sesuai instruksi"
                                    className="text-xs h-9.5 rounded-xl"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setRejectModalOpen(false)}
                            className="text-xs h-9.5 rounded-xl cursor-pointer"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleRejectExchange}
                            disabled={isSubmitting}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9.5 px-5 rounded-xl cursor-pointer"
                        >
                            {isSubmitting ? 'Memproses...' : 'Tolak & Kembalikan Poin'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* MODAL 8: SNAPSHOT DETAIL PENUKARAN POIN                                   */}
            {/* ========================================================================= */}
            <Dialog open={detailExchangeModalOpen} onOpenChange={setDetailExchangeModalOpen}>
                <DialogContent className="sm:max-w-lg rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                            <div className="size-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
                                <Info className="size-4" />
                            </div>
                            Snapshot Detail Penukaran #{selectedExchange?.id}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Rekaman resmi data transaksi klaim reward program Honda Customer Loyalty Rewards
                        </DialogDescription>
                    </DialogHeader>

                    {selectedExchange && (
                        <div className="space-y-4 py-2 text-xs">
                            {/* Header Status Bar */}
                            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700">
                                <div>
                                    <span className="text-[11px] text-zinc-400 block font-mono">STATUS KLAIM</span>
                                    <div className="mt-1">{getStatusBadge(selectedExchange.status)}</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[11px] text-zinc-400 block font-mono">BIAYA POIN</span>
                                    <span className="font-mono font-black text-sm text-amber-600">
                                        {selectedExchange.points_cost} PTS
                                    </span>
                                </div>
                            </div>

                            {/* Detail Reward */}
                            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-700 p-4 space-y-2">
                                <span className="font-mono text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                                    Item Reward Yang Ditukar
                                </span>
                                <div className="flex items-center gap-3">
                                    <div className="size-12 shrink-0 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                        {selectedExchange.reward_image ? (
                                            <img
                                                src={selectedExchange.reward_image}
                                                alt={selectedExchange.reward_name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                                <Gift className="size-5" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                                            {selectedExchange.reward_name}
                                        </h4>
                                        <span className="font-mono text-[11px] text-zinc-500">
                                            ID Reward: #{selectedExchange.reward_id}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Data Member Pemohon */}
                            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-700 p-4 space-y-2">
                                <span className="font-mono text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                                    Profil Member Pelanggan
                                </span>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <span className="text-[11px] text-zinc-400 block">Nama Lengkap</span>
                                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                            {selectedExchange.user_name}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-zinc-400 block">ID Member</span>
                                        <span className="font-mono font-bold text-red-600">
                                            #{selectedExchange.user_id}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-zinc-400 block">Alamat Email</span>
                                        <span className="text-zinc-700 dark:text-zinc-300">
                                            {selectedExchange.user_email}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-zinc-400 block">Kontak Telepon</span>
                                        <div className="flex items-center gap-1.5 font-mono text-zinc-700 dark:text-zinc-300">
                                            <span>{selectedExchange.user_phone}</span>
                                            {selectedExchange.user_phone && selectedExchange.user_phone !== '-' && (
                                                <a
                                                    href={`https://wa.me/${selectedExchange.user_phone.replace(/^0/, '62')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="size-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center"
                                                    title="Chat via WhatsApp"
                                                >
                                                    <MessageCircle className="size-3" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-[11px] text-zinc-400 block">Alamat Domisili</span>
                                        <span className="text-zinc-700 dark:text-zinc-300">
                                            {selectedExchange.user_address || '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Info Petugas & Waktu */}
                            <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200/80 dark:border-zinc-700 space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Waktu Pengajuan:</span>
                                    <span className="font-mono font-semibold">{selectedExchange.created_at}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Petugas Terakhir:</span>
                                    <span className="font-semibold">{selectedExchange.admin_name}</span>
                                </div>
                                {selectedExchange.admin_notes && (
                                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700 mt-2">
                                        <span className="text-zinc-500 block text-[11px]">Catatan Petugas:</span>
                                        <p className="italic text-zinc-700 dark:text-zinc-300 mt-0.5">
                                            "{selectedExchange.admin_notes}"
                                        </p>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    onClick={() => setDetailExchangeModalOpen(false)}
                                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs h-9.5 rounded-xl cursor-pointer"
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
