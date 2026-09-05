import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Award,
    Calendar,
    Check,
    CheckCircle2,
    ChevronRight,
    Clock,
    Coins,
    Copy,
    Filter,
    Flame,
    Gift,
    HelpCircle,
    Info,
    RotateCcw,
    Shield,
    ShoppingBag,
    Sparkles,
    Tag,
    Wrench,
    X,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
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

type RewardItem = {
    id: string;
    name: string;
    description: string;
    image_url: string;
    points_cost: number;
    stock: number;
    start_period: string;
    end_period: string;
    is_claimable: boolean;
    can_afford: boolean;
};

type MyClaimItem = {
    id: string;
    reward_id: string;
    reward_name: string;
    reward_image: string;
    points_cost: number;
    status: 'hold' | 'claimed' | 'rejected' | 'cancelled';
    admin_name?: string;
    admin_notes?: string;
    date: string;
    raw_date: string;
};

type Stats = {
    currentPoints: number;
    lifetimePoints: number;
    tier: string;
    tierBadge: string;
    totalHold: number;
    totalClaimed: number;
};

type Props = {
    rewards: RewardItem[];
    myClaims: MyClaimItem[];
    stats: Stats;
    memberId: string;
};

export default function CustomerRewardsPage({
    rewards = [],
    myClaims = [],
    stats,
    memberId,
}: Props) {
    const [activeTab, setActiveTab] = useState<'catalog' | 'my-claims'>('catalog');
    const [pointFilter, setPointFilter] = useState<'all' | 'affordable' | 'low' | 'medium' | 'high'>('all');
    const [selectedRewardToClaim, setSelectedRewardToClaim] = useState<RewardItem | null>(null);
    const [selectedClaimToCancel, setSelectedClaimToCancel] = useState<MyClaimItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const formattedMemberId = memberId
        .padStart(10, '0')
        .replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');

    // Filter rewards based on point filter selection
    const filteredRewards = useMemo(() => {
        return rewards.filter((item) => {
            if (pointFilter === 'affordable') {
                return item.can_afford && item.stock > 0;
            }
            if (pointFilter === 'low') {
                return item.points_cost <= 150;
            }
            if (pointFilter === 'medium') {
                return item.points_cost > 150 && item.points_cost <= 300;
            }
            if (pointFilter === 'high') {
                return item.points_cost > 300;
            }
            return true;
        });
    }, [rewards, pointFilter]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(text);
        toast.success(`No. Referensi #${text} disalin`);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleConfirmClaim = () => {
        if (!selectedRewardToClaim) return;
        setIsSubmitting(true);

        router.post(
            `/rewards/${selectedRewardToClaim.id}/claim`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedRewardToClaim(null);
                    setIsSubmitting(false);
                    setActiveTab('my-claims');
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    const errorMsg = Object.values(errors)[0] as string;
                    toast.error(errorMsg || 'Gagal mengajukan klaim reward');
                },
            },
        );
    };

    const handleConfirmCancel = () => {
        if (!selectedClaimToCancel) return;
        setIsSubmitting(true);

        router.post(
            `/rewards/exchanges/${selectedClaimToCancel.id}/cancel`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedClaimToCancel(null);
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    const errorMsg = Object.values(errors)[0] as string;
                    toast.error(errorMsg || 'Gagal membatalkan klaim');
                },
            },
        );
    };

    const getStatusBadge = (status: MyClaimItem['status']) => {
        switch (status) {
            case 'hold':
                return (
                    <Badge className="bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 text-[10px] font-bold">
                        <Clock className="size-3 mr-1" />
                        HOLD (Menunggu Admin)
                    </Badge>
                );
            case 'claimed':
                return (
                    <Badge className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 text-[10px] font-bold">
                        <CheckCircle2 className="size-3 mr-1" />
                        Disetujui (Claimed)
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 text-[10px] font-bold">
                        <XCircle className="size-3 mr-1" />
                        Ditolak (Poin Kembali)
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 text-[10px] font-semibold">
                        <RotateCcw className="size-3 mr-1" />
                        Dibatalkan
                    </Badge>
                );
        }
    };

    return (
        <CustomerLayout activeTab="rewards">
            <Head title="Katalog Reward & Penukaran Poin - Honda Loyalty" />

            <div className="space-y-6 max-w-4xl mx-auto w-full pb-10">
                {/* ========================================================================= */}
                {/* 1. HEADER SECTION & IDENTITAS MEMBER                                      */}
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
                            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-md shadow-red-600/20">
                                <Gift className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                                    Katalog Reward & Hadiah
                                </h1>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Tukarkan saldo poin dengan merchandise resmi, voucher servis, oli, dan penawaran eksklusif
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
                {/* 2. CARD SALDO POIN & KETENTUAN LEVEL MEMBER                               */}
                {/* ========================================================================= */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-red-700 to-zinc-950 p-6 sm:p-7 text-white shadow-xl shadow-red-950/20">
                    <div className="pointer-events-none absolute -right-8 -bottom-10 opacity-15 select-none">
                        <img
                            src="/images/logo/honda_logo_white.png"
                            alt="Honda"
                            className="w-64 h-auto"
                        />
                    </div>

                    <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                        <div className="space-y-1 sm:col-span-2">
                            <span className="text-xs font-semibold text-red-200 uppercase tracking-wider">
                                Saldo Poin Anda Saat Ini
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="font-mono text-3xl sm:text-4xl font-black text-white drop-shadow-sm">
                                    {stats.currentPoints.toLocaleString('id-ID')}
                                </span>
                                <span className="text-sm font-bold text-red-100">POIN AKTIF</span>
                            </div>

                            <p className="text-[11px] text-red-100/90 pt-1 flex items-center gap-1.5">
                                <Info className="size-3.5 shrink-0 text-amber-300" />
                                <span>
                                    Level member Anda (<strong>{stats.tier}</strong>) dihitung dari{' '}
                                    <strong>{stats.lifetimePoints.toLocaleString('id-ID')} akumulasi poin</strong> dan tidak akan turun saat menukarkan reward.
                                </span>
                            </p>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/15">
                            <div className="text-left sm:text-right">
                                <span className="text-[10px] text-red-200 block uppercase font-medium">
                                    Status Klaim Berjalan
                                </span>
                                <span className="font-mono text-base font-bold text-white">
                                    {stats.totalHold} Menunggu Hold
                                </span>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => setActiveTab('my-claims')}
                                className="rounded-xl bg-white text-red-600 hover:bg-red-50 font-bold text-xs shadow-sm cursor-pointer"
                            >
                                <Clock className="size-3.5 mr-1 text-red-600" />
                                Lihat Klaim Saya
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 3. TAB CONTROLLER & FILTER                                                */}
                {/* ========================================================================= */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('catalog')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                activeTab === 'catalog'
                                    ? 'bg-red-600 text-white shadow-xs'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <ShoppingBag className="size-4" />
                            <span>Katalog Pilihan Reward</span>
                            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                                {rewards.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('my-claims')}
                            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                activeTab === 'my-claims'
                                    ? 'bg-red-600 text-white shadow-xs'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <Clock className="size-4" />
                            <span>Klaim Saya</span>
                            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                                {myClaims.length}
                            </span>
                            {stats.totalHold > 0 && (
                                <span className="absolute -top-1 -right-1 flex size-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full size-3 bg-amber-500"></span>
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Quick Filters for Catalog */}
                    {activeTab === 'catalog' && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                            <span className="text-[11px] font-semibold text-zinc-400 mr-1 shrink-0 flex items-center gap-1">
                                <Filter className="size-3" /> Filter Poin:
                            </span>
                            {[
                                { id: 'all', label: 'Semua Reward' },
                                { id: 'affordable', label: 'Dapat Saya Tukar' },
                                { id: 'low', label: '≤ 150 Poin' },
                                { id: 'medium', label: '151 - 300 Poin' },
                                { id: 'high', label: '> 300 Poin' },
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => setPointFilter(f.id as any)}
                                    className={`rounded-xl px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                        pointFilter === f.id
                                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ========================================================================= */}
                {/* 4. TAB CONTENT: KATALOG REWARD                                            */}
                {/* ========================================================================= */}
                {activeTab === 'catalog' && (
                    <div className="space-y-4">
                        {filteredRewards.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredRewards.map((reward) => (
                                    <div
                                        key={reward.id}
                                        className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:shadow-md hover:border-red-200 dark:hover:border-zinc-700"
                                    >
                                        {/* Image Box */}
                                        <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                            {reward.image_url ? (
                                                <img
                                                    src={reward.image_url}
                                                    alt={reward.name}
                                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    onError={(e) => {
                                                        (e.target as HTMLElement).style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                                    <Gift className="size-10" />
                                                </div>
                                            )}

                                            {/* Top badges */}
                                            <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                                                <Badge
                                                    className={`text-[10px] font-mono font-black shadow-sm ${
                                                        reward.stock > 0
                                                            ? 'bg-zinc-900/90 text-white backdrop-blur-md'
                                                            : 'bg-rose-600 text-white'
                                                    }`}
                                                >
                                                    {reward.stock > 0 ? `Stok: ${reward.stock}` : 'Habis'}
                                                </Badge>

                                                <Badge className="bg-amber-500 text-zinc-950 font-mono font-black text-xs shadow-sm">
                                                    <Coins className="size-3 mr-1" />
                                                    {reward.points_cost} Poin
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Content Box */}
                                        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                                                    <span>#{reward.id}</span>
                                                    <span>s/d {reward.end_period}</span>
                                                </div>

                                                <h3 className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1 group-hover:text-red-600 transition-colors">
                                                    {reward.name}
                                                </h3>

                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                                                    {reward.description || 'Penawaran reward resmi eksklusif jaringan bengkel dan dealer AHASS.'}
                                                </p>
                                            </div>

                                            {/* Action Button */}
                                            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                                {reward.stock <= 0 ? (
                                                    <Button
                                                        type="button"
                                                        disabled
                                                        className="w-full rounded-2xl text-xs font-semibold bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                                                    >
                                                        Stok Habis
                                                    </Button>
                                                ) : !reward.can_afford ? (
                                                    <Button
                                                        type="button"
                                                        disabled
                                                        className="w-full rounded-2xl text-xs font-semibold bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                                                    >
                                                        Kurang {reward.points_cost - stats.currentPoints} Poin
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        onClick={() => setSelectedRewardToClaim(reward)}
                                                        className="w-full rounded-2xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs cursor-pointer group-hover:shadow-red-600/20"
                                                    >
                                                        <Gift className="size-3.5 mr-1.5" />
                                                        Tukar Reward
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
                                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                                    <ShoppingBag className="size-6" />
                                </div>
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                                    Tidak Ada Reward yang Cocok
                                </h3>
                                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                                    Coba ubah filter rentang poin Anda untuk melihat reward lainnya.
                                </p>
                                <Button
                                    type="button"
                                    onClick={() => setPointFilter('all')}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl text-xs"
                                >
                                    Reset Filter
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 5. TAB CONTENT: KLAIM SAYA (STATUS PENUKARAN)                              */}
                {/* ========================================================================= */}
                {activeTab === 'my-claims' && (
                    <div className="space-y-3">
                        {myClaims.length > 0 ? (
                            <div className="divide-y divide-zinc-200/80 rounded-3xl border border-zinc-200/90 bg-white shadow-xs dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
                                {myClaims.map((claim) => (
                                    <div
                                        key={claim.id}
                                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                                    >
                                        <div className="flex items-start gap-3.5">
                                            <div className="size-14 shrink-0 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                                {claim.reward_image ? (
                                                    <img
                                                        src={claim.reward_image}
                                                        alt={claim.reward_name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                                        <Gift className="size-6" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                                                        {claim.reward_name}
                                                    </h4>
                                                    {getStatusBadge(claim.status)}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(claim.id)}
                                                        className="inline-flex items-center gap-1 font-mono font-bold text-zinc-700 dark:text-zinc-300 hover:text-red-600 transition-colors cursor-pointer"
                                                        title="Salin No. Referensi"
                                                    >
                                                        <span>#{claim.id}</span>
                                                        {copiedId === claim.id ? (
                                                            <Check className="size-3 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="size-3 text-zinc-400" />
                                                        )}
                                                    </button>
                                                    <span>&bull;</span>
                                                    <span>{claim.date} WIB</span>
                                                </div>

                                                {/* Explanation or Admin Notes */}
                                                {claim.status === 'hold' && (
                                                    <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50">
                                                        Saldo {claim.points_cost} poin dan stok sedang di-hold. Anda dapat membatalkannya untuk mengembalikan poin.
                                                    </p>
                                                )}

                                                {claim.status === 'claimed' && claim.admin_notes && (
                                                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                                                        Petugas: {claim.admin_notes}
                                                    </p>
                                                )}

                                                {claim.status === 'rejected' && (
                                                    <p className="text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/50">
                                                        Alasan: {claim.admin_notes || 'Ditolak oleh admin. Poin Anda telah dipulihkan.'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                                            <span className="font-mono text-sm font-bold text-red-600 dark:text-red-400">
                                                -{claim.points_cost} Poin
                                            </span>

                                            {claim.status === 'hold' && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSelectedClaimToCancel(claim)}
                                                    className="rounded-xl text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:hover:bg-rose-950/40"
                                                >
                                                    <X className="size-3 mr-1" />
                                                    Batalkan Klaim
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
                                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                                    <Clock className="size-6" />
                                </div>
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                                    Belum Ada Riwayat Penukaran
                                </h3>
                                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                                    Anda belum menukarkan poin reward. Jelajahi katalog dan pilih reward yang Anda inginkan.
                                </p>
                                <Button
                                    type="button"
                                    onClick={() => setActiveTab('catalog')}
                                    className="rounded-xl text-xs bg-red-600 hover:bg-red-700 text-white font-semibold"
                                >
                                    Buka Katalog Reward
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* MODAL KONFIRMASI KLAIM REWARD                                             */}
            {/* ========================================================================= */}
            <Dialog open={!!selectedRewardToClaim} onOpenChange={(open) => !open && !isSubmitting && setSelectedRewardToClaim(null)}>
                <DialogContent className="sm:max-w-md rounded-3xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
                    {selectedRewardToClaim && (
                        <>
                            <DialogHeader className="text-left space-y-1">
                                <div className="flex size-11 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 mb-1">
                                    <Gift className="size-6" />
                                </div>
                                <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white">
                                    Konfirmasi Penukaran Reward
                                </DialogTitle>
                                <DialogDescription className="text-xs text-zinc-500">
                                    Pastikan rincian penukaran poin reward Anda sudah sesuai.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 space-y-3 text-xs">
                                <div className="flex items-center gap-3">
                                    {selectedRewardToClaim.image_url && (
                                        <img
                                            src={selectedRewardToClaim.image_url}
                                            alt={selectedRewardToClaim.name}
                                            className="size-12 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700"
                                        />
                                    )}
                                    <div className="space-y-0.5">
                                        <h4 className="font-bold text-zinc-900 dark:text-white text-xs">
                                            {selectedRewardToClaim.name}
                                        </h4>
                                        <span className="font-mono text-[11px] text-zinc-500">
                                            #{selectedRewardToClaim.id}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 border-t border-zinc-200/70 dark:border-zinc-800 pt-2.5">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Saldo Poin Anda:</span>
                                        <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                                            {stats.currentPoints.toLocaleString('id-ID')} Poin
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-red-600 dark:text-red-400 font-bold">
                                        <span>Biaya Poin Reward:</span>
                                        <span className="font-mono">
                                            -{selectedRewardToClaim.points_cost.toLocaleString('id-ID')} Poin
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-1.5">
                                        <span className="text-zinc-700 dark:text-zinc-300 font-semibold">Sisa Saldo Poin:</span>
                                        <span className="font-mono font-black text-zinc-900 dark:text-white">
                                            {(stats.currentPoints - selectedRewardToClaim.points_cost).toLocaleString('id-ID')} Poin
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-3 text-[11px] text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 flex gap-2">
                                <AlertCircle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                                <span>
                                    Status klaim akan di-<strong>HOLD</strong>. Poin dipotong dan stok di-hold sementara menunggu konfirmasi admin. Anda dapat membatalkannya kapan saja jika berubah pikiran.
                                </span>
                            </div>

                            <DialogFooter className="flex gap-2 sm:gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isSubmitting}
                                    onClick={() => setSelectedRewardToClaim(null)}
                                    className="flex-1 rounded-xl text-xs font-semibold"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={handleConfirmClaim}
                                    className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                                >
                                    {isSubmitting ? 'Memproses...' : 'Ya, Tukar Sekarang'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* MODAL KONFIRMASI BATALKAN KLAIM                                           */}
            {/* ========================================================================= */}
            <Dialog open={!!selectedClaimToCancel} onOpenChange={(open) => !open && !isSubmitting && setSelectedClaimToCancel(null)}>
                <DialogContent className="sm:max-w-md rounded-3xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
                    {selectedClaimToCancel && (
                        <>
                            <DialogHeader className="text-left space-y-1">
                                <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 mb-1">
                                    <RotateCcw className="size-6" />
                                </div>
                                <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white">
                                    Batalkan Klaim Reward?
                                </DialogTitle>
                                <DialogDescription className="text-xs text-zinc-500">
                                    Anda dapat membatalkan penukaran ini sebelum admin menyetujuinya.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Reward:</span>
                                    <span className="font-bold text-zinc-900 dark:text-white">
                                        {selectedClaimToCancel.reward_name}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Poin Akan Dikembalikan:</span>
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                        +{selectedClaimToCancel.points_cost} Poin
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Stok Reward:</span>
                                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                        Dipulihkan (+1 unit)
                                    </span>
                                </div>
                            </div>

                            <DialogFooter className="flex gap-2 sm:gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isSubmitting}
                                    onClick={() => setSelectedClaimToCancel(null)}
                                    className="flex-1 rounded-xl text-xs font-semibold"
                                >
                                    Tidak, Kembali
                                </Button>
                                <Button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={handleConfirmCancel}
                                    className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                                >
                                    {isSubmitting ? 'Membatalkan...' : 'Ya, Batalkan Klaim'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </CustomerLayout>
    );
}
