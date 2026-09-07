import { Head, Link, router } from '@inertiajs/react';
import {
    Activity as ActivityIcon,
    AlertCircle,
    ArrowRight,
    Award,
    Calculator,
    Check,
    CheckCircle2,
    Clock,
    Coins,
    Copy,
    Crown,
    Database,
    Download,
    Eye,
    FileText,
    Gift,
    History,
    Info,
    Layers,
    LayoutDashboard,
    Lock,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    Plus,
    QrCode,
    RefreshCw,
    RotateCcw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    UserCheck,
    Users,
    X,
    XCircle,
    Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
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
import AppLayout from '@/layouts/app-layout';

type Member = {
    id: string;
    name: string;
    email: string;
    phone_number: string;
    address: string;
    role: 'user' | 'admin' | string;
    points: number;
    lifetime_points: number;
    tier: string;
    is_verified: boolean;
    joined_at: string;
};

type ClaimItem = {
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
    status: 'hold' | 'claimed' | 'rejected' | 'cancelled' | string;
    admin_name: string;
    admin_notes?: string;
    time_ago: string;
    created_at: string;
};

type ScanItem = {
    id: string;
    activity_id: string;
    activity_name: string;
    points: number;
    user_id: string;
    user_name: string;
    admin_name: string;
    time_ago: string;
    created_at: string;
};

type RewardItem = {
    id: string;
    name: string;
    description: string;
    points_cost: number;
    stock: number;
    claimed_count: number;
    is_active: boolean;
    image_url: string;
    created_at: string;
};

type ActivityStat = {
    name: string;
    count: number;
    total_points: number;
};

type Props = {
    stats: {
        totalMembers: number;
        totalAdmins: number;
        verifiedRate: number;
        newMembersThisWeek: number;
        totalPointsCirculating: number;
        totalLifetimePoints: number;
        totalPointsRedeemed: number;
        totalActivitiesCount: number;
        totalScansAwarded: number;
        todayScansAwarded: number;
        todayPointsAwarded: number;
        activeRewardsCount: number;
        totalExchangesCount: number;
        pendingHoldClaims: number;
        completedClaims: number;
    };
    recentMembers: Member[];
    recentClaims: ClaimItem[];
    recentScans: ScanItem[];
    rewards: RewardItem[];
    topActivities: ActivityStat[];
};

export default function AdminDashboard({
    stats,
    recentMembers = [],
    recentClaims = [],
    recentScans = [],
    rewards = [],
    topActivities = [],
}: Props) {
    const [activeTab, setActiveTab] = useState<
        'overview' | 'members' | 'claims' | 'scans' | 'rewards' | 'policy'
    >('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>(
        'all',
    );
    const [verificationFilter, setVerificationFilter] = useState<
        'all' | 'verified' | 'unverified'
    >('all');
    const [claimsFilter, setClaimsFilter] = useState<
        'all' | 'hold' | 'claimed' | 'rejected'
    >('all');

    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [inspectedClaim, setInspectedClaim] = useState<ClaimItem | null>(
        null,
    );
    const [processingClaimId, setProcessingClaimId] = useState<string | null>(
        null,
    );

    // Filter members based on search and dropdown filters
    const filteredMembers = useMemo(() => {
        return recentMembers.filter((m) => {
            const matchesQuery =
                !searchQuery.trim() ||
                m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.phone_number
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                m.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.id.includes(searchQuery);

            const matchesRole = roleFilter === 'all' || m.role === roleFilter;
            const matchesVerification =
                verificationFilter === 'all' ||
                (verificationFilter === 'verified' && m.is_verified) ||
                (verificationFilter === 'unverified' && !m.is_verified);

            return matchesQuery && matchesRole && matchesVerification;
        });
    }, [recentMembers, searchQuery, roleFilter, verificationFilter]);

    // Filter claims based on status
    const filteredClaims = useMemo(() => {
        if (claimsFilter === 'all') return recentClaims;
        return recentClaims.filter((c) => c.status === claimsFilter);
    }, [recentClaims, claimsFilter]);

    // Handle Approve Claim via real API
    const handleApproveClaim = (claim: ClaimItem) => {
        if (processingClaimId) return;
        setProcessingClaimId(claim.id);

        router.post(
            `/admin/rewards/exchanges/${claim.id}/approve`,
            { admin_notes: 'Disetujui dari Dashboard Admin.' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        `Klaim reward #${claim.id} untuk ${claim.user_name} berhasil disetujui!`,
                    );
                    setInspectedClaim(null);
                },
                onError: () => {
                    toast.error('Gagal menyetujui klaim.');
                },
                onFinish: () => {
                    setProcessingClaimId(null);
                },
            },
        );
    };

    // Handle Reject Claim via real API
    const handleRejectClaim = (claim: ClaimItem) => {
        if (processingClaimId) return;
        if (
            !confirm(
                `Tolak klaim #${claim.id} untuk ${claim.user_name}? Saldo ${claim.points_cost} poin dan stok reward akan dikembalikan ke member.`,
            )
        ) {
            return;
        }

        setProcessingClaimId(claim.id);

        router.post(
            `/admin/rewards/exchanges/${claim.id}/reject`,
            { admin_notes: 'Ditolak dari Dashboard Admin.' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        `Klaim #${claim.id} telah ditolak. Saldo ${claim.points_cost} poin telah dikembalikan ke member.`,
                    );
                    setInspectedClaim(null);
                },
                onError: () => {
                    toast.error('Gagal menolak klaim.');
                },
                onFinish: () => {
                    setProcessingClaimId(null);
                },
            },
        );
    };

    // Copy to clipboard helper
    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} berhasil disalin ke clipboard.`);
    };

    // Tier badge renderer
    const renderTierBadge = (tier: string) => {
        switch (tier.toLowerCase()) {
            case 'diamond':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-purple-300 bg-purple-500/10 px-2 py-0.5 text-[10px] font-black text-purple-600 dark:border-purple-800 dark:text-purple-400">
                        <Crown className="size-3 text-purple-500" /> Diamond
                    </span>
                );
            case 'platinum':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-black text-cyan-600 dark:border-cyan-800 dark:text-cyan-400">
                        <Sparkles className="size-3 text-cyan-500" /> Platinum
                    </span>
                );
            case 'gold':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-600 dark:border-amber-800 dark:text-amber-400">
                        <Award className="size-3 text-amber-500" /> Gold
                    </span>
                );
            case 'silver':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-200 px-2 py-0.5 text-[10px] font-black text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Shield className="size-3 text-slate-500" /> Silver
                    </span>
                );
            case 'bronze':
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-700/30 bg-amber-900/10 px-2 py-0.5 text-[10px] font-black text-amber-800 dark:text-amber-300">
                        <Shield className="size-3 text-amber-700" /> Bronze
                    </span>
                );
        }
    };

    // Claim status badge renderer
    const renderClaimStatusBadge = (status: string) => {
        switch (status) {
            case 'hold':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:border-amber-700/50 dark:text-amber-400">
                        <Clock className="size-3 text-amber-500" /> Menunggu
                        Hold
                    </span>
                );
            case 'claimed':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-700/50 dark:text-emerald-400">
                        <CheckCircle2 className="size-3 text-emerald-500" />{' '}
                        Selesai / Ditukar
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-500/15 px-2.5 py-0.5 text-[11px] font-bold text-red-700 dark:border-red-700/50 dark:text-red-400">
                        <XCircle className="size-3 text-red-500" /> Ditolak
                        (Poin Refund)
                    </span>
                );
            case 'cancelled':
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-200 px-2.5 py-0.5 text-[11px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                        Dibatalkan
                    </span>
                );
        }
    };

    return (
        <>
            <Head title="Admin Console - Honda Customer Rewards" />

            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-8">
                {/* Top Executive Banner */}
                <div className="relative flex flex-col gap-5 overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-red-700 to-zinc-950 p-6 text-white shadow-xl shadow-red-950/20 md:p-8 lg:flex-row lg:items-center lg:justify-between">
                    {/* Watermark Logo */}
                    <div className="pointer-events-none absolute right-0 -bottom-11 opacity-15 select-none">
                        <img
                            src="/images/logo/honda_logo_white.png"
                            alt="Honda"
                            className="h-auto w-84 md:w-96"
                        />
                    </div>

                    <div className="relative z-10 max-w-2xl space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-bold text-white shadow-xs backdrop-blur-md">
                                <ShieldAlert className="size-3.5 text-white" />
                                Honda Official Loyalty Admin Portal
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-200">
                                <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                                Database & Transaksi Realtime
                            </span>
                        </div>

                        <h1 className="text-2xl leading-tight font-black tracking-tight text-white md:text-3xl lg:text-4xl">
                            Portal Administrasi Loyalty & Verifikasi Poin
                        </h1>
                        <p className="text-xs leading-relaxed text-red-100/90 md:text-sm">
                            Pusat pemantauan aktivitas loyalitas Honda & AHASS,
                            pencatatan transaksi poin, database pelanggan
                            terdaftar, dan pemrosesan klaim reward langsung dari
                            database.
                        </p>
                    </div>

                    <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-2.5">
                        <Link
                            href="/dashboard"
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-xs font-bold text-red-700 shadow-md transition-all hover:bg-red-50 active:scale-95 md:text-sm"
                        >
                            Tampilan Member
                        </Link>
                        <Link
                            href="/admin/scan"
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/30 bg-black/30 px-3.5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-black/50 active:scale-95 md:text-sm"
                        >
                            <QrCode className="size-4 text-amber-300" />
                            Scan Poin
                        </Link>
                        <Link
                            href="/admin/scan-user"
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/30 bg-black/30 px-3.5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-black/50 active:scale-95 md:text-sm"
                        >
                            <UserCheck className="size-4 text-emerald-300" />
                            Scan User
                        </Link>
                    </div>
                </div>

                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Metric 1: Total Member */}
                    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all hover:border-red-500/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-red-500/5 transition-transform group-hover:scale-110" />
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <span className="text-xs font-bold tracking-wider text-zinc-600 uppercase dark:text-zinc-300">
                                Total Member Terdaftar
                            </span>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60">
                                <Users className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.totalMembers.toLocaleString('id-ID')}
                            </div>
                            <div className="mt-1.5 flex items-center gap-2 text-xs">
                                <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                    <TrendingUp className="size-3" />+
                                    {stats.newMembersThisWeek} baru 7 hari
                                </span>
                                <span className="text-zinc-400">&bull;</span>
                                <span className="font-medium text-zinc-500 dark:text-zinc-400">
                                    {stats.verifiedRate}% Terverifikasi
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Metric 2: Poin Loyalitas Beredar */}
                    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all hover:border-red-500/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-amber-500/5 transition-transform group-hover:scale-110" />
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <span className="text-xs font-bold tracking-wider text-zinc-600 uppercase dark:text-zinc-300">
                                Saldo Poin Beredar
                            </span>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60">
                                <Coins className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.totalPointsCirculating.toLocaleString(
                                    'id-ID',
                                )}{' '}
                                <span className="text-xs font-black text-amber-500">
                                    PTS
                                </span>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                <span>
                                    Tertebus:{' '}
                                    <strong>
                                        {stats.totalPointsRedeemed.toLocaleString(
                                            'id-ID',
                                        )}{' '}
                                        pts
                                    </strong>
                                </span>
                                <span className="font-medium text-zinc-400">
                                    Lifetime:{' '}
                                    {stats.totalLifetimePoints.toLocaleString(
                                        'id-ID',
                                    )}{' '}
                                    pts
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Metric 3: Klaim Reward Penukaran */}
                    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all hover:border-red-500/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-purple-500/5 transition-transform group-hover:scale-110" />
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <span className="text-xs font-bold tracking-wider text-zinc-600 uppercase dark:text-zinc-300">
                                Klaim Reward Member
                            </span>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60">
                                <Gift className="size-5 text-purple-600" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="flex items-center gap-2 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                <span>{stats.totalExchangesCount}</span>
                                {stats.pendingHoldClaims > 0 ? (
                                    <span className="animate-pulse rounded-full border border-amber-300 bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-700 dark:border-amber-700/50 dark:text-amber-400">
                                        {stats.pendingHoldClaims} Hold
                                    </span>
                                ) : (
                                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                        Tuntas
                                    </span>
                                )}
                            </div>
                            <div className="mt-1.5 flex items-center justify-between gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                <span>
                                    <strong>{stats.completedClaims}</strong>{' '}
                                    penukaran sukses
                                </span>
                                <span className="font-semibold text-purple-600 dark:text-purple-400">
                                    {stats.activeRewardsCount} reward aktif
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Metric 4: Aktivitas Scan & Poin Masuk */}
                    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all hover:border-red-500/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-blue-500/5 transition-transform group-hover:scale-110" />
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <span className="text-xs font-bold tracking-wider text-zinc-600 uppercase dark:text-zinc-300">
                                Scan & Aktivitas Loyalitas
                            </span>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60">
                                <History className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.totalScansAwarded.toLocaleString(
                                    'id-ID',
                                )}
                            </div>
                            <div className="mt-1.5 flex items-center justify-between gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    +{stats.todayPointsAwarded} pts hari ini
                                </span>
                                <span>
                                    {stats.todayScansAwarded} scan hari ini
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Primary Navigation Tabs */}
                <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 pb-2 md:flex-row md:items-center dark:border-zinc-800">
                    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('overview')}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all md:text-sm ${
                                activeTab === 'overview'
                                    ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <LayoutDashboard className="size-4" />
                            Ringkasan Operasional
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('members')}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all md:text-sm ${
                                activeTab === 'members'
                                    ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <Users className="size-4" />
                            Database Member
                            <span className="rounded-full bg-black/20 px-2 py-0.5 font-mono text-[11px] text-white">
                                {stats.totalMembers}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('claims')}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all md:text-sm ${
                                activeTab === 'claims'
                                    ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <Gift className="size-4" />
                            Klaim Reward
                            {stats.pendingHoldClaims > 0 ? (
                                <span className="animate-pulse rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-black text-white">
                                    {stats.pendingHoldClaims}
                                </span>
                            ) : (
                                <span className="rounded-full bg-black/20 px-2 py-0.5 font-mono text-[11px] text-white">
                                    {stats.totalExchangesCount}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('scans')}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all md:text-sm ${
                                activeTab === 'scans'
                                    ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <History className="size-4" />
                            Riwayat Scan Poin
                            <span className="rounded-full bg-black/20 px-2 py-0.5 font-mono text-[11px] text-white">
                                {stats.totalScansAwarded}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('rewards')}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all md:text-sm ${
                                activeTab === 'rewards'
                                    ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <Award className="size-4" />
                            Katalog Reward
                            <span className="rounded-full bg-black/20 px-2 py-0.5 font-mono text-[11px] text-white">
                                {rewards.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('policy')}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all md:text-sm ${
                                activeTab === 'policy'
                                    ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <Calculator className="size-4" />
                            Kebijakan Poin & Tier
                        </button>
                    </div>

                    {/* Quick Search */}
                    <div className="relative w-full shrink-0 md:w-72">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                            type="text"
                            placeholder="Cari nama, ID member, email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 rounded-xl pl-9 text-xs focus-visible:ring-red-500"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Pending Claims Alert Callout */}
                        {stats.pendingHoldClaims > 0 && (
                            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 sm:flex-row sm:items-center dark:text-amber-200">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                                        <Clock className="size-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold">
                                            {stats.pendingHoldClaims} Klaim
                                            Penukaran Reward Menunggu
                                            Persetujuan
                                        </h4>
                                        <p className="text-xs text-amber-800/90 dark:text-amber-300">
                                            Terdapat member yang menukarkan poin
                                            reward dan menunggu verifikasi
                                            petugas AHASS di database.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => {
                                        setClaimsFilter('hold');
                                        setActiveTab('claims');
                                    }}
                                    className="h-9 shrink-0 cursor-pointer rounded-xl bg-amber-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-amber-700"
                                >
                                    Tinjau Klaim Hold
                                    <ArrowRight className="ml-1.5 size-3.5" />
                                </Button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* Left Col (2 Span): Recent Claims Queue & Top Activities */}
                            <div className="space-y-6 lg:col-span-2">
                                {/* Claims Queue */}
                                <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                                    <div className="mb-5 flex items-center justify-between">
                                        <div>
                                            <h2 className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
                                                <Gift className="size-4 text-red-600" />
                                                Aliran Klaim & Penukaran Reward
                                            </h2>
                                            <p className="text-xs text-zinc-500">
                                                Data realtime penukaran reward
                                                pelanggan dari database
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setActiveTab('claims')
                                            }
                                            className="flex cursor-pointer items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700"
                                        >
                                            Buka Semua (
                                            {stats.totalExchangesCount})
                                            <ArrowRight className="size-3" />
                                        </button>
                                    </div>

                                    {recentClaims.length === 0 ? (
                                        <div className="space-y-2 py-12 text-center text-zinc-400">
                                            <Gift className="mx-auto size-8 text-zinc-300 dark:text-zinc-600" />
                                            <p className="text-xs">
                                                Belum ada riwayat penukaran
                                                reward di database.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {recentClaims
                                                .slice(0, 4)
                                                .map((claim) => (
                                                    <div
                                                        key={claim.id}
                                                        className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 transition-all hover:border-red-300 md:flex-row md:items-center dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-red-900/50"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="size-12 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800">
                                                                {claim.reward_image ? (
                                                                    <img
                                                                        src={
                                                                            claim.reward_image
                                                                        }
                                                                        alt={
                                                                            claim.reward_name
                                                                        }
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                                                        <Gift className="size-5" />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="space-y-1">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="rounded bg-zinc-200/70 px-2 py-0.5 font-mono text-[11px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                                                        #
                                                                        {
                                                                            claim.id
                                                                        }
                                                                    </span>
                                                                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                                        {
                                                                            claim.reward_name
                                                                        }
                                                                    </span>
                                                                </div>

                                                                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                                                                    <span>
                                                                        Member:{' '}
                                                                        <strong className="text-zinc-900 dark:text-zinc-200">
                                                                            {
                                                                                claim.user_name
                                                                            }
                                                                        </strong>
                                                                    </span>
                                                                    <span>
                                                                        &bull;
                                                                    </span>
                                                                    <span className="font-mono text-[11px] text-zinc-400">
                                                                        #
                                                                        {
                                                                            claim.user_id
                                                                        }
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                                                                    <span>
                                                                        {
                                                                            claim.created_at
                                                                        }{' '}
                                                                        (
                                                                        {
                                                                            claim.time_ago
                                                                        }
                                                                        )
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex shrink-0 items-center justify-between gap-2.5 border-t border-zinc-200 pt-2 md:flex-col md:items-end md:border-t-0 md:pt-0 dark:border-zinc-800">
                                                            <div className="flex items-center gap-2">
                                                                <span className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-black text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400">
                                                                    -
                                                                    {
                                                                        claim.points_cost
                                                                    }{' '}
                                                                    PTS
                                                                </span>
                                                                {renderClaimStatusBadge(
                                                                    claim.status,
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-1.5">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        setInspectedClaim(
                                                                            claim,
                                                                        )
                                                                    }
                                                                    className="h-8 rounded-lg border-zinc-300 px-2.5 text-xs dark:border-zinc-700"
                                                                >
                                                                    <Eye className="mr-1 size-3.5" />
                                                                    Detail
                                                                </Button>

                                                                {claim.status ===
                                                                    'hold' && (
                                                                    <>
                                                                        <Button
                                                                            size="sm"
                                                                            disabled={
                                                                                processingClaimId ===
                                                                                claim.id
                                                                            }
                                                                            onClick={() =>
                                                                                handleApproveClaim(
                                                                                    claim,
                                                                                )
                                                                            }
                                                                            className="h-8 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700"
                                                                        >
                                                                            <Check className="mr-1 size-3.5" />
                                                                            Setujui
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            disabled={
                                                                                processingClaimId ===
                                                                                claim.id
                                                                            }
                                                                            onClick={() =>
                                                                                handleRejectClaim(
                                                                                    claim,
                                                                                )
                                                                            }
                                                                            className="h-8 rounded-lg px-2.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                                                        >
                                                                            Tolak
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>

                                {/* Top Activities Aggregated from DB */}
                                <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
                                                <ActivityIcon className="size-4 text-red-600" />
                                                Aktivitas Loyalitas Terbanyak
                                                (Database)
                                            </h3>
                                            <p className="text-xs text-zinc-500">
                                                Frekuensi pemberian poin per
                                                kategori layanan resmi Honda
                                                yang tercatat
                                            </p>
                                        </div>
                                        <Link
                                            href="/admin/activities"
                                            className="text-xs font-bold text-red-600 hover:text-red-700"
                                        >
                                            Kelola Aktivitas
                                        </Link>
                                    </div>

                                    {topActivities.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-zinc-400">
                                            Belum ada pencatatan riwayat
                                            aktivitas loyalitas di sistem.
                                        </div>
                                    ) : (
                                        <div className="space-y-3.5">
                                            {topActivities.map((item, idx) => {
                                                const totalCount =
                                                    stats.totalScansAwarded ||
                                                    1;
                                                const percentage = Math.min(
                                                    100,
                                                    Math.round(
                                                        (item.count /
                                                            totalCount) *
                                                            100,
                                                    ),
                                                );

                                                return (
                                                    <div
                                                        key={idx}
                                                        className="space-y-1.5"
                                                    >
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                                                {item.name}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono font-bold text-amber-600">
                                                                    +
                                                                    {item.total_points.toLocaleString(
                                                                        'id-ID',
                                                                    )}{' '}
                                                                    PTS
                                                                </span>
                                                                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                                                    {item.count}{' '}
                                                                    kali (
                                                                    {percentage}
                                                                    %)
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                                                            <div
                                                                className="h-full rounded-full bg-red-600 transition-all duration-500"
                                                                style={{
                                                                    width: `${percentage}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Col: Recent Members & System Indicators */}
                            <div className="space-y-6">
                                {/* Recent Member registrations */}
                                <div className="flex flex-col rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
                                                <Users className="size-4 text-red-600" />
                                                Pendaftar Member Terbaru
                                            </h3>
                                            <p className="text-xs text-zinc-500">
                                                Data registrasi dari database
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setActiveTab('members')
                                            }
                                            className="cursor-pointer text-xs font-bold text-red-600 hover:text-red-700"
                                        >
                                            Lihat Semua ({stats.totalMembers})
                                        </button>
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        {recentMembers
                                            .slice(0, 5)
                                            .map((member) => (
                                                <div
                                                    key={member.id}
                                                    onClick={() =>
                                                        setSelectedMember(
                                                            member,
                                                        )
                                                    }
                                                    className="group flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-zinc-200/70 bg-zinc-50/50 p-3.5 transition-all hover:border-red-300 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-red-900/60"
                                                >
                                                    <div className="space-y-1 truncate">
                                                        <div className="flex items-center gap-2 truncate">
                                                            <span className="truncate text-xs font-bold text-zinc-900 transition-colors group-hover:text-red-600 dark:text-zinc-100">
                                                                {member.name}
                                                            </span>
                                                            <Badge
                                                                variant={
                                                                    member.role ===
                                                                    'admin'
                                                                        ? 'destructive'
                                                                        : 'secondary'
                                                                }
                                                                className="px-1.5 py-0 text-[9px] font-bold uppercase"
                                                            >
                                                                {member.role}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 truncate text-[11px] text-zinc-500">
                                                            <Phone className="size-3 shrink-0 text-zinc-400" />
                                                            <span className="font-mono">
                                                                {
                                                                    member.phone_number
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 pt-0.5">
                                                            {renderTierBadge(
                                                                member.tier,
                                                            )}
                                                            <span className="font-mono text-[10px] font-bold text-amber-600">
                                                                {member.points.toLocaleString(
                                                                    'id-ID',
                                                                )}{' '}
                                                                PTS
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex shrink-0 flex-col items-end gap-1">
                                                        {member.is_verified ? (
                                                            <span title="Email Terverifikasi">
                                                                <CheckCircle2 className="size-4 text-emerald-500" />
                                                            </span>
                                                        ) : (
                                                            <span title="Belum Verifikasi">
                                                                <Clock className="size-4 text-amber-500" />
                                                            </span>
                                                        )}
                                                        <span className="font-mono text-[10px] text-zinc-400">
                                                            #
                                                            {member.id.slice(
                                                                -4,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>

                                    {/* Security & System Check */}
                                    <div className="mt-5 space-y-2.5 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-950/60">
                                        <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100">
                                            <ShieldCheck className="size-4 text-emerald-600" />
                                            Infrastruktur & Status Sistem
                                        </div>
                                        <div className="space-y-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                                            <div className="flex items-center justify-between">
                                                <span>Total Staf Admin:</span>
                                                <strong className="font-mono text-zinc-900 dark:text-zinc-100">
                                                    {stats.totalAdmins} akun
                                                </strong>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Jenis Layanan Poin:</span>
                                                <strong className="font-mono text-zinc-900 dark:text-zinc-100">
                                                    {stats.totalActivitiesCount}{' '}
                                                    aktivitas
                                                </strong>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>
                                                    Katalog Reward Aktif:
                                                </span>
                                                <strong className="font-mono font-semibold text-purple-600">
                                                    {stats.activeRewardsCount}{' '}
                                                    voucher/hadiah
                                                </strong>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>
                                                    Verifikasi Email Member:
                                                </span>
                                                <strong className="font-semibold text-emerald-600">
                                                    {stats.verifiedRate}%
                                                    Selesai
                                                </strong>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Autentikasi 2FA:</span>
                                                <strong className="text-zinc-900 dark:text-zinc-100">
                                                    Email OTP & TOTP
                                                </strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: DATABASE MEMBER */}
                {activeTab === 'members' && (
                    <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                        {/* Member Filter Header */}
                        <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 p-6 md:flex-row md:items-center dark:border-zinc-800">
                            <div>
                                <h2 className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
                                    <Users className="size-5 text-red-600" />
                                    Direktori & Database Member Honda
                                </h2>
                                <p className="text-xs text-zinc-500">
                                    Kelola akun pelanggan, lihat saldo poin
                                    aktual, tier loyalitas, dan kontak resmi
                                </p>
                            </div>

                            {/* Filters and export */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                <div className="flex items-center gap-1.5 rounded-xl bg-zinc-100 p-1 text-xs dark:bg-zinc-800">
                                    <button
                                        type="button"
                                        onClick={() => setRoleFilter('all')}
                                        className={`cursor-pointer rounded-lg px-2.5 py-1 font-medium transition-all ${
                                            roleFilter === 'all'
                                                ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white'
                                                : 'text-zinc-600 dark:text-zinc-400'
                                        }`}
                                    >
                                        Semua ({recentMembers.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRoleFilter('user')}
                                        className={`cursor-pointer rounded-lg px-2.5 py-1 font-medium transition-all ${
                                            roleFilter === 'user'
                                                ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white'
                                                : 'text-zinc-600 dark:text-zinc-400'
                                        }`}
                                    >
                                        Member
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRoleFilter('admin')}
                                        className={`cursor-pointer rounded-lg px-2.5 py-1 font-medium transition-all ${
                                            roleFilter === 'admin'
                                                ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white'
                                                : 'text-zinc-600 dark:text-zinc-400'
                                        }`}
                                    >
                                        Admin
                                    </button>
                                </div>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        const csv = filteredMembers
                                            .map(
                                                (m) =>
                                                    `"${m.id}","${m.name}","${m.email}","${m.phone_number}","${m.address}","${m.role}","${m.tier}","${m.points}","${m.is_verified ? 'Verified' : 'Pending'}"`,
                                            )
                                            .join('\n');
                                        const header =
                                            '"ID","Nama","Email","No. Telepon","Alamat","Role","Tier","Poin","Status Email"\n';
                                        handleCopy(
                                            header + csv,
                                            'Data Ekspor Member (CSV)',
                                        );
                                    }}
                                    className="h-9 cursor-pointer gap-1.5 rounded-xl text-xs"
                                >
                                    <Download className="size-3.5" />
                                    Ekspor CSV
                                </Button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-zinc-200 bg-zinc-50 font-bold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60">
                                    <tr>
                                        <th className="px-4 py-3.5">
                                            ID Member
                                        </th>
                                        <th className="px-4 py-3.5">
                                            Nama Lengkap
                                        </th>
                                        <th className="px-4 py-3.5">Tier</th>
                                        <th className="px-4 py-3.5">
                                            Saldo Poin
                                        </th>
                                        <th className="px-4 py-3.5">
                                            Kontak / WA
                                        </th>
                                        <th className="px-4 py-3.5">
                                            Alamat Domisili
                                        </th>
                                        <th className="px-4 py-3.5">
                                            Status Email
                                        </th>
                                        <th className="px-4 py-3.5">
                                            Bergabung
                                        </th>
                                        <th className="px-4 py-3.5 text-right">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                    {filteredMembers.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={9}
                                                className="py-12 text-center text-zinc-400"
                                            >
                                                Tidak ditemukan member yang
                                                cocok dengan kriteria pencarian.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredMembers.map((member) => (
                                            <tr
                                                key={member.id}
                                                className="transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40"
                                            >
                                                <td className="px-4 py-3.5 font-mono font-bold text-red-600 dark:text-red-400">
                                                    #{member.id}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                                        {member.name}
                                                    </div>
                                                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-500">
                                                        <Mail className="size-3 text-zinc-400" />
                                                        <span>
                                                            {member.email}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {renderTierBadge(
                                                        member.tier,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="font-mono font-black text-amber-600 dark:text-amber-400">
                                                        {member.points.toLocaleString(
                                                            'id-ID',
                                                        )}{' '}
                                                        PTS
                                                    </div>
                                                    <div className="text-[10px] text-zinc-400">
                                                        Total:{' '}
                                                        {member.lifetime_points.toLocaleString(
                                                            'id-ID',
                                                        )}{' '}
                                                        pts
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
                                                            {
                                                                member.phone_number
                                                            }
                                                        </span>
                                                        {member.phone_number &&
                                                            member.phone_number !==
                                                                '-' && (
                                                                <a
                                                                    href={`https://wa.me/${member.phone_number.replace(/^0/, '62')}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                                                                    title="Hubungi via WhatsApp"
                                                                >
                                                                    <MessageCircle className="size-3.5" />
                                                                </a>
                                                            )}
                                                    </div>
                                                </td>
                                                <td className="max-w-xs truncate px-4 py-3.5 text-zinc-600 dark:text-zinc-400">
                                                    <span
                                                        title={member.address}
                                                    >
                                                        {member.address}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {member.is_verified ? (
                                                        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                                                            <CheckCircle2 className="size-3.5" />
                                                            Terverifikasi
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                                                            <Clock className="size-3.5" />
                                                            Belum
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap text-zinc-500">
                                                    {member.joined_at}
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link
                                                            href={`/admin/scan-user?search=${member.id}`}
                                                            className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg px-2 text-xs font-semibold text-zinc-600 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40"
                                                            title="Buka Scan & Riwayat Klaim User"
                                                        >
                                                            <UserCheck className="size-3.5" />
                                                            Klaim
                                                        </Link>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                setSelectedMember(
                                                                    member,
                                                                )
                                                            }
                                                            className="h-8 cursor-pointer rounded-lg px-2.5 text-xs text-zinc-600 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                                                        >
                                                            <Eye className="mr-1 size-3.5" />
                                                            Detail
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

                {/* TAB 3: CLAIMS MANAGEMENT */}
                {activeTab === 'claims' && (
                    <div className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-center dark:border-zinc-800">
                            <div>
                                <h2 className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
                                    <Gift className="size-5 text-red-600" />
                                    Pusat Verifikasi & Log Penukaran Reward
                                </h2>
                                <p className="text-xs text-zinc-500">
                                    Daftar penukaran reward member Honda.
                                    Verifikasi status hold untuk menyerahkan
                                    hadiah langsung kepada pelanggan
                                </p>
                            </div>

                            {/* Claim Status Filters */}
                            <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1 text-xs dark:bg-zinc-800">
                                <button
                                    type="button"
                                    onClick={() => setClaimsFilter('all')}
                                    className={`cursor-pointer rounded-lg px-3 py-1.5 font-bold transition-all ${
                                        claimsFilter === 'all'
                                            ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white'
                                            : 'text-zinc-600 dark:text-zinc-400'
                                    }`}
                                >
                                    Semua ({recentClaims.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setClaimsFilter('hold')}
                                    className={`cursor-pointer rounded-lg px-3 py-1.5 font-bold transition-all ${
                                        claimsFilter === 'hold'
                                            ? 'bg-amber-500 text-white shadow-xs'
                                            : 'text-zinc-600 dark:text-zinc-400'
                                    }`}
                                >
                                    Menunggu Hold ({stats.pendingHoldClaims})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setClaimsFilter('claimed')}
                                    className={`cursor-pointer rounded-lg px-3 py-1.5 font-bold transition-all ${
                                        claimsFilter === 'claimed'
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'text-zinc-600 dark:text-zinc-400'
                                    }`}
                                >
                                    Selesai ({stats.completedClaims})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setClaimsFilter('rejected')}
                                    className={`cursor-pointer rounded-lg px-3 py-1.5 font-bold transition-all ${
                                        claimsFilter === 'rejected'
                                            ? 'bg-red-600 text-white shadow-xs'
                                            : 'text-zinc-600 dark:text-zinc-400'
                                    }`}
                                >
                                    Ditolak
                                </button>
                            </div>
                        </div>

                        {filteredClaims.length === 0 ? (
                            <div className="space-y-2 py-16 text-center text-zinc-400">
                                <Gift className="mx-auto size-10 text-zinc-300 dark:text-zinc-700" />
                                <p className="text-sm font-medium">
                                    Tidak ada data penukaran reward dengan
                                    filter ini.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                {filteredClaims.map((claim) => (
                                    <div
                                        key={claim.id}
                                        className="flex flex-col justify-between space-y-4 rounded-3xl border border-zinc-200/80 bg-zinc-50/50 p-5 transition-all hover:border-red-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-red-900/60"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className="font-mono text-xs font-bold"
                                                    >
                                                        #{claim.id}
                                                    </Badge>
                                                    <span className="text-[11px] text-zinc-400">
                                                        {claim.created_at}
                                                    </span>
                                                </div>

                                                {renderClaimStatusBadge(
                                                    claim.status,
                                                )}
                                            </div>

                                            <div className="flex items-start gap-3.5">
                                                <div className="size-14 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800">
                                                    {claim.reward_image ? (
                                                        <img
                                                            src={
                                                                claim.reward_image
                                                            }
                                                            alt={
                                                                claim.reward_name
                                                            }
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                                            <Gift className="size-6" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <h3 className="truncate text-base font-black text-zinc-900 dark:text-zinc-100">
                                                        {claim.reward_name}
                                                    </h3>
                                                    <p className="mt-0.5 text-xs text-zinc-500">
                                                        Member:{' '}
                                                        <strong className="text-zinc-800 dark:text-zinc-200">
                                                            {claim.user_name}
                                                        </strong>{' '}
                                                        (#{claim.user_id})
                                                    </p>
                                                    <p className="truncate text-[11px] text-zinc-400">
                                                        {claim.user_email}{' '}
                                                        &bull;{' '}
                                                        {claim.user_phone}
                                                    </p>
                                                </div>

                                                <div className="shrink-0 text-right">
                                                    <span className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-black text-red-600 dark:border-red-900/40 dark:bg-red-950/50 dark:text-red-400">
                                                        -{claim.points_cost} PTS
                                                    </span>
                                                </div>
                                            </div>

                                            {claim.admin_notes && (
                                                <div className="rounded-xl border border-zinc-200/70 bg-white p-2.5 text-[11px] text-zinc-500 italic dark:border-zinc-800 dark:bg-zinc-900">
                                                    Catatan Admin:{' '}
                                                    {claim.admin_notes} (
                                                    {claim.admin_name})
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-between gap-2 border-t border-zinc-200/70 pt-2 dark:border-zinc-800">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    setInspectedClaim(claim)
                                                }
                                                className="h-9 rounded-xl border-zinc-300 text-xs dark:border-zinc-700"
                                            >
                                                <Eye className="mr-1.5 size-3.5" />
                                                Detail Klaim
                                            </Button>

                                            {claim.status === 'hold' ? (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        disabled={
                                                            processingClaimId ===
                                                            claim.id
                                                        }
                                                        onClick={() =>
                                                            handleApproveClaim(
                                                                claim,
                                                            )
                                                        }
                                                        className="h-9 cursor-pointer rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700"
                                                    >
                                                        <Check className="mr-1 size-4" />
                                                        Setujui
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        disabled={
                                                            processingClaimId ===
                                                            claim.id
                                                        }
                                                        onClick={() =>
                                                            handleRejectClaim(
                                                                claim,
                                                            )
                                                        }
                                                        className="h-9 cursor-pointer rounded-xl px-3 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                                    >
                                                        Tolak
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="font-mono text-xs text-zinc-400">
                                                    Diproses oleh:{' '}
                                                    {claim.admin_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 4: SCAN & POINTS TRANSACTION LOG */}
                {activeTab === 'scans' && (
                    <div className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-center dark:border-zinc-800">
                            <div>
                                <h2 className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
                                    <History className="size-5 text-red-600" />
                                    Log Riwayat Transaksi Scan & Pemberian Poin
                                </h2>
                                <p className="text-xs text-zinc-500">
                                    Pencatatan aktual dari pemindaian barcode
                                    member dan pemberian reward loyalitas
                                    servis/pembelian AHASS
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link
                                    href="/admin/scan"
                                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-red-600 px-3.5 text-xs font-bold text-white shadow-md shadow-red-600/20 hover:bg-red-700"
                                >
                                    <QrCode className="size-4" />
                                    Buka Scanner Poin
                                </Link>
                                <Link
                                    href="/admin/activities"
                                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-zinc-300 px-3 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                >
                                    <ActivityIcon className="size-4" />
                                    Kelola Aktivitas
                                </Link>
                            </div>
                        </div>

                        {recentScans.length === 0 ? (
                            <div className="space-y-2 py-16 text-center text-zinc-400">
                                <History className="mx-auto size-10 text-zinc-300 dark:text-zinc-700" />
                                <p className="text-sm font-medium">
                                    Belum ada riwayat transaksi scan poin di
                                    database.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-zinc-200 bg-zinc-50 font-bold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60">
                                        <tr>
                                            <th className="px-4 py-3.5">
                                                ID Transaksi
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Nama Aktivitas
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Poin Dikreditkan
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Member Penerima
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Petugas / Admin
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Waktu Transaksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                        {recentScans.map((scan) => (
                                            <tr
                                                key={scan.id}
                                                className="transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40"
                                            >
                                                <td className="px-4 py-3.5 font-mono font-bold text-zinc-600 dark:text-zinc-400">
                                                    #{scan.id}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                                        {scan.activity_name}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-mono font-black text-amber-600 dark:text-amber-400">
                                                        +{scan.points} PTS
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                                                        {scan.user_name}
                                                    </div>
                                                    <span className="font-mono text-[10px] text-zinc-400">
                                                        ID: #{scan.user_id}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400">
                                                    {scan.admin_name}
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap text-zinc-500">
                                                    {scan.created_at} (
                                                    {scan.time_ago})
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 5: REWARDS CATALOG */}
                {activeTab === 'rewards' && (
                    <div className="space-y-6">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
                                    <Gift className="size-5 text-red-600" />
                                    Katalog Reward Loyalitas Honda (Database)
                                </h2>
                                <p className="text-xs text-zinc-500">
                                    Daftar hadiah, voucher servis AHASS,
                                    merchandise, dan sparepart yang dapat
                                    ditukarkan member
                                </p>
                            </div>

                            <Link
                                href="/admin/rewards"
                                className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-bold text-white shadow-md shadow-red-600/20 hover:bg-red-700"
                            >
                                <Plus className="size-4" />
                                Kelola & Tambah Reward Baru
                            </Link>
                        </div>

                        {rewards.length === 0 ? (
                            <div className="space-y-3 rounded-3xl border border-zinc-200 bg-white p-16 text-center text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
                                <Gift className="mx-auto size-12 text-zinc-300 dark:text-zinc-600" />
                                <p className="text-sm font-semibold">
                                    Belum ada reward yang dibuat di database.
                                </p>
                                <Link
                                    href="/admin/rewards"
                                    className="inline-flex items-center text-xs font-bold text-red-600 hover:underline"
                                >
                                    Tambah reward sekarang &rarr;
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                                {rewards.map((reward) => (
                                    <div
                                        key={reward.id}
                                        className="group flex flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-xs transition-all hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
                                    >
                                        <div className="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                            {reward.image_url ? (
                                                <img
                                                    src={reward.image_url}
                                                    alt={reward.name}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                                    <Gift className="size-8" />
                                                </div>
                                            )}
                                            <div className="absolute top-3 right-3 rounded-xl bg-red-600 px-3 py-1 text-xs font-black text-white shadow-md">
                                                {reward.points_cost} PTS
                                            </div>
                                            <div className="absolute top-3 left-3">
                                                {reward.is_active ? (
                                                    <span className="rounded-lg bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                                        Aktif
                                                    </span>
                                                ) : (
                                                    <span className="rounded-lg bg-zinc-700 px-2 py-0.5 text-[10px] font-bold text-zinc-200">
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-1 flex-col justify-between space-y-3 p-4">
                                            <div className="space-y-1">
                                                <span className="block font-mono text-[10px] font-bold text-zinc-400">
                                                    #{reward.id}
                                                </span>
                                                <h3 className="text-sm leading-snug font-bold text-zinc-900 transition-colors group-hover:text-red-600 dark:text-zinc-100">
                                                    {reward.name}
                                                </h3>
                                                {reward.description && (
                                                    <p className="line-clamp-2 text-xs text-zinc-500">
                                                        {reward.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between border-t border-zinc-100 pt-2 text-xs dark:border-zinc-800">
                                                <div>
                                                    <span className="block text-[10px] font-bold text-zinc-400 uppercase">
                                                        Stok Sisa
                                                    </span>
                                                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                                        {reward.stock} unit
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-[10px] font-bold text-zinc-400 uppercase">
                                                        Ditukarkan
                                                    </span>
                                                    <span className="font-mono font-bold text-emerald-600">
                                                        {reward.claimed_count}{' '}
                                                        kali
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 6: POLICY & POINTS CALCULATION */}
                {activeTab === 'policy' && (
                    <div className="space-y-8">
                        {/* HERO HEADER CARD */}
                        <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs md:p-8 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full bg-red-600/5 blur-3xl dark:bg-red-600/10" />
                            <div className="relative z-10 max-w-4xl space-y-4">
                                <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-600 dark:border-red-900/50 dark:text-red-400">
                                    <Calculator className="size-3.5" />
                                    Pedoman Resmi Sistem Loyalitas Honda AHASS
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight text-zinc-900 md:text-2xl dark:text-white">
                                        Kebijakan Poin, Tingkatan Member &
                                        Standar Operasional AHASS
                                    </h2>
                                    <p className="mt-1 text-xs leading-relaxed text-zinc-600 md:text-sm dark:text-zinc-400">
                                        Panduan operasional resmi untuk kasir,
                                        service advisor, dan manajemen bengkel
                                        AHASS. Menjelaskan logika penentuan 5
                                        tingkatan member, arsitektur poin ganda
                                        (Saldo Likuid vs Akumulasi Seumur
                                        Hidup), standar operasional scanner
                                        kasir, serta mekanisme proteksi
                                        transaksi reward.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2">
                                    <Badge
                                        variant="outline"
                                        className="border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold dark:border-zinc-700 dark:bg-zinc-800/60"
                                    >
                                        <Layers className="mr-1.5 size-3 text-red-600" />
                                        5 Tingkatan Member (Bronze – Diamond)
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className="border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold dark:border-zinc-700 dark:bg-zinc-800/60"
                                    >
                                        <Coins className="mr-1.5 size-3 text-emerald-600" />
                                        Dual-Point (Saldo Aktif vs Lifetime)
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className="border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold dark:border-zinc-700 dark:bg-zinc-800/60"
                                    >
                                        <Database className="mr-1.5 size-3 text-blue-600" />
                                        Proteksi Transaksional ACID
                                        (Auto-Refund)
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className="border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold dark:border-zinc-700 dark:bg-zinc-800/60"
                                    >
                                        <ShieldCheck className="mr-1.5 size-3 text-purple-600" />
                                        Verifikasi Email & 2FA Terproteksi
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 1: 5 MEMBER TIERS ROADMAP */}
                        <div className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs md:p-8 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex flex-col justify-between gap-2 border-b border-zinc-100 pb-4 sm:flex-row sm:items-center dark:border-zinc-800/60">
                                <div>
                                    <h3 className="flex items-center gap-2 text-base font-bold text-zinc-900 md:text-lg dark:text-white">
                                        <Layers className="size-5 text-red-600" />
                                        1. Roadmap & Spesifikasi 5 Tingkatan
                                        Member (Member Tier)
                                    </h3>
                                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                        Tingkatan loyalitas dihitung otomatis
                                        dari akumulasi total poin seumur hidup (
                                        <code className="font-mono text-zinc-700 dark:text-zinc-300">
                                            lifetime_points
                                        </code>
                                        ).
                                    </p>
                                </div>
                                <span className="inline-flex items-center self-start rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 sm:self-auto dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    <Sparkles className="mr-1 size-3 text-emerald-500" />{' '}
                                    Tier Tidak Pernah Turun
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                                {/* Bronze Tier */}
                                <div className="flex flex-col justify-between space-y-3 rounded-2xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                                                <Shield className="size-3 text-amber-700" />{' '}
                                                BRONZE
                                            </span>
                                            <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                                                Level 1
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                                                0 – 499{' '}
                                                <span className="text-xs font-semibold text-zinc-500">
                                                    Pts
                                                </span>
                                            </div>
                                            <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                                                Member Baru (Default)
                                            </div>
                                        </div>
                                        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                            Akses perolehan poin rewards di
                                            seluruh AHASS dan dealer resmi Honda
                                            melalui scan QR ID member saat
                                            servis berkala.
                                        </p>
                                    </div>
                                    <div className="border-t border-amber-200/60 pt-2 text-[10px] font-medium text-zinc-500 dark:border-amber-900/40">
                                        Status awal pendaftaran akun
                                    </div>
                                </div>

                                {/* Silver Tier */}
                                <div className="flex flex-col justify-between space-y-3 rounded-2xl border border-slate-300 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/20">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-200 px-2 py-0.5 text-[10px] font-black text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                <Shield className="size-3 text-slate-500" />{' '}
                                                SILVER
                                            </span>
                                            <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                                                Level 2
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                                                500 – 1.499{' '}
                                                <span className="text-xs font-semibold text-zinc-500">
                                                    Pts
                                                </span>
                                            </div>
                                            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                Member Aktif
                                            </div>
                                        </div>
                                        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                            Akses katalog voucher oli MPX,
                                            diskon servis berkala reguler, dan
                                            penukaran merchandise standar Honda.
                                        </p>
                                    </div>
                                    <div className="border-t border-slate-200 pt-2 text-[10px] font-medium text-zinc-500 dark:border-slate-800">
                                        Butuh min. 500 Pts kumulatif
                                    </div>
                                </div>

                                {/* Gold Tier */}
                                <div className="flex flex-col justify-between space-y-3 rounded-2xl border border-amber-300 bg-yellow-50/40 p-4 dark:border-amber-700/50 dark:bg-yellow-950/20">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400 bg-yellow-100 px-2 py-0.5 text-[10px] font-black text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300">
                                                <Award className="size-3 text-amber-500" />{' '}
                                                GOLD
                                            </span>
                                            <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                                                Level 3
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                                                1.500 – 3.499{' '}
                                                <span className="text-xs font-semibold text-zinc-500">
                                                    Pts
                                                </span>
                                            </div>
                                            <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                                                Member Loyal
                                            </div>
                                        </div>
                                        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                            Prioritas booking servis AHASS,
                                            diskon suku cadang & aksesori resmi
                                            Honda, serta voucher servis berkala
                                            spesial.
                                        </p>
                                    </div>
                                    <div className="border-t border-yellow-200/60 pt-2 text-[10px] font-medium text-zinc-500 dark:border-yellow-800/40">
                                        Butuh min. 1.500 Pts kumulatif
                                    </div>
                                </div>

                                {/* Platinum Tier */}
                                <div className="flex flex-col justify-between space-y-3 rounded-2xl border border-cyan-300 bg-cyan-50/40 p-4 dark:border-cyan-800 dark:bg-cyan-950/20">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300 bg-cyan-100 px-2 py-0.5 text-[10px] font-black text-cyan-800 dark:border-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300">
                                                <Sparkles className="size-3 text-cyan-500" />{' '}
                                                PLATINUM
                                            </span>
                                            <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                                                Level 4
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                                                3.500 – 6.999{' '}
                                                <span className="text-xs font-semibold text-zinc-500">
                                                    Pts
                                                </span>
                                            </div>
                                            <div className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300">
                                                Member Prioritas
                                            </div>
                                        </div>
                                        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                            Prioritas antrean servis AHASS (Fast
                                            Lane), tiket undian ganda Hari
                                            Pelanggan Nasional, dan voucher
                                            event eksklusif.
                                        </p>
                                    </div>
                                    <div className="border-t border-cyan-200/60 pt-2 text-[10px] font-medium text-zinc-500 dark:border-cyan-800/40">
                                        Butuh min. 3.500 Pts kumulatif
                                    </div>
                                </div>

                                {/* Diamond Tier */}
                                <div className="flex flex-col justify-between space-y-3 rounded-2xl border border-purple-300 bg-purple-50/40 p-4 dark:border-purple-800 dark:bg-purple-950/20">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="inline-flex items-center gap-1 rounded-full border border-purple-300 bg-purple-100 px-2 py-0.5 text-[10px] font-black text-purple-800 dark:border-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                                                <Crown className="size-3 text-purple-500" />{' '}
                                                DIAMOND
                                            </span>
                                            <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                                                Level 5 (VIP)
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                                                ≥ 7.000{' '}
                                                <span className="text-xs font-semibold text-zinc-500">
                                                    Pts
                                                </span>
                                            </div>
                                            <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
                                                Tingkat Tertinggi (VIP)
                                            </div>
                                        </div>
                                        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                            Layanan VIP AHASS, merchandise
                                            premium eksklusif Honda, dan
                                            undangan kehormatan event tahunan
                                            eksklusif Honda.
                                        </p>
                                    </div>
                                    <div className="border-t border-purple-200/60 pt-2 text-[10px] font-medium text-zinc-500 dark:border-purple-800/40">
                                        Tingkat loyalitas tertinggi
                                    </div>
                                </div>
                            </div>

                            {/* Note on tier retention */}
                            <div className="flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
                                <Info className="mt-0.5 size-4 shrink-0 text-amber-600" />
                                <div className="text-xs leading-relaxed text-amber-900 dark:text-amber-200">
                                    <strong>
                                        Prinsip Retensi Level Member:
                                    </strong>{' '}
                                    Penentuan tingkatan loyalitas member
                                    bersifat{' '}
                                    <em>
                                        monotonik meningkat (tidak pernah turun)
                                    </em>
                                    . Saat member menukarkan saldo reward untuk
                                    hadiah atau voucher, yang berkurang hanyalah{' '}
                                    <strong>Saldo Poin Aktif</strong> (
                                    <code className="font-mono font-bold">
                                        points
                                    </code>
                                    ). Poin kumulatif seumur hidup (
                                    <code className="font-mono font-bold">
                                        lifetime_points
                                    </code>
                                    ) tetap utuh, sehingga status Tier member
                                    tidak akan terdegradasi.
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: DUAL-POINT ARCHITECTURE */}
                        <div className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs md:p-8 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="border-b border-zinc-100 pb-4 dark:border-zinc-800/60">
                                <h3 className="flex items-center gap-2 text-base font-bold text-zinc-900 md:text-lg dark:text-white">
                                    <Coins className="size-5 text-red-600" />
                                    2. Arsitektur Poin Ganda: Saldo Poin Aktif
                                    vs Poin Seumur Hidup
                                </h3>
                                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                    Sistem loyalitas memisahkan fungsi mata uang
                                    penukaran reward dari indikator peringkat
                                    reputasi servis member.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Card A: Saldo Poin Aktif */}
                                <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-xl bg-emerald-600 p-2 text-white">
                                                <Coins className="size-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                    Saldo Poin Aktif
                                                </h4>
                                                <span className="font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                                    Column: users.points
                                                </span>
                                            </div>
                                        </div>
                                        <Badge className="border-emerald-300 bg-emerald-100 text-[10px] font-bold text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                            DAPAT DIBELANJAKAN
                                        </Badge>
                                    </div>

                                    <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                        Merupakan saldo likuid poin digital
                                        milik member yang dapat ditukarkan
                                        dengan hadiah merchandise fisik, voucher
                                        oli MPX, dan kupon diskon servis di
                                        katalog.
                                    </p>

                                    <div className="space-y-2 border-t border-emerald-200/60 pt-2 text-xs dark:border-emerald-900/40">
                                        <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                                            <span className="shrink-0 font-bold text-emerald-600 dark:text-emerald-400">
                                                (+) Masuk:
                                            </span>
                                            <span>
                                                Bertambah saat kasir AHASS
                                                memindai QR kartu member di menu
                                                Scan Poin (
                                                <code className="font-mono text-[11px]">
                                                    /admin/scan
                                                </code>
                                                ).
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                                            <span className="shrink-0 font-bold text-red-600 dark:text-red-400">
                                                (-) Debet:
                                            </span>
                                            <span>
                                                Terpotong otomatis saat member
                                                menukar hadiah di katalog online
                                                (status awal: <em>Hold</em>).
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                                            <span className="shrink-0 font-bold text-blue-600 dark:text-blue-400">
                                                (+) Refund:
                                            </span>
                                            <span>
                                                Dikembalikan utuh seketika ke
                                                member bila klaim ditolak atau
                                                dibatalkan oleh kasir/admin.
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card B: Poin Akumulasi Seumur Hidup */}
                                <div className="space-y-4 rounded-2xl border border-purple-200 bg-purple-50/40 p-5 dark:border-purple-900/50 dark:bg-purple-950/20">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-xl bg-purple-600 p-2 text-white">
                                                <TrendingUp className="size-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                    Total Poin Seumur Hidup
                                                </h4>
                                                <span className="font-mono text-[11px] font-semibold text-purple-700 dark:text-purple-400">
                                                    Column:
                                                    users.lifetime_points
                                                </span>
                                            </div>
                                        </div>
                                        <Badge className="border-purple-300 bg-purple-100 text-[10px] font-bold text-purple-800 dark:border-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                                            PERMANEN & AUDIT
                                        </Badge>
                                    </div>

                                    <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                        Merupakan angka total seluruh poin yang
                                        pernah diperoleh member dari setiap kali
                                        transaksi servis atau pembelian suku
                                        cadang resmi di bengkel AHASS sejak
                                        mendaftar.
                                    </p>

                                    <div className="space-y-2 border-t border-purple-200/60 pt-2 text-xs dark:border-purple-900/40">
                                        <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                                            <span className="shrink-0 font-bold text-purple-600 dark:text-purple-400">
                                                (+) Masuk:
                                            </span>
                                            <span>
                                                Bertambah bersamaan dengan saldo
                                                poin setiap kali servis AHASS
                                                berhasil diinput kasir.
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                                            <span className="shrink-0 font-bold text-amber-600 dark:text-amber-400">
                                                (=) Permanen:
                                            </span>
                                            <span>
                                                <strong>
                                                    TIDAK PERNAH DIKURANGI
                                                </strong>{' '}
                                                saat penukaran hadiah, belanja
                                                merchandise, atau penggunaan
                                                kupon.
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                                            <span className="shrink-0 font-bold text-emerald-600 dark:text-emerald-400">
                                                (*) Acuan Tier:
                                            </span>
                                            <span>
                                                Satu-satunya metrik acuan sistem
                                                untuk menghitung level dan
                                                progres tier member Honda.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: 3 ALUR TRANSAKSI UTAMA KASIR AHASS */}
                        <div className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs md:p-8 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="border-b border-zinc-100 pb-4 dark:border-zinc-800/60">
                                <h3 className="flex items-center gap-2 text-base font-bold text-zinc-900 md:text-lg dark:text-white">
                                    <ActivityIcon className="size-5 text-red-600" />
                                    3. Standar Operasional Prosedur: 3 Alur
                                    Transaksi Utama Kasir AHASS
                                </h3>
                                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                    Prosedur baku penanganan sistem reward
                                    loyalitas pada konter kasir dan meja service
                                    advisor AHASS.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                                {/* Alur 1 */}
                                <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50/40 p-5 dark:border-red-900/50 dark:bg-red-950/20">
                                    <div className="flex items-center justify-between">
                                        <div className="flex size-7 items-center justify-center rounded-lg bg-red-600 text-xs font-black text-white">
                                            1
                                        </div>
                                        <span className="rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                                            /admin/scan
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-red-900 dark:text-red-200">
                                        Pemberian Poin Servis Kasir AHASS
                                    </h4>
                                    <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                        <li>
                                            <strong>Scan Kartu Member:</strong>{' '}
                                            Kasir memindai QR Member pada
                                            aplikasi pelanggan atau mencari
                                            lewat Nomor Polisi / ID Member di
                                            halaman Scan Poin.
                                        </li>
                                        <li>
                                            <strong>Pilih Aktivitas:</strong>{' '}
                                            Kasir memilih pekerjaan servis yang
                                            telah selesai (Servis Lengkap, Ganti
                                            Oli MPX/SPX, dll.) yang nominal
                                            poinnya telah terstandarisasi.
                                        </li>
                                        <li>
                                            <strong>Kredit Instan:</strong> Poin
                                            otomatis ditambahkan ke Saldo Poin
                                            Aktif (
                                            <code className="font-mono text-[11px]">
                                                points
                                            </code>
                                            ) dan Akumulasi Lifetime (
                                            <code className="font-mono text-[11px]">
                                                lifetime_points
                                            </code>
                                            ).
                                        </li>
                                    </ol>
                                </div>

                                {/* Alur 2 */}
                                <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/40 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
                                    <div className="flex items-center justify-between">
                                        <div className="flex size-7 items-center justify-center rounded-lg bg-amber-600 text-xs font-black text-white">
                                            2
                                        </div>
                                        <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                            /admin/scan-user
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                        Penukaran & Serah Terima Reward
                                    </h4>
                                    <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                        <li>
                                            <strong>Member Redeem:</strong>{' '}
                                            Member menukarkan hadiah di
                                            aplikasi. Saldo poin aktif langsung
                                            dipotong, status awal klaim tercatat
                                            sebagai{' '}
                                            <strong className="text-amber-600 dark:text-amber-400">
                                                Hold
                                            </strong>
                                            , dan kuota stok berkurang.
                                        </li>
                                        <li>
                                            <strong>Verifikasi Counter:</strong>{' '}
                                            Member datang ke AHASS menunjukkan
                                            QR Klaim. Kasir membuka menu Scan
                                            User atau daftar klaim dashboard.
                                        </li>
                                        <li>
                                            <strong>Serah Terima Fisik:</strong>{' '}
                                            Kasir mencocokkan identitas dan
                                            fisik barang/voucher, lalu klik{' '}
                                            <strong className="text-emerald-600 dark:text-emerald-400">
                                                "Verifikasi & Serahkan"
                                            </strong>{' '}
                                            &rarr; status berubah{' '}
                                            <strong className="text-emerald-600 dark:text-emerald-400">
                                                Claimed
                                            </strong>
                                            .
                                        </li>
                                    </ol>
                                </div>

                                {/* Alur 3 */}
                                <div className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50/40 p-5 dark:border-blue-900/50 dark:bg-blue-950/20">
                                    <div className="flex items-center justify-between">
                                        <div className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-black text-white">
                                            3
                                        </div>
                                        <span className="rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                            Auto-Rollback
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">
                                        Penolakan Klaim & Refund Poin Otomatis
                                    </h4>
                                    <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                        <li>
                                            <strong>
                                                Indikasi Pembatalan:
                                            </strong>{' '}
                                            Terjadi jika pelanggan salah memilih
                                            reward, stok fisik di bengkel
                                            mendadak rusak/kosong, atau klaim
                                            tidak valid.
                                        </li>
                                        <li>
                                            <strong>
                                                Tindakan Kasir/Admin:
                                            </strong>{' '}
                                            Petugas menekan tombol{' '}
                                            <strong className="text-red-600 dark:text-red-400">
                                                "Tolak Klaim"
                                            </strong>{' '}
                                            pada dashboard atau modal rincian
                                            penukaran reward.
                                        </li>
                                        <li>
                                            <strong>Pemulihan Atomik:</strong>{' '}
                                            Status klaim berubah{' '}
                                            <strong className="text-red-600 dark:text-red-400">
                                                Rejected
                                            </strong>
                                            . Sistem mengembalikan saldo poin
                                            aktif penuh ke member dan memulihkan
                                            stok reward di katalog.
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 4: SECURITY & DATA INTEGRITY */}
                        <div className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs md:p-8 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="border-b border-zinc-100 pb-4 dark:border-zinc-800/60">
                                <h3 className="flex items-center gap-2 text-base font-bold text-zinc-900 md:text-lg dark:text-white">
                                    <ShieldCheck className="size-5 text-red-600" />
                                    4. Arsitektur Keamanan & Integritas Data
                                    Sistem
                                </h3>
                                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                    Standar keamanan berlapis untuk menjaga
                                    integritas saldo poin, verifikasi pelanggan
                                    sah, dan ketertelusuran log.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                                    <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                        <Database className="size-4 shrink-0 text-blue-600" />
                                        Integritas Transaksi Atomik (ACID)
                                    </div>
                                    <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                        Setiap mutasi poin (pemberian poin
                                        servis, penukaran hadiah, penolakan
                                        klaim) dijalankan dalam transaksi
                                        database terisolasi (
                                        <code className="font-mono text-[11px]">
                                            DB::transaction
                                        </code>
                                        ) dengan kunci baris untuk mencegah
                                        race-condition dan double-spending poin.
                                    </p>
                                </div>

                                <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                                    <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                        <Mail className="size-4 shrink-0 text-amber-600" />
                                        Verifikasi Email Wajib
                                    </div>
                                    <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                        Member diwajibkan memverifikasi alamat
                                        email aktif mereka sebelum sistem
                                        mengizinkan penukaran poin atau klaim
                                        voucher di katalog AHASS guna mencegah
                                        pembuatan akun palsu atau penyalahgunaan
                                        nomor rangka motor.
                                    </p>
                                </div>

                                <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                                    <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                        <Lock className="size-4 shrink-0 text-emerald-600" />
                                        Autentikasi Ganda (2FA TOTP & Email OTP)
                                    </div>
                                    <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                        Dilengkapi proteksi autentikasi 2-faktor
                                        berstandar tinggi: aplikasi
                                        authenticator TOTP (Google/Microsoft
                                        Authenticator) dan kode OTP 6-digit via
                                        Email SMTP resmi Honda untuk
                                        perlindungan akun staf kasir, admin, dan
                                        member.
                                    </p>
                                </div>

                                <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                                    <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                        <Shield className="size-4 shrink-0 text-purple-600" />
                                        Pemisahan Peran & Otoritas (RBAC Guard)
                                    </div>
                                    <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                                        Hak akses scanner kasir AHASS,
                                        verifikasi serah terima hadiah, serta
                                        manajemen stok reward dipagari ketat
                                        untuk role{' '}
                                        <code className="font-mono text-[11px] font-bold">
                                            admin
                                        </code>
                                        . Member customer hanya memiliki izin
                                        akses data personal dan penukaran poin
                                        miliknya sendiri.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 5: QUICK ACTIONS NAVIGATION */}
                        <div className="space-y-4 rounded-3xl border border-zinc-200 bg-zinc-50 p-6 md:p-8 dark:border-zinc-800 dark:bg-zinc-950/60">
                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900 md:text-base dark:text-white">
                                    <Zap className="size-4 text-red-600" />
                                    Pintasan Cepat Menu Operasional Kasir &
                                    Admin AHASS
                                </h3>
                                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                    Akses cepat ke alat pemindaian, manajemen
                                    katalog aktivitas servis, dan katalog
                                    reward.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <Link
                                    href="/admin/scan"
                                    className="group flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:border-red-500 hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
                                >
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-600/10 text-red-600 transition-colors group-hover:bg-red-600 group-hover:text-white">
                                        <QrCode className="size-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-bold text-zinc-900 transition-colors group-hover:text-red-600 dark:text-zinc-100">
                                            Scan Poin AHASS
                                        </h4>
                                        <p className="truncate text-[11px] text-zinc-500">
                                            Kreditkan poin servis member
                                        </p>
                                    </div>
                                </Link>

                                <Link
                                    href="/admin/scan-user"
                                    className="group flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:border-amber-500 hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
                                >
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-600/10 text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                                        <UserCheck className="size-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-bold text-zinc-900 transition-colors group-hover:text-amber-600 dark:text-zinc-100">
                                            Scan User & Klaim
                                        </h4>
                                        <p className="truncate text-[11px] text-zinc-500">
                                            Verifikasi serah terima hadiah
                                        </p>
                                    </div>
                                </Link>

                                <Link
                                    href="/admin/activities"
                                    className="group flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:border-blue-500 hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
                                >
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                                        <ActivityIcon className="size-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-bold text-zinc-900 transition-colors group-hover:text-blue-600 dark:text-zinc-100">
                                            Katalog Aktivitas
                                        </h4>
                                        <p className="truncate text-[11px] text-zinc-500">
                                            Atur nominal poin servis AHASS
                                        </p>
                                    </div>
                                </Link>

                                <Link
                                    href="/admin/rewards"
                                    className="group flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:border-emerald-500 hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
                                >
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                                        <Gift className="size-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-bold text-zinc-900 transition-colors group-hover:text-emerald-600 dark:text-zinc-100">
                                            Katalog Reward
                                        </h4>
                                        <p className="truncate text-[11px] text-zinc-500">
                                            Kelola stok & poin hadiah
                                        </p>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Detail Member */}
            <Dialog
                open={!!selectedMember}
                onOpenChange={() => setSelectedMember(null)}
            >
                <DialogContent className="rounded-3xl p-6 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60">
                                <Users className="size-4" />
                            </div>
                            Detail Profil Member Honda
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Informasi identitas akun loyalitas pelanggan dari
                            database
                        </DialogDescription>
                    </DialogHeader>

                    {selectedMember && (
                        <div className="space-y-4 py-2 text-xs">
                            {/* Digital Card Preview */}
                            <div className="relative overflow-hidden rounded-2xl border border-zinc-700/50 bg-gradient-to-br from-zinc-900 via-zinc-800 to-red-950 p-5 text-white shadow-md">
                                <div className="absolute top-3 right-3 opacity-20">
                                    <img
                                        src="/images/logo/honda_logo_white.png"
                                        alt="Honda"
                                        className="h-auto w-16"
                                    />
                                </div>
                                <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                                    Honda Rewards Member ID
                                </span>
                                <div className="mt-0.5 font-mono text-xl font-black tracking-widest text-red-400">
                                    #{selectedMember.id}
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs">
                                    <div>
                                        <span className="block text-[10px] text-zinc-400">
                                            NAMA LENGKAP
                                        </span>
                                        <span className="text-sm font-bold text-white">
                                            {selectedMember.name}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {renderTierBadge(selectedMember.tier)}
                                        <Badge
                                            variant={
                                                selectedMember.role === 'admin'
                                                    ? 'destructive'
                                                    : 'secondary'
                                            }
                                            className="text-[9px] font-bold uppercase"
                                        >
                                            {selectedMember.role}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-2.5 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-400">
                                        Saldo Poin Aktif:
                                    </span>
                                    <span className="font-mono text-sm font-black text-amber-600">
                                        {selectedMember.points.toLocaleString(
                                            'id-ID',
                                        )}{' '}
                                        PTS
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-400">
                                        Total Akumulasi (Lifetime):
                                    </span>
                                    <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                        {selectedMember.lifetime_points.toLocaleString(
                                            'id-ID',
                                        )}{' '}
                                        PTS
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-t border-zinc-200/60 pt-2 dark:border-zinc-800">
                                    <span className="text-zinc-400">
                                        Email:
                                    </span>
                                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                        {selectedMember.email}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-400">
                                        Nomor Telepon:
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                                            {selectedMember.phone_number}
                                        </span>
                                        {selectedMember.phone_number &&
                                            selectedMember.phone_number !==
                                                '-' && (
                                                <a
                                                    href={`https://wa.me/${selectedMember.phone_number.replace(/^0/, '62')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:underline"
                                                >
                                                    <MessageCircle className="size-3" />{' '}
                                                    WA
                                                </a>
                                            )}
                                    </div>
                                </div>
                                <div className="border-t border-zinc-200/60 pt-2 dark:border-zinc-800">
                                    <span className="mb-0.5 block text-zinc-400">
                                        Alamat Domisili:
                                    </span>
                                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                        {selectedMember.address}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-t border-zinc-200/60 pt-2 dark:border-zinc-800">
                                    <span className="text-zinc-400">
                                        Status Email:
                                    </span>
                                    <span
                                        className={
                                            selectedMember.is_verified
                                                ? 'font-bold text-emerald-600'
                                                : 'font-bold text-amber-600'
                                        }
                                    >
                                        {selectedMember.is_verified
                                            ? 'Terverifikasi'
                                            : 'Belum Verifikasi'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-400">
                                        Tanggal Terdaftar:
                                    </span>
                                    <span className="font-mono text-zinc-600 dark:text-zinc-400">
                                        {selectedMember.joined_at}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex-wrap gap-2 sm:gap-0">
                        {selectedMember && (
                            <div className="flex w-full items-center gap-2 sm:w-auto">
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        handleCopy(
                                            selectedMember.id,
                                            'ID Member',
                                        )
                                    }
                                    className="h-9 flex-1 rounded-xl text-xs sm:flex-initial"
                                >
                                    <Copy className="mr-1 size-3.5" /> Salin ID
                                </Button>
                                <Link
                                    href={`/admin/scan-user?search=${selectedMember.id}`}
                                    className="inline-flex h-9 cursor-pointer items-center justify-center rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700"
                                >
                                    <UserCheck className="mr-1 size-3.5" />{' '}
                                    Klaim User
                                </Link>
                            </div>
                        )}
                        <Button
                            onClick={() => setSelectedMember(null)}
                            className="h-9 w-full rounded-xl bg-red-600 text-xs text-white hover:bg-red-700 sm:w-auto"
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Detail Klaim Reward (Claim Inspection) */}
            <Dialog
                open={!!inspectedClaim}
                onOpenChange={() => setInspectedClaim(null)}
            >
                <DialogContent className="rounded-3xl p-6 sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-100">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60">
                                <Gift className="size-4" />
                            </div>
                            Detail Klaim Penukaran Reward Member
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Verifikasi data penukaran reward dan serahkan hadiah
                            fisik kepada pelanggan
                        </DialogDescription>
                    </DialogHeader>

                    {inspectedClaim && (
                        <div className="space-y-4 py-2 text-xs">
                            <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                                <div className="flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
                                    <div className="font-bold text-red-600">
                                        REKOR KLAIM REWARD HONDA
                                    </div>
                                    <div className="font-mono text-[11px] text-zinc-500">
                                        #{inspectedClaim.id}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="size-14 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800">
                                        {inspectedClaim.reward_image ? (
                                            <img
                                                src={
                                                    inspectedClaim.reward_image
                                                }
                                                alt={inspectedClaim.reward_name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                                <Gift className="size-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                                            {inspectedClaim.reward_name}
                                        </h4>
                                        <p className="mt-0.5 font-mono text-[11px] font-bold text-red-600">
                                            Biaya Poin: -
                                            {inspectedClaim.points_cost} PTS
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 border-t border-zinc-200 pt-2 text-[11px] dark:border-zinc-800">
                                    <div>
                                        <span className="block text-[9px] font-bold text-zinc-400 uppercase">
                                            NAMA MEMBER
                                        </span>
                                        <span className="font-bold">
                                            {inspectedClaim.user_name}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[9px] font-bold text-zinc-400 uppercase">
                                            ID MEMBER
                                        </span>
                                        <span className="font-mono font-bold">
                                            #{inspectedClaim.user_id}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[9px] font-bold text-zinc-400 uppercase">
                                            EMAIL MEMBER
                                        </span>
                                        <span className="text-zinc-600 dark:text-zinc-400">
                                            {inspectedClaim.user_email}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[9px] font-bold text-zinc-400 uppercase">
                                            NO. TELEPON
                                        </span>
                                        <span className="font-mono text-zinc-600 dark:text-zinc-400">
                                            {inspectedClaim.user_phone}
                                        </span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="block text-[9px] font-bold text-zinc-400 uppercase">
                                            ALAMAT DOMISILI
                                        </span>
                                        <span className="text-zinc-600 dark:text-zinc-400">
                                            {inspectedClaim.user_address}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[9px] font-bold text-zinc-400 uppercase">
                                            TANGGAL PENUKARAN
                                        </span>
                                        <span className="text-zinc-600 dark:text-zinc-400">
                                            {inspectedClaim.created_at}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[9px] font-bold text-zinc-400 uppercase">
                                            STATUS KLAIM
                                        </span>
                                        <div className="mt-0.5">
                                            {renderClaimStatusBadge(
                                                inspectedClaim.status,
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {inspectedClaim.admin_notes && (
                                    <div className="border-t border-zinc-200 pt-2 text-[11px] dark:border-zinc-800">
                                        <span className="block text-[9px] font-bold text-zinc-400 uppercase">
                                            CATATAN ADMIN
                                        </span>
                                        <p className="text-zinc-600 italic dark:text-zinc-400">
                                            {inspectedClaim.admin_notes} (Oleh:{' '}
                                            {inspectedClaim.admin_name})
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        {inspectedClaim && inspectedClaim.status === 'hold' ? (
                            <>
                                <Button
                                    disabled={
                                        processingClaimId === inspectedClaim.id
                                    }
                                    onClick={() =>
                                        handleApproveClaim(inspectedClaim)
                                    }
                                    className="h-9 flex-1 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                                >
                                    <Check className="mr-1.5 size-4" />
                                    Setujui Penyerahan Hadiah
                                </Button>
                                <Button
                                    variant="outline"
                                    disabled={
                                        processingClaimId === inspectedClaim.id
                                    }
                                    onClick={() =>
                                        handleRejectClaim(inspectedClaim)
                                    }
                                    className="h-9 rounded-xl border-red-200 text-xs text-red-600 hover:bg-red-50"
                                >
                                    Tolak & Kembalikan Poin
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={() => setInspectedClaim(null)}
                                className="h-9 w-full rounded-xl bg-zinc-800 text-xs text-white hover:bg-zinc-900"
                            >
                                Tutup
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

AdminDashboard.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            {
                title: 'Admin Console',
                href: '/admin/dashboard',
            },
        ]}
    >
        {page}
    </AppLayout>
);
