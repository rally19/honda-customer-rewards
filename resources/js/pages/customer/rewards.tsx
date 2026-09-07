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
    const [activeTab, setActiveTab] = useState<'catalog' | 'my-claims'>(
        'catalog',
    );
    const [pointFilter, setPointFilter] = useState<
        'all' | 'affordable' | 'low' | 'medium' | 'high'
    >('all');
    const [selectedRewardToClaim, setSelectedRewardToClaim] =
        useState<RewardItem | null>(null);
    const [selectedClaimToCancel, setSelectedClaimToCancel] =
        useState<MyClaimItem | null>(null);
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
                    <Badge className="border-amber-300 bg-amber-100 text-[10px] font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                        <Clock className="mr-1 size-3" />
                        HOLD (Menunggu Admin)
                    </Badge>
                );
            case 'claimed':
                return (
                    <Badge className="border-emerald-300 bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                        <CheckCircle2 className="mr-1 size-3" />
                        Disetujui (Claimed)
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="border-rose-300 bg-rose-100 text-[10px] font-bold text-rose-700 dark:border-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                        <XCircle className="mr-1 size-3" />
                        Ditolak (Poin Kembali)
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge className="border-zinc-200 bg-zinc-100 text-[10px] font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                        <RotateCcw className="mr-1 size-3" />
                        Dibatalkan
                    </Badge>
                );
        }
    };

    return (
        <CustomerLayout activeTab="rewards">
            <Head title="Katalog Reward & Penukaran Poin - Honda Loyalty" />

            <div className="mx-auto w-full max-w-4xl space-y-6 pb-10">
                {/* ========================================================================= */}
                {/* 1. HEADER SECTION & IDENTITAS MEMBER                                      */}
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
                            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-md shadow-red-600/20">
                                <Gift className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight text-zinc-900 sm:text-2xl dark:text-white">
                                    Katalog Reward & Hadiah
                                </h1>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Tukarkan saldo poin dengan merchandise
                                    resmi, voucher servis, oli, dan penawaran
                                    eksklusif
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
                {/* 2. CARD SALDO POIN & KETENTUAN LEVEL MEMBER                               */}
                {/* ========================================================================= */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-red-700 to-zinc-950 p-6 text-white shadow-xl shadow-red-950/20 sm:p-7">
                    <div className="pointer-events-none absolute -right-8 -bottom-10 opacity-15 select-none">
                        <img
                            src="/images/logo/honda_logo_white.png"
                            alt="Honda"
                            className="h-auto w-64"
                        />
                    </div>

                    <div className="relative z-10 grid grid-cols-1 items-center gap-6 sm:grid-cols-3">
                        <div className="space-y-1 sm:col-span-2">
                            <span className="text-xs font-semibold tracking-wider text-red-200 uppercase">
                                Saldo Poin Anda Saat Ini
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="font-mono text-3xl font-black text-white drop-shadow-sm sm:text-4xl">
                                    {stats.currentPoints.toLocaleString(
                                        'id-ID',
                                    )}
                                </span>
                                <span className="text-sm font-bold text-red-100">
                                    POIN AKTIF
                                </span>
                            </div>

                            <p className="flex items-center gap-1.5 pt-1 text-[11px] text-red-100/90">
                                <Info className="size-3.5 shrink-0 text-amber-300" />
                                <span>
                                    Level member Anda (
                                    <strong>{stats.tier}</strong>) dihitung dari{' '}
                                    <strong>
                                        {stats.lifetimePoints.toLocaleString(
                                            'id-ID',
                                        )}{' '}
                                        akumulasi poin
                                    </strong>{' '}
                                    dan tidak akan turun saat menukarkan reward.
                                </span>
                            </p>
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-white/15 pt-3 sm:flex-col sm:items-end sm:justify-center sm:border-t-0 sm:pt-0">
                            <div className="text-left sm:text-right">
                                <span className="block text-[10px] font-medium text-red-200 uppercase">
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
                                className="cursor-pointer rounded-xl bg-white text-xs font-bold text-red-600 shadow-sm hover:bg-red-50"
                            >
                                <Clock className="mr-1 size-3.5 text-red-600" />
                                Lihat Klaim Saya
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 3. TAB CONTROLLER & FILTER                                                */}
                {/* ========================================================================= */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={() => setActiveTab('catalog')}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                                activeTab === 'catalog'
                                    ? 'bg-red-600 text-white shadow-xs'
                                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <ShoppingBag className="size-4" />
                            <span>Katalog Pilihan Reward</span>
                            <span className="py-0.2 rounded-full bg-white/20 px-1.5 text-[10px]">
                                {rewards.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('my-claims')}
                            className={`relative flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                                activeTab === 'my-claims'
                                    ? 'bg-red-600 text-white shadow-xs'
                                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <Clock className="size-4" />
                            <span>Klaim Saya</span>
                            <span className="py-0.2 rounded-full bg-white/20 px-1.5 text-[10px]">
                                {myClaims.length}
                            </span>
                            {stats.totalHold > 0 && (
                                <span className="absolute -top-1 -right-1 flex size-3">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex size-3 rounded-full bg-amber-500"></span>
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Quick Filters for Catalog */}
                    {activeTab === 'catalog' && (
                        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                            <span className="mr-1 flex shrink-0 items-center gap-1 text-[11px] font-semibold text-zinc-400">
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
                                    className={`cursor-pointer rounded-xl px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all ${
                                        pointFilter === f.id
                                            ? 'bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900'
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
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredRewards.map((reward) => (
                                    <div
                                        key={reward.id}
                                        className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-xs transition-all hover:border-red-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                                    >
                                        {/* Image Box */}
                                        <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                            {reward.image_url ? (
                                                <img
                                                    src={reward.image_url}
                                                    alt={reward.name}
                                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    onError={(e) => {
                                                        (
                                                            e.target as HTMLElement
                                                        ).style.display =
                                                            'none';
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                                    <Gift className="size-10" />
                                                </div>
                                            )}

                                            {/* Top badges */}
                                            <div className="pointer-events-none absolute inset-x-2.5 top-2.5 flex items-center justify-between">
                                                <Badge
                                                    className={`font-mono text-[10px] font-black shadow-sm ${
                                                        reward.stock > 0
                                                            ? 'bg-zinc-900/90 text-white backdrop-blur-md'
                                                            : 'bg-rose-600 text-white'
                                                    }`}
                                                >
                                                    {reward.stock > 0
                                                        ? `Stok: ${reward.stock}`
                                                        : 'Habis'}
                                                </Badge>

                                                <Badge className="bg-amber-500 font-mono text-xs font-black text-zinc-950 shadow-sm">
                                                    <Coins className="mr-1 size-3" />
                                                    {reward.points_cost} Poin
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Content Box */}
                                        <div className="flex flex-1 flex-col justify-between space-y-4 p-4 sm:p-5">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400">
                                                    <span>#{reward.id}</span>
                                                    <span>
                                                        s/d {reward.end_period}
                                                    </span>
                                                </div>

                                                <h3 className="line-clamp-1 text-sm font-bold text-zinc-900 transition-colors group-hover:text-red-600 dark:text-white">
                                                    {reward.name}
                                                </h3>

                                                <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                                                    {reward.description ||
                                                        'Penawaran reward resmi eksklusif jaringan bengkel dan dealer AHASS.'}
                                                </p>
                                            </div>

                                            {/* Action Button */}
                                            <div className="border-t border-zinc-100 pt-2 dark:border-zinc-800">
                                                {reward.stock <= 0 ? (
                                                    <Button
                                                        type="button"
                                                        disabled
                                                        className="w-full rounded-2xl bg-zinc-100 text-xs font-semibold text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                                                    >
                                                        Stok Habis
                                                    </Button>
                                                ) : !reward.can_afford ? (
                                                    <Button
                                                        type="button"
                                                        disabled
                                                        className="w-full rounded-2xl bg-zinc-100 text-xs font-semibold text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                                                    >
                                                        Kurang{' '}
                                                        {reward.points_cost -
                                                            stats.currentPoints}{' '}
                                                        Poin
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedRewardToClaim(
                                                                reward,
                                                            )
                                                        }
                                                        className="w-full cursor-pointer rounded-2xl bg-red-600 text-xs font-bold text-white shadow-xs group-hover:shadow-red-600/20 hover:bg-red-700"
                                                    >
                                                        <Gift className="mr-1.5 size-3.5" />
                                                        Tukar Reward
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3 rounded-3xl border border-dashed border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
                                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                                    <ShoppingBag className="size-6" />
                                </div>
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                                    Tidak Ada Reward yang Cocok
                                </h3>
                                <p className="mx-auto max-w-sm text-xs text-zinc-500">
                                    Coba ubah filter rentang poin Anda untuk
                                    melihat reward lainnya.
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
                            <div className="divide-y divide-zinc-200/80 overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-xs dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                                {myClaims.map((claim) => (
                                    <div
                                        key={claim.id}
                                        className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-zinc-50/50 sm:flex-row sm:items-center sm:p-5 dark:hover:bg-zinc-800/30"
                                    >
                                        <div className="flex items-start gap-3.5">
                                            <div className="size-14 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
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
                                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                                                        {claim.reward_name}
                                                    </h4>
                                                    {getStatusBadge(
                                                        claim.status,
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleCopy(claim.id)
                                                        }
                                                        className="inline-flex cursor-pointer items-center gap-1 font-mono font-bold text-zinc-700 transition-colors hover:text-red-600 dark:text-zinc-300"
                                                        title="Salin No. Referensi"
                                                    >
                                                        <span>#{claim.id}</span>
                                                        {copiedId ===
                                                        claim.id ? (
                                                            <Check className="size-3 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="size-3 text-zinc-400" />
                                                        )}
                                                    </button>
                                                    <span>&bull;</span>
                                                    <span>
                                                        {claim.date} WIB
                                                    </span>
                                                </div>

                                                {/* Explanation or Admin Notes */}
                                                {claim.status === 'hold' && (
                                                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400">
                                                        Saldo{' '}
                                                        {claim.points_cost} poin
                                                        dan stok sedang di-hold.
                                                        Anda dapat
                                                        membatalkannya untuk
                                                        mengembalikan poin.
                                                    </p>
                                                )}

                                                {claim.status === 'claimed' &&
                                                    claim.admin_notes && (
                                                        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                            Petugas:{' '}
                                                            {claim.admin_notes}
                                                        </p>
                                                    )}

                                                {claim.status ===
                                                    'rejected' && (
                                                    <p className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                                                        Alasan:{' '}
                                                        {claim.admin_notes ||
                                                            'Ditolak oleh admin. Poin Anda telah dipulihkan.'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-2 border-t border-zinc-100 pt-2 sm:flex-col sm:items-end sm:justify-center sm:border-t-0 sm:pt-0 dark:border-zinc-800">
                                            <span className="font-mono text-sm font-bold text-red-600 dark:text-red-400">
                                                -{claim.points_cost} Poin
                                            </span>

                                            {claim.status === 'hold' && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setSelectedClaimToCancel(
                                                            claim,
                                                        )
                                                    }
                                                    className="rounded-xl border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:hover:bg-rose-950/40"
                                                >
                                                    <X className="mr-1 size-3" />
                                                    Batalkan Klaim
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3 rounded-3xl border border-dashed border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
                                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                                    <Clock className="size-6" />
                                </div>
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                                    Belum Ada Riwayat Penukaran
                                </h3>
                                <p className="mx-auto max-w-sm text-xs text-zinc-500">
                                    Anda belum menukarkan poin reward. Jelajahi
                                    katalog dan pilih reward yang Anda inginkan.
                                </p>
                                <Button
                                    type="button"
                                    onClick={() => setActiveTab('catalog')}
                                    className="rounded-xl bg-red-600 text-xs font-semibold text-white hover:bg-red-700"
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
            <Dialog
                open={!!selectedRewardToClaim}
                onOpenChange={(open) =>
                    !open && !isSubmitting && setSelectedRewardToClaim(null)
                }
            >
                <DialogContent className="space-y-4 rounded-3xl border-zinc-200 bg-white p-6 sm:max-w-md dark:border-zinc-800 dark:bg-zinc-900">
                    {selectedRewardToClaim && (
                        <>
                            <DialogHeader className="space-y-1 text-left">
                                <div className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/80">
                                    <Gift className="size-6" />
                                </div>
                                <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white">
                                    Konfirmasi Penukaran Reward
                                </DialogTitle>
                                <DialogDescription className="text-xs text-zinc-500">
                                    Pastikan rincian penukaran poin reward Anda
                                    sudah sesuai.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3 rounded-2xl border border-zinc-200/90 bg-zinc-50 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                                <div className="flex items-center gap-3">
                                    {selectedRewardToClaim.image_url && (
                                        <img
                                            src={
                                                selectedRewardToClaim.image_url
                                            }
                                            alt={selectedRewardToClaim.name}
                                            className="size-12 rounded-xl border border-zinc-200 object-cover dark:border-zinc-700"
                                        />
                                    )}
                                    <div className="space-y-0.5">
                                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                                            {selectedRewardToClaim.name}
                                        </h4>
                                        <span className="font-mono text-[11px] text-zinc-500">
                                            #{selectedRewardToClaim.id}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 border-t border-zinc-200/70 pt-2.5 dark:border-zinc-800">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">
                                            Saldo Poin Anda:
                                        </span>
                                        <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                                            {stats.currentPoints.toLocaleString(
                                                'id-ID',
                                            )}{' '}
                                            Poin
                                        </span>
                                    </div>
                                    <div className="flex justify-between font-bold text-red-600 dark:text-red-400">
                                        <span>Biaya Poin Reward:</span>
                                        <span className="font-mono">
                                            -
                                            {selectedRewardToClaim.points_cost.toLocaleString(
                                                'id-ID',
                                            )}{' '}
                                            Poin
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t border-dashed border-zinc-200 pt-1.5 dark:border-zinc-800">
                                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                            Sisa Saldo Poin:
                                        </span>
                                        <span className="font-mono font-black text-zinc-900 dark:text-white">
                                            {(
                                                stats.currentPoints -
                                                selectedRewardToClaim.points_cost
                                            ).toLocaleString('id-ID')}{' '}
                                            Poin
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                                <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                                <span>
                                    Status klaim akan di-<strong>HOLD</strong>.
                                    Poin dipotong dan stok di-hold sementara
                                    menunggu konfirmasi admin. Anda dapat
                                    membatalkannya kapan saja jika berubah
                                    pikiran.
                                </span>
                            </div>

                            <DialogFooter className="flex gap-2 sm:gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isSubmitting}
                                    onClick={() =>
                                        setSelectedRewardToClaim(null)
                                    }
                                    className="flex-1 rounded-xl text-xs font-semibold"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={handleConfirmClaim}
                                    className="flex-1 rounded-xl bg-red-600 text-xs font-bold text-white hover:bg-red-700"
                                >
                                    {isSubmitting
                                        ? 'Memproses...'
                                        : 'Ya, Tukar Sekarang'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* MODAL KONFIRMASI BATALKAN KLAIM                                           */}
            {/* ========================================================================= */}
            <Dialog
                open={!!selectedClaimToCancel}
                onOpenChange={(open) =>
                    !open && !isSubmitting && setSelectedClaimToCancel(null)
                }
            >
                <DialogContent className="space-y-4 rounded-3xl border-zinc-200 bg-white p-6 sm:max-w-md dark:border-zinc-800 dark:bg-zinc-900">
                    {selectedClaimToCancel && (
                        <>
                            <DialogHeader className="space-y-1 text-left">
                                <div className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/80">
                                    <RotateCcw className="size-6" />
                                </div>
                                <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white">
                                    Batalkan Klaim Reward?
                                </DialogTitle>
                                <DialogDescription className="text-xs text-zinc-500">
                                    Anda dapat membatalkan penukaran ini sebelum
                                    admin menyetujuinya.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-2 rounded-2xl border border-zinc-200/90 bg-zinc-50 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">
                                        Reward:
                                    </span>
                                    <span className="font-bold text-zinc-900 dark:text-white">
                                        {selectedClaimToCancel.reward_name}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">
                                        Poin Akan Dikembalikan:
                                    </span>
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                        +{selectedClaimToCancel.points_cost}{' '}
                                        Poin
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">
                                        Stok Reward:
                                    </span>
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
                                    onClick={() =>
                                        setSelectedClaimToCancel(null)
                                    }
                                    className="flex-1 rounded-xl text-xs font-semibold"
                                >
                                    Tidak, Kembali
                                </Button>
                                <Button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={handleConfirmCancel}
                                    className="flex-1 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700"
                                >
                                    {isSubmitting
                                        ? 'Membatalkan...'
                                        : 'Ya, Batalkan Klaim'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </CustomerLayout>
    );
}
