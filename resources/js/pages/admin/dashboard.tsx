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
    const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'claims' | 'scans' | 'rewards' | 'policy'>('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
    const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
    const [claimsFilter, setClaimsFilter] = useState<'all' | 'hold' | 'claimed' | 'rejected'>('all');

    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [inspectedClaim, setInspectedClaim] = useState<ClaimItem | null>(null);
    const [processingClaimId, setProcessingClaimId] = useState<string | null>(null);

    // Filter members based on search and dropdown filters
    const filteredMembers = useMemo(() => {
        return recentMembers.filter((m) => {
            const matchesQuery =
                !searchQuery.trim() ||
                m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.phone_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
                    toast.success(`Klaim reward #${claim.id} untuk ${claim.user_name} berhasil disetujui!`);
                    setInspectedClaim(null);
                },
                onError: () => {
                    toast.error('Gagal menyetujui klaim.');
                },
                onFinish: () => {
                    setProcessingClaimId(null);
                },
            }
        );
    };

    // Handle Reject Claim via real API
    const handleRejectClaim = (claim: ClaimItem) => {
        if (processingClaimId) return;
        if (
            !confirm(
                `Tolak klaim #${claim.id} untuk ${claim.user_name}? Saldo ${claim.points_cost} poin dan stok reward akan dikembalikan ke member.`
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
                        `Klaim #${claim.id} telah ditolak. Saldo ${claim.points_cost} poin telah dikembalikan ke member.`
                    );
                    setInspectedClaim(null);
                },
                onError: () => {
                    toast.error('Gagal menolak klaim.');
                },
                onFinish: () => {
                    setProcessingClaimId(null);
                },
            }
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
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-800">
                        <Crown className="size-3 text-purple-500" /> Diamond
                    </span>
                );
            case 'platinum':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800">
                        <Sparkles className="size-3 text-cyan-500" /> Platinum
                    </span>
                );
            case 'gold':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                        <Award className="size-3 text-amber-500" /> Gold
                    </span>
                );
            case 'silver':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                        <Shield className="size-3 text-slate-500" /> Silver
                    </span>
                );
            case 'bronze':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-900/10 text-amber-800 dark:text-amber-300 border border-amber-700/30">
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
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/50">
                        <Clock className="size-3 text-amber-500" /> Menunggu Hold
                    </span>
                );
            case 'claimed':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/50">
                        <CheckCircle2 className="size-3 text-emerald-500" /> Selesai / Ditukar
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700/50">
                        <XCircle className="size-3 text-red-500" /> Ditolak (Poin Refund)
                    </span>
                );
            case 'cancelled':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                        Dibatalkan
                    </span>
                );
        }
    };

    return (
        <>
            <Head title="Admin Console - Honda Customer Rewards" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Top Executive Banner */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 bg-gradient-to-r from-red-600 via-red-700 to-zinc-950 text-white p-6 md:p-8 rounded-3xl shadow-xl shadow-red-950/20 relative overflow-hidden">
                    {/* Watermark Logo */}
                    <div className="absolute right-0 -bottom-11 opacity-15 pointer-events-none select-none">
                        <img src="/images/logo/honda_logo_white.png" alt="Honda" className="w-84 md:w-96 h-auto" />
                    </div>

                    <div className="relative z-10 space-y-2 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-xs">
                                <ShieldAlert className="size-3.5 text-white" />
                                Honda Official Loyalty Admin Portal
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 border border-emerald-400/40 text-emerald-200">
                                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Database & Transaksi Realtime
                            </span>
                        </div>

                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                            Portal Administrasi Loyalty & Verifikasi Poin
                        </h1>
                        <p className="text-xs md:text-sm text-red-100/90 leading-relaxed">
                            Pusat pemantauan aktivitas loyalitas Honda & AHASS, pencatatan transaksi poin, database pelanggan terdaftar, dan pemrosesan klaim reward langsung dari database.
                        </p>
                    </div>

                    <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-white text-red-700 hover:bg-red-50 active:scale-95 transition-all shadow-md cursor-pointer"
                        >
                            Tampilan Member
                        </Link>
                        <Link
                            href="/admin/scan"
                            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-black/30 hover:bg-black/50 border border-white/30 text-white active:scale-95 transition-all shadow-md cursor-pointer"
                        >
                            <QrCode className="size-4 text-amber-300" />
                            Scan Poin
                        </Link>
                        <Link
                            href="/admin/scan-user"
                            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-black/30 hover:bg-black/50 border border-white/30 text-white active:scale-95 transition-all shadow-md cursor-pointer"
                        >
                            <UserCheck className="size-4 text-emerald-300" />
                            Scan User
                        </Link>
                    </div>
                </div>

                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Metric 1: Total Member */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-2xl shadow-xs hover:border-red-500/40 hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                Total Member Terdaftar
                            </span>
                            <div className="size-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
                                <Users className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.totalMembers.toLocaleString('id-ID')}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 text-xs">
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                                    <TrendingUp className="size-3" />
                                    +{stats.newMembersThisWeek} baru 7 hari
                                </span>
                                <span className="text-zinc-400">&bull;</span>
                                <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                                    {stats.verifiedRate}% Terverifikasi
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Metric 2: Poin Loyalitas Beredar */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-2xl shadow-xs hover:border-red-500/40 hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                Saldo Poin Beredar
                            </span>
                            <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                                <Coins className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.totalPointsCirculating.toLocaleString('id-ID')}{' '}
                                <span className="text-xs font-black text-amber-500">PTS</span>
                            </div>
                            <div className="flex items-center justify-between gap-1.5 mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                <span>Tertebus: <strong>{stats.totalPointsRedeemed.toLocaleString('id-ID')} pts</strong></span>
                                <span className="text-zinc-400 font-medium">Lifetime: {stats.totalLifetimePoints.toLocaleString('id-ID')} pts</span>
                            </div>
                        </div>
                    </div>

                    {/* Metric 3: Klaim Reward Penukaran */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-2xl shadow-xs hover:border-red-500/40 hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                Klaim Reward Member
                            </span>
                            <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                                <Gift className="size-5 text-purple-600" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                                <span>{stats.totalExchangesCount}</span>
                                {stats.pendingHoldClaims > 0 ? (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/50 animate-pulse">
                                        {stats.pendingHoldClaims} Hold
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                                        Tuntas
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between gap-1.5 mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                <span><strong>{stats.completedClaims}</strong> penukaran sukses</span>
                                <span className="text-purple-600 dark:text-purple-400 font-semibold">{stats.activeRewardsCount} reward aktif</span>
                            </div>
                        </div>
                    </div>

                    {/* Metric 4: Aktivitas Scan & Poin Masuk */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-2xl shadow-xs hover:border-red-500/40 hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                Scan & Aktivitas Loyalitas
                            </span>
                            <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                                <History className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.totalScansAwarded.toLocaleString('id-ID')}
                            </div>
                            <div className="flex items-center justify-between gap-1.5 mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{stats.todayPointsAwarded} pts hari ini</span>
                                <span>{stats.todayScansAwarded} scan hari ini</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Primary Navigation Tabs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${activeTab === 'overview'
                                ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                        >
                            <LayoutDashboard className="size-4" />
                            Ringkasan Operasional
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('members')}
                            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${activeTab === 'members'
                                ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                        >
                            <Users className="size-4" />
                            Database Member
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/20 text-white font-mono">
                                {stats.totalMembers}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('claims')}
                            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${activeTab === 'claims'
                                ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                        >
                            <Gift className="size-4" />
                            Klaim Reward
                            {stats.pendingHoldClaims > 0 ? (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-black animate-pulse">
                                    {stats.pendingHoldClaims}
                                </span>
                            ) : (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/20 text-white font-mono">
                                    {stats.totalExchangesCount}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('scans')}
                            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${activeTab === 'scans'
                                ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                        >
                            <History className="size-4" />
                            Riwayat Scan Poin
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/20 text-white font-mono">
                                {stats.totalScansAwarded}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('rewards')}
                            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${activeTab === 'rewards'
                                ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                        >
                            <Award className="size-4" />
                            Katalog Reward
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/20 text-white font-mono">
                                {rewards.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('policy')}
                            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${activeTab === 'policy'
                                ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                        >
                            <Calculator className="size-4" />
                            Kebijakan Poin & Tier
                        </button>
                    </div>

                    {/* Quick Search */}
                    <div className="relative w-full md:w-72 shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                        <Input
                            type="text"
                            placeholder="Cari nama, ID member, email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-xs rounded-xl focus-visible:ring-red-500"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
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
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                                        <Clock className="size-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">
                                            {stats.pendingHoldClaims} Klaim Penukaran Reward Menunggu Persetujuan
                                        </h4>
                                        <p className="text-xs text-amber-800/90 dark:text-amber-300">
                                            Terdapat member yang menukarkan poin reward dan menunggu verifikasi petugas AHASS di database.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => {
                                        setClaimsFilter('hold');
                                        setActiveTab('claims');
                                    }}
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl h-9 px-4 shrink-0 shadow-xs cursor-pointer"
                                >
                                    Tinjau Klaim Hold
                                    <ArrowRight className="size-3.5 ml-1.5" />
                                </Button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Col (2 Span): Recent Claims Queue & Top Activities */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Claims Queue */}
                                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
                                    <div className="flex items-center justify-between mb-5">
                                        <div>
                                            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                                <Gift className="size-4 text-red-600" />
                                                Aliran Klaim & Penukaran Reward
                                            </h2>
                                            <p className="text-xs text-zinc-500">
                                                Data realtime penukaran reward pelanggan dari database
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('claims')}
                                            className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                                        >
                                            Buka Semua ({stats.totalExchangesCount})
                                            <ArrowRight className="size-3" />
                                        </button>
                                    </div>

                                    {recentClaims.length === 0 ? (
                                        <div className="py-12 text-center text-zinc-400 space-y-2">
                                            <Gift className="size-8 mx-auto text-zinc-300 dark:text-zinc-600" />
                                            <p className="text-xs">Belum ada riwayat penukaran reward di database.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {recentClaims.slice(0, 4).map((claim) => (
                                                <div
                                                    key={claim.id}
                                                    className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-red-300 dark:hover:border-red-900/50 transition-all"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="size-12 rounded-xl bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                                                            {claim.reward_image ? (
                                                                <img
                                                                    src={claim.reward_image}
                                                                    alt={claim.reward_name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                                                    <Gift className="size-5" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="space-y-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-200/70 dark:bg-zinc-800 px-2 py-0.5 rounded">
                                                                    #{claim.id}
                                                                </span>
                                                                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                                                    {claim.reward_name}
                                                                </span>
                                                            </div>

                                                            <div className="text-xs text-zinc-600 dark:text-zinc-400 flex flex-wrap items-center gap-2">
                                                                <span>Member: <strong className="text-zinc-900 dark:text-zinc-200">{claim.user_name}</strong></span>
                                                                <span>&bull;</span>
                                                                <span className="font-mono text-zinc-400 text-[11px]">#{claim.user_id}</span>
                                                            </div>

                                                            <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                                                                <span>{claim.created_at} ({claim.time_ago})</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center md:flex-col md:items-end justify-between gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-200 dark:border-zinc-800">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/40">
                                                                -{claim.points_cost} PTS
                                                            </span>
                                                            {renderClaimStatusBadge(claim.status)}
                                                        </div>

                                                        <div className="flex items-center gap-1.5">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setInspectedClaim(claim)}
                                                                className="h-8 text-xs px-2.5 rounded-lg border-zinc-300 dark:border-zinc-700"
                                                            >
                                                                <Eye className="size-3.5 mr-1" />
                                                                Detail
                                                            </Button>

                                                            {claim.status === 'hold' && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        disabled={processingClaimId === claim.id}
                                                                        onClick={() => handleApproveClaim(claim)}
                                                                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 rounded-lg font-bold"
                                                                    >
                                                                        <Check className="size-3.5 mr-1" />
                                                                        Setujui
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        disabled={processingClaimId === claim.id}
                                                                        onClick={() => handleRejectClaim(claim)}
                                                                        className="h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 px-2.5 rounded-lg"
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
                                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                                                <ActivityIcon className="size-4 text-red-600" />
                                                Aktivitas Loyalitas Terbanyak (Database)
                                            </h3>
                                            <p className="text-xs text-zinc-500">
                                                Frekuensi pemberian poin per kategori layanan resmi Honda yang tercatat
                                            </p>
                                        </div>
                                        <Link
                                            href="/admin/activities"
                                            className="text-xs text-red-600 hover:text-red-700 font-bold"
                                        >
                                            Kelola Aktivitas
                                        </Link>
                                    </div>

                                    {topActivities.length === 0 ? (
                                        <div className="py-8 text-center text-zinc-400 text-xs">
                                            Belum ada pencatatan riwayat aktivitas loyalitas di sistem.
                                        </div>
                                    ) : (
                                        <div className="space-y-3.5">
                                            {topActivities.map((item, idx) => {
                                                const totalCount = stats.totalScansAwarded || 1;
                                                const percentage = Math.min(100, Math.round((item.count / totalCount) * 100));

                                                return (
                                                    <div key={idx} className="space-y-1.5">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                                                {item.name}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-amber-600 font-bold">
                                                                    +{item.total_points.toLocaleString('id-ID')} PTS
                                                                </span>
                                                                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                                                    {item.count} kali ({percentage}%)
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                                            <div
                                                                className="h-full bg-red-600 rounded-full transition-all duration-500"
                                                                style={{ width: `${percentage}%` }}
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
                                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                                <Users className="size-4 text-red-600" />
                                                Pendaftar Member Terbaru
                                            </h3>
                                            <p className="text-xs text-zinc-500">Data registrasi dari database</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('members')}
                                            className="text-xs text-red-600 hover:text-red-700 font-bold cursor-pointer"
                                        >
                                            Lihat Semua ({stats.totalMembers})
                                        </button>
                                    </div>

                                    <div className="space-y-3 flex-1">
                                        {recentMembers.slice(0, 5).map((member) => (
                                            <div
                                                key={member.id}
                                                onClick={() => setSelectedMember(member)}
                                                className="p-3.5 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 hover:border-red-300 dark:hover:border-red-900/60 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                                            >
                                                <div className="space-y-1 truncate">
                                                    <div className="flex items-center gap-2 truncate">
                                                        <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate group-hover:text-red-600 transition-colors">
                                                            {member.name}
                                                        </span>
                                                        <Badge
                                                            variant={member.role === 'admin' ? 'destructive' : 'secondary'}
                                                            className="text-[9px] py-0 px-1.5 uppercase font-bold"
                                                        >
                                                            {member.role}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 truncate">
                                                        <Phone className="size-3 text-zinc-400 shrink-0" />
                                                        <span className="font-mono">{member.phone_number}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-0.5">
                                                        {renderTierBadge(member.tier)}
                                                        <span className="text-[10px] font-mono font-bold text-amber-600">
                                                            {member.points.toLocaleString('id-ID')} PTS
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    {member.is_verified ? (
                                                        <span title="Email Terverifikasi">
                                                            <CheckCircle2 className="size-4 text-emerald-500" />
                                                        </span>
                                                    ) : (
                                                        <span title="Belum Verifikasi">
                                                            <Clock className="size-4 text-amber-500" />
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-zinc-400 font-mono">
                                                        #{member.id.slice(-4)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Security & System Check */}
                                    <div className="mt-5 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2.5 text-xs">
                                        <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                            <ShieldCheck className="size-4 text-emerald-600" />
                                            Infrastruktur & Status Sistem
                                        </div>
                                        <div className="space-y-1.5 text-zinc-600 dark:text-zinc-400 text-[11px]">
                                            <div className="flex items-center justify-between">
                                                <span>Total Staf Admin:</span>
                                                <strong className="text-zinc-900 dark:text-zinc-100 font-mono">{stats.totalAdmins} akun</strong>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Jenis Layanan Poin:</span>
                                                <strong className="text-zinc-900 dark:text-zinc-100 font-mono">{stats.totalActivitiesCount} aktivitas</strong>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Katalog Reward Aktif:</span>
                                                <strong className="text-purple-600 font-semibold font-mono">{stats.activeRewardsCount} voucher/hadiah</strong>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Verifikasi Email Member:</span>
                                                <strong className="text-emerald-600 font-semibold">{stats.verifiedRate}% Selesai</strong>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Autentikasi 2FA:</span>
                                                <strong className="text-zinc-900 dark:text-zinc-100">Email OTP & TOTP</strong>
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
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs overflow-hidden">
                        {/* Member Filter Header */}
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Users className="size-5 text-red-600" />
                                    Direktori & Database Member Honda
                                </h2>
                                <p className="text-xs text-zinc-500">
                                    Kelola akun pelanggan, lihat saldo poin aktual, tier loyalitas, dan kontak resmi
                                </p>
                            </div>

                            {/* Filters and export */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setRoleFilter('all')}
                                        className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-all ${roleFilter === 'all'
                                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                                            : 'text-zinc-600 dark:text-zinc-400'
                                            }`}
                                    >
                                        Semua ({recentMembers.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRoleFilter('user')}
                                        className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-all ${roleFilter === 'user'
                                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                                            : 'text-zinc-600 dark:text-zinc-400'
                                            }`}
                                    >
                                        Member
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRoleFilter('admin')}
                                        className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-all ${roleFilter === 'admin'
                                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
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
                                                    `"${m.id}","${m.name}","${m.email}","${m.phone_number}","${m.address}","${m.role}","${m.tier}","${m.points}","${m.is_verified ? 'Verified' : 'Pending'}"`
                                            )
                                            .join('\n');
                                        const header = '"ID","Nama","Email","No. Telepon","Alamat","Role","Tier","Poin","Status Email"\n';
                                        handleCopy(header + csv, 'Data Ekspor Member (CSV)');
                                    }}
                                    className="text-xs h-9 gap-1.5 rounded-xl cursor-pointer"
                                >
                                    <Download className="size-3.5" />
                                    Ekspor CSV
                                </Button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-zinc-50 dark:bg-zinc-950/60 text-zinc-500 font-bold border-b border-zinc-200 dark:border-zinc-800">
                                    <tr>
                                        <th className="py-3.5 px-4">ID Member</th>
                                        <th className="py-3.5 px-4">Nama Lengkap</th>
                                        <th className="py-3.5 px-4">Tier</th>
                                        <th className="py-3.5 px-4">Saldo Poin</th>
                                        <th className="py-3.5 px-4">Kontak / WA</th>
                                        <th className="py-3.5 px-4">Alamat Domisili</th>
                                        <th className="py-3.5 px-4">Status Email</th>
                                        <th className="py-3.5 px-4">Bergabung</th>
                                        <th className="py-3.5 px-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                    {filteredMembers.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-12 text-center text-zinc-400">
                                                Tidak ditemukan member yang cocok dengan kriteria pencarian.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredMembers.map((member) => (
                                            <tr
                                                key={member.id}
                                                className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                                            >
                                                <td className="py-3.5 px-4 font-mono font-bold text-red-600 dark:text-red-400">
                                                    #{member.id}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                                        {member.name}
                                                    </div>
                                                    <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                                                        <Mail className="size-3 text-zinc-400" />
                                                        <span>{member.email}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {renderTierBadge(member.tier)}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="font-black text-amber-600 dark:text-amber-400 font-mono">
                                                        {member.points.toLocaleString('id-ID')} PTS
                                                    </div>
                                                    <div className="text-[10px] text-zinc-400">
                                                        Total: {member.lifetime_points.toLocaleString('id-ID')} pts
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
                                                            {member.phone_number}
                                                        </span>
                                                        {member.phone_number && member.phone_number !== '-' && (
                                                            <a
                                                                href={`https://wa.me/${member.phone_number.replace(/^0/, '62')}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                                                                title="Hubungi via WhatsApp"
                                                            >
                                                                <MessageCircle className="size-3.5" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 max-w-xs text-zinc-600 dark:text-zinc-400 truncate">
                                                    <span title={member.address}>{member.address}</span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {member.is_verified ? (
                                                        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                                                            <CheckCircle2 className="size-3.5" />
                                                            Terverifikasi
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                                                            <Clock className="size-3.5" />
                                                            Belum
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-zinc-500 whitespace-nowrap">
                                                    {member.joined_at}
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link
                                                            href={`/admin/scan-user?search=${member.id}`}
                                                            className="h-8 px-2 text-xs font-semibold inline-flex items-center gap-1 text-zinc-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg cursor-pointer transition-colors"
                                                            title="Buka Scan & Riwayat Klaim User"
                                                        >
                                                            <UserCheck className="size-3.5" />
                                                            Klaim
                                                        </Link>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setSelectedMember(member)}
                                                            className="h-8 px-2.5 text-xs text-zinc-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer"
                                                        >
                                                            <Eye className="size-3.5 mr-1" />
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
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs p-6 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
                            <div>
                                <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Gift className="size-5 text-red-600" />
                                    Pusat Verifikasi & Log Penukaran Reward
                                </h2>
                                <p className="text-xs text-zinc-500">
                                    Daftar penukaran reward member Honda. Verifikasi status hold untuk menyerahkan hadiah langsung kepada pelanggan
                                </p>
                            </div>

                            {/* Claim Status Filters */}
                            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs">
                                <button
                                    type="button"
                                    onClick={() => setClaimsFilter('all')}
                                    className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${claimsFilter === 'all'
                                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                                        : 'text-zinc-600 dark:text-zinc-400'
                                        }`}
                                >
                                    Semua ({recentClaims.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setClaimsFilter('hold')}
                                    className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${claimsFilter === 'hold'
                                        ? 'bg-amber-500 text-white shadow-xs'
                                        : 'text-zinc-600 dark:text-zinc-400'
                                        }`}
                                >
                                    Menunggu Hold ({stats.pendingHoldClaims})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setClaimsFilter('claimed')}
                                    className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${claimsFilter === 'claimed'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'text-zinc-600 dark:text-zinc-400'
                                        }`}
                                >
                                    Selesai ({stats.completedClaims})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setClaimsFilter('rejected')}
                                    className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${claimsFilter === 'rejected'
                                        ? 'bg-red-600 text-white shadow-xs'
                                        : 'text-zinc-600 dark:text-zinc-400'
                                        }`}
                                >
                                    Ditolak
                                </button>
                            </div>
                        </div>

                        {filteredClaims.length === 0 ? (
                            <div className="py-16 text-center text-zinc-400 space-y-2">
                                <Gift className="size-10 mx-auto text-zinc-300 dark:text-zinc-700" />
                                <p className="text-sm font-medium">Tidak ada data penukaran reward dengan filter ini.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {filteredClaims.map((claim) => (
                                    <div
                                        key={claim.id}
                                        className="p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 flex flex-col justify-between space-y-4 hover:border-red-400 dark:hover:border-red-900/60 hover:shadow-sm transition-all"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="font-mono text-xs font-bold">
                                                        #{claim.id}
                                                    </Badge>
                                                    <span className="text-[11px] text-zinc-400">
                                                        {claim.created_at}
                                                    </span>
                                                </div>

                                                {renderClaimStatusBadge(claim.status)}
                                            </div>

                                            <div className="flex items-start gap-3.5">
                                                <div className="size-14 rounded-2xl bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                                                    {claim.reward_image ? (
                                                        <img
                                                            src={claim.reward_image}
                                                            alt={claim.reward_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                                            <Gift className="size-6" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-black text-base text-zinc-900 dark:text-zinc-100 truncate">
                                                        {claim.reward_name}
                                                    </h3>
                                                    <p className="text-xs text-zinc-500 mt-0.5">
                                                        Member: <strong className="text-zinc-800 dark:text-zinc-200">{claim.user_name}</strong> (#{claim.user_id})
                                                    </p>
                                                    <p className="text-[11px] text-zinc-400 truncate">
                                                        {claim.user_email} &bull; {claim.user_phone}
                                                    </p>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <span className="text-xs font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/40">
                                                        -{claim.points_cost} PTS
                                                    </span>
                                                </div>
                                            </div>

                                            {claim.admin_notes && (
                                                <div className="text-[11px] p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 text-zinc-500 italic">
                                                    Catatan Admin: {claim.admin_notes} ({claim.admin_name})
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-2 border-t border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setInspectedClaim(claim)}
                                                className="text-xs h-9 rounded-xl border-zinc-300 dark:border-zinc-700"
                                            >
                                                <Eye className="size-3.5 mr-1.5" />
                                                Detail Klaim
                                            </Button>

                                            {claim.status === 'hold' ? (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        disabled={processingClaimId === claim.id}
                                                        onClick={() => handleApproveClaim(claim)}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 rounded-xl font-bold cursor-pointer"
                                                    >
                                                        <Check className="size-4 mr-1" />
                                                        Setujui
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        disabled={processingClaimId === claim.id}
                                                        onClick={() => handleRejectClaim(claim)}
                                                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs h-9 px-3 rounded-xl cursor-pointer"
                                                    >
                                                        Tolak
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-zinc-400 font-mono">
                                                    Diproses oleh: {claim.admin_name}
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
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs p-6 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
                            <div>
                                <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <History className="size-5 text-red-600" />
                                    Log Riwayat Transaksi Scan & Pemberian Poin
                                </h2>
                                <p className="text-xs text-zinc-500">
                                    Pencatatan aktual dari pemindaian barcode member dan pemberian reward loyalitas servis/pembelian AHASS
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link
                                    href="/admin/scan"
                                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold gap-1.5 h-9 px-3.5 rounded-xl cursor-pointer inline-flex items-center shadow-md shadow-red-600/20"
                                >
                                    <QrCode className="size-4" />
                                    Buka Scanner Poin
                                </Link>
                                <Link
                                    href="/admin/activities"
                                    className="border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold gap-1.5 h-9 px-3 rounded-xl cursor-pointer inline-flex items-center hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                >
                                    <ActivityIcon className="size-4" />
                                    Kelola Aktivitas
                                </Link>
                            </div>
                        </div>

                        {recentScans.length === 0 ? (
                            <div className="py-16 text-center text-zinc-400 space-y-2">
                                <History className="size-10 mx-auto text-zinc-300 dark:text-zinc-700" />
                                <p className="text-sm font-medium">Belum ada riwayat transaksi scan poin di database.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-zinc-50 dark:bg-zinc-950/60 text-zinc-500 font-bold border-b border-zinc-200 dark:border-zinc-800">
                                        <tr>
                                            <th className="py-3.5 px-4">ID Transaksi</th>
                                            <th className="py-3.5 px-4">Nama Aktivitas</th>
                                            <th className="py-3.5 px-4">Poin Dikreditkan</th>
                                            <th className="py-3.5 px-4">Member Penerima</th>
                                            <th className="py-3.5 px-4">Petugas / Admin</th>
                                            <th className="py-3.5 px-4">Waktu Transaksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                        {recentScans.map((scan) => (
                                            <tr
                                                key={scan.id}
                                                className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                                            >
                                                <td className="py-3.5 px-4 font-mono font-bold text-zinc-600 dark:text-zinc-400">
                                                    #{scan.id}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                                        {scan.activity_name}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-black text-amber-600 dark:text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                                                        +{scan.points} PTS
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                                                        {scan.user_name}
                                                    </div>
                                                    <span className="font-mono text-[10px] text-zinc-400">
                                                        ID: #{scan.user_id}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                                                    {scan.admin_name}
                                                </td>
                                                <td className="py-3.5 px-4 text-zinc-500 whitespace-nowrap">
                                                    {scan.created_at} ({scan.time_ago})
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Gift className="size-5 text-red-600" />
                                    Katalog Reward Loyalitas Honda (Database)
                                </h2>
                                <p className="text-xs text-zinc-500">
                                    Daftar hadiah, voucher servis AHASS, merchandise, dan sparepart yang dapat ditukarkan member
                                </p>
                            </div>

                            <Link
                                href="/admin/rewards"
                                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold gap-2 h-10 px-4 rounded-xl cursor-pointer shadow-md shadow-red-600/20 inline-flex items-center justify-center"
                            >
                                <Plus className="size-4" />
                                Kelola & Tambah Reward Baru
                            </Link>
                        </div>

                        {rewards.length === 0 ? (
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-16 text-center text-zinc-400 space-y-3">
                                <Gift className="size-12 mx-auto text-zinc-300 dark:text-zinc-600" />
                                <p className="text-sm font-semibold">Belum ada reward yang dibuat di database.</p>
                                <Link
                                    href="/admin/rewards"
                                    className="inline-flex items-center text-xs font-bold text-red-600 hover:underline"
                                >
                                    Tambah reward sekarang &rarr;
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                {rewards.map((reward) => (
                                    <div
                                        key={reward.id}
                                        className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col group"
                                    >
                                        <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                            {reward.image_url ? (
                                                <img
                                                    src={reward.image_url}
                                                    alt={reward.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                                    <Gift className="size-8" />
                                                </div>
                                            )}
                                            <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-xl text-xs font-black shadow-md">
                                                {reward.points_cost} PTS
                                            </div>
                                            <div className="absolute top-3 left-3">
                                                {reward.is_active ? (
                                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500 text-white shadow-xs">
                                                        Aktif
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-zinc-700 text-zinc-200">
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-mono font-bold text-zinc-400 block">
                                                    #{reward.id}
                                                </span>
                                                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-snug group-hover:text-red-600 transition-colors">
                                                    {reward.name}
                                                </h3>
                                                {reward.description && (
                                                    <p className="text-xs text-zinc-500 line-clamp-2">
                                                        {reward.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs flex items-center justify-between">
                                                <div>
                                                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">Stok Sisa</span>
                                                    <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                                                        {reward.stock} unit
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">Ditukarkan</span>
                                                    <span className="font-bold text-emerald-600 font-mono">
                                                        {reward.claimed_count} kali
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
                        <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xs">
                            <div className="absolute -right-16 -top-16 size-64 bg-red-600/5 dark:bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="relative z-10 max-w-4xl space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                                    <Calculator className="size-3.5" />
                                    Pedoman Resmi Sistem Loyalitas Honda AHASS
                                </div>
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                                        Kebijakan Poin, Tingkatan Member & Standar Operasional AHASS
                                    </h2>
                                    <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                                        Panduan operasional resmi untuk kasir, service advisor, dan manajemen bengkel AHASS. Menjelaskan logika penentuan 5 tingkatan member, arsitektur poin ganda (Saldo Likuid vs Akumulasi Seumur Hidup), standar operasional scanner kasir, serta mekanisme proteksi transaksi reward.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2">
                                    <Badge variant="outline" className="text-xs font-semibold px-3 py-1 bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700">
                                        <Layers className="size-3 mr-1.5 text-red-600" />
                                        5 Tingkatan Member (Bronze – Diamond)
                                    </Badge>
                                    <Badge variant="outline" className="text-xs font-semibold px-3 py-1 bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700">
                                        <Coins className="size-3 mr-1.5 text-emerald-600" />
                                        Dual-Point (Saldo Aktif vs Lifetime)
                                    </Badge>
                                    <Badge variant="outline" className="text-xs font-semibold px-3 py-1 bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700">
                                        <Database className="size-3 mr-1.5 text-blue-600" />
                                        Proteksi Transaksional ACID (Auto-Refund)
                                    </Badge>
                                    <Badge variant="outline" className="text-xs font-semibold px-3 py-1 bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700">
                                        <ShieldCheck className="size-3 mr-1.5 text-purple-600" />
                                        Verifikasi Email & 2FA Terproteksi
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 1: 5 MEMBER TIERS ROADMAP */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
                                <div>
                                    <h3 className="text-base md:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                        <Layers className="size-5 text-red-600" />
                                        1. Roadmap & Spesifikasi 5 Tingkatan Member (Member Tier)
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        Tingkatan loyalitas dihitung otomatis dari akumulasi total poin seumur hidup (<code className="font-mono text-zinc-700 dark:text-zinc-300">lifetime_points</code>).
                                    </p>
                                </div>
                                <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
                                    <Sparkles className="size-3 mr-1 text-emerald-500" /> Tier Tidak Pernah Turun
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                {/* Bronze Tier */}
                                <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col justify-between space-y-3">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                                <Shield className="size-3 text-amber-700" /> BRONZE
                                            </span>
                                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Level 1</span>
                                        </div>
                                        <div>
                                            <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">0 – 499 <span className="text-xs font-semibold text-zinc-500">Pts</span></div>
                                            <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300">Member Baru (Default)</div>
                                        </div>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                            Akses perolehan poin rewards di seluruh AHASS dan dealer resmi Honda melalui scan QR ID member saat servis berkala.
                                        </p>
                                    </div>
                                    <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 text-[10px] font-medium text-zinc-500">
                                        Status awal pendaftaran akun
                                    </div>
                                </div>

                                {/* Silver Tier */}
                                <div className="p-4 rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col justify-between space-y-3">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                                                <Shield className="size-3 text-slate-500" /> SILVER
                                            </span>
                                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Level 2</span>
                                        </div>
                                        <div>
                                            <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">500 – 1.499 <span className="text-xs font-semibold text-zinc-500">Pts</span></div>
                                            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Member Aktif</div>
                                        </div>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                            Akses katalog voucher oli MPX, diskon servis berkala reguler, dan penukaran merchandise standar Honda.
                                        </p>
                                    </div>
                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] font-medium text-zinc-500">
                                        Butuh min. 500 Pts kumulatif
                                    </div>
                                </div>

                                {/* Gold Tier */}
                                <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-700/50 bg-yellow-50/40 dark:bg-yellow-950/20 flex flex-col justify-between space-y-3">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-300 border border-yellow-400 dark:border-yellow-700">
                                                <Award className="size-3 text-amber-500" /> GOLD
                                            </span>
                                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Level 3</span>
                                        </div>
                                        <div>
                                            <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">1.500 – 3.499 <span className="text-xs font-semibold text-zinc-500">Pts</span></div>
                                            <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300">Member Loyal</div>
                                        </div>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                            Prioritas booking servis AHASS, diskon suku cadang & aksesori resmi Honda, serta voucher servis berkala spesial.
                                        </p>
                                    </div>
                                    <div className="pt-2 border-t border-yellow-200/60 dark:border-yellow-800/40 text-[10px] font-medium text-zinc-500">
                                        Butuh min. 1.500 Pts kumulatif
                                    </div>
                                </div>

                                {/* Platinum Tier */}
                                <div className="p-4 rounded-2xl border border-cyan-300 dark:border-cyan-800 bg-cyan-50/40 dark:bg-cyan-950/20 flex flex-col justify-between space-y-3">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 dark:bg-cyan-950/50 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700">
                                                <Sparkles className="size-3 text-cyan-500" /> PLATINUM
                                            </span>
                                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Level 4</span>
                                        </div>
                                        <div>
                                            <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">3.500 – 6.999 <span className="text-xs font-semibold text-zinc-500">Pts</span></div>
                                            <div className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300">Member Prioritas</div>
                                        </div>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                            Prioritas antrean servis AHASS (Fast Lane), tiket undian ganda Hari Pelanggan Nasional, dan voucher event eksklusif.
                                        </p>
                                    </div>
                                    <div className="pt-2 border-t border-cyan-200/60 dark:border-cyan-800/40 text-[10px] font-medium text-zinc-500">
                                        Butuh min. 3.500 Pts kumulatif
                                    </div>
                                </div>

                                {/* Diamond Tier */}
                                <div className="p-4 rounded-2xl border border-purple-300 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20 flex flex-col justify-between space-y-3">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                                                <Crown className="size-3 text-purple-500" /> DIAMOND
                                            </span>
                                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Level 5 (VIP)</span>
                                        </div>
                                        <div>
                                            <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">≥ 7.000 <span className="text-xs font-semibold text-zinc-500">Pts</span></div>
                                            <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300">Tingkat Tertinggi (VIP)</div>
                                        </div>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                            Layanan VIP AHASS, merchandise premium eksklusif Honda, dan undangan kehormatan event tahunan eksklusif Honda.
                                        </p>
                                    </div>
                                    <div className="pt-2 border-t border-purple-200/60 dark:border-purple-800/40 text-[10px] font-medium text-zinc-500">
                                        Tingkat loyalitas tertinggi
                                    </div>
                                </div>
                            </div>

                            {/* Note on tier retention */}
                            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 flex items-start gap-3">
                                <Info className="size-4 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                                    <strong>Prinsip Retensi Level Member:</strong> Penentuan tingkatan loyalitas member bersifat <em>monotonik meningkat (tidak pernah turun)</em>. Saat member menukarkan saldo reward untuk hadiah atau voucher, yang berkurang hanyalah <strong>Saldo Poin Aktif</strong> (<code className="font-mono font-bold">points</code>). Poin kumulatif seumur hidup (<code className="font-mono font-bold">lifetime_points</code>) tetap utuh, sehingga status Tier member tidak akan terdegradasi.
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: DUAL-POINT ARCHITECTURE */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
                            <div className="border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
                                <h3 className="text-base md:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Coins className="size-5 text-red-600" />
                                    2. Arsitektur Poin Ganda: Saldo Poin Aktif vs Poin Seumur Hidup
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    Sistem loyalitas memisahkan fungsi mata uang penukaran reward dari indikator peringkat reputasi servis member.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Card A: Saldo Poin Aktif */}
                                <div className="p-5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 rounded-xl bg-emerald-600 text-white">
                                                <Coins className="size-4" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Saldo Poin Aktif</h4>
                                                <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Column: users.points</span>
                                            </div>
                                        </div>
                                        <Badge className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 text-[10px] font-bold">
                                            DAPAT DIBELANJAKAN
                                        </Badge>
                                    </div>

                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        Merupakan saldo likuid poin digital milik member yang dapat ditukarkan dengan hadiah merchandise fisik, voucher oli MPX, dan kupon diskon servis di katalog.
                                    </p>

                                    <div className="space-y-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 text-xs">
                                        <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">(+) Masuk:</span>
                                            <span>Bertambah saat kasir AHASS memindai QR kartu member di menu Scan Poin (<code className="font-mono text-[11px]">/admin/scan</code>).</span>
                                        </div>
                                        <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                                            <span className="font-bold text-red-600 dark:text-red-400 shrink-0">(-) Debet:</span>
                                            <span>Terpotong otomatis saat member menukar hadiah di katalog online (status awal: <em>Hold</em>).</span>
                                        </div>
                                        <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                                            <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">(+) Refund:</span>
                                            <span>Dikembalikan utuh seketika ke member bila klaim ditolak atau dibatalkan oleh kasir/admin.</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card B: Poin Akumulasi Seumur Hidup */}
                                <div className="p-5 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 rounded-xl bg-purple-600 text-white">
                                                <TrendingUp className="size-4" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Total Poin Seumur Hidup</h4>
                                                <span className="font-mono text-[11px] text-purple-700 dark:text-purple-400 font-semibold">Column: users.lifetime_points</span>
                                            </div>
                                        </div>
                                        <Badge className="bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700 text-[10px] font-bold">
                                            PERMANEN & AUDIT
                                        </Badge>
                                    </div>

                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        Merupakan angka total seluruh poin yang pernah diperoleh member dari setiap kali transaksi servis atau pembelian suku cadang resmi di bengkel AHASS sejak mendaftar.
                                    </p>

                                    <div className="space-y-2 pt-2 border-t border-purple-200/60 dark:border-purple-900/40 text-xs">
                                        <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                                            <span className="font-bold text-purple-600 dark:text-purple-400 shrink-0">(+) Masuk:</span>
                                            <span>Bertambah bersamaan dengan saldo poin setiap kali servis AHASS berhasil diinput kasir.</span>
                                        </div>
                                        <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                                            <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">(=) Permanen:</span>
                                            <span><strong>TIDAK PERNAH DIKURANGI</strong> saat penukaran hadiah, belanja merchandise, atau penggunaan kupon.</span>
                                        </div>
                                        <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">(*) Acuan Tier:</span>
                                            <span>Satu-satunya metrik acuan sistem untuk menghitung level dan progres tier member Honda.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: 3 ALUR TRANSAKSI UTAMA KASIR AHASS */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
                            <div className="border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
                                <h3 className="text-base md:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <ActivityIcon className="size-5 text-red-600" />
                                    3. Standar Operasional Prosedur: 3 Alur Transaksi Utama Kasir AHASS
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    Prosedur baku penanganan sistem reward loyalitas pada konter kasir dan meja service advisor AHASS.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                {/* Alur 1 */}
                                <div className="p-5 rounded-2xl bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="size-7 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-xs">
                                            1
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                                            /admin/scan
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-sm text-red-900 dark:text-red-200">
                                        Pemberian Poin Servis Kasir AHASS
                                    </h4>
                                    <ol className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 list-decimal pl-4 leading-relaxed">
                                        <li>
                                            <strong>Scan Kartu Member:</strong> Kasir memindai QR Member pada aplikasi pelanggan atau mencari lewat Nomor Polisi / ID Member di halaman Scan Poin.
                                        </li>
                                        <li>
                                            <strong>Pilih Aktivitas:</strong> Kasir memilih pekerjaan servis yang telah selesai (Servis Lengkap, Ganti Oli MPX/SPX, dll.) yang nominal poinnya telah terstandarisasi.
                                        </li>
                                        <li>
                                            <strong>Kredit Instan:</strong> Poin otomatis ditambahkan ke Saldo Poin Aktif (<code className="font-mono text-[11px]">points</code>) dan Akumulasi Lifetime (<code className="font-mono text-[11px]">lifetime_points</code>).
                                        </li>
                                    </ol>
                                </div>

                                {/* Alur 2 */}
                                <div className="p-5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="size-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-black text-xs">
                                            2
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                            /admin/scan-user
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                                        Penukaran & Serah Terima Reward
                                    </h4>
                                    <ol className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 list-decimal pl-4 leading-relaxed">
                                        <li>
                                            <strong>Member Redeem:</strong> Member menukarkan hadiah di aplikasi. Saldo poin aktif langsung dipotong, status awal klaim tercatat sebagai <strong className="text-amber-600 dark:text-amber-400">Hold</strong>, dan kuota stok berkurang.
                                        </li>
                                        <li>
                                            <strong>Verifikasi Counter:</strong> Member datang ke AHASS menunjukkan QR Klaim. Kasir membuka menu Scan User atau daftar klaim dashboard.
                                        </li>
                                        <li>
                                            <strong>Serah Terima Fisik:</strong> Kasir mencocokkan identitas dan fisik barang/voucher, lalu klik <strong className="text-emerald-600 dark:text-emerald-400">"Verifikasi & Serahkan"</strong> &rarr; status berubah <strong className="text-emerald-600 dark:text-emerald-400">Claimed</strong>.
                                        </li>
                                    </ol>
                                </div>

                                {/* Alur 3 */}
                                <div className="p-5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="size-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                                            3
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                            Auto-Rollback
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-sm text-blue-900 dark:text-blue-200">
                                        Penolakan Klaim & Refund Poin Otomatis
                                    </h4>
                                    <ol className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 list-decimal pl-4 leading-relaxed">
                                        <li>
                                            <strong>Indikasi Pembatalan:</strong> Terjadi jika pelanggan salah memilih reward, stok fisik di bengkel mendadak rusak/kosong, atau klaim tidak valid.
                                        </li>
                                        <li>
                                            <strong>Tindakan Kasir/Admin:</strong> Petugas menekan tombol <strong className="text-red-600 dark:text-red-400">"Tolak Klaim"</strong> pada dashboard atau modal rincian penukaran reward.
                                        </li>
                                        <li>
                                            <strong>Pemulihan Atomik:</strong> Status klaim berubah <strong className="text-red-600 dark:text-red-400">Rejected</strong>. Sistem mengembalikan saldo poin aktif penuh ke member dan memulihkan stok reward di katalog.
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 4: SECURITY & DATA INTEGRITY */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
                            <div className="border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
                                <h3 className="text-base md:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <ShieldCheck className="size-5 text-red-600" />
                                    4. Arsitektur Keamanan & Integritas Data Sistem
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    Standar keamanan berlapis untuk menjaga integritas saldo poin, verifikasi pelanggan sah, dan ketertelusuran log.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                        <Database className="size-4 text-blue-600 shrink-0" />
                                        Integritas Transaksi Atomik (ACID)
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        Setiap mutasi poin (pemberian poin servis, penukaran hadiah, penolakan klaim) dijalankan dalam transaksi database terisolasi (<code className="font-mono text-[11px]">DB::transaction</code>) dengan kunci baris untuk mencegah race-condition dan double-spending poin.
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                        <Mail className="size-4 text-amber-600 shrink-0" />
                                        Verifikasi Email Wajib
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        Member diwajibkan memverifikasi alamat email aktif mereka sebelum sistem mengizinkan penukaran poin atau klaim voucher di katalog AHASS guna mencegah pembuatan akun palsu atau penyalahgunaan nomor rangka motor.
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                        <Lock className="size-4 text-emerald-600 shrink-0" />
                                        Autentikasi Ganda (2FA TOTP & Email OTP)
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        Dilengkapi proteksi autentikasi 2-faktor berstandar tinggi: aplikasi authenticator TOTP (Google/Microsoft Authenticator) dan kode OTP 6-digit via Email SMTP resmi Honda untuk perlindungan akun staf kasir, admin, dan member.
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                        <Shield className="size-4 text-purple-600 shrink-0" />
                                        Pemisahan Peran & Otoritas (RBAC Guard)
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        Hak akses scanner kasir AHASS, verifikasi serah terima hadiah, serta manajemen stok reward dipagari ketat untuk role <code className="font-mono text-[11px] font-bold">admin</code>. Member customer hanya memiliki izin akses data personal dan penukaran poin miliknya sendiri.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 5: QUICK ACTIONS NAVIGATION */}
                        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 space-y-4">
                            <div>
                                <h3 className="text-sm md:text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Zap className="size-4 text-red-600" />
                                    Pintasan Cepat Menu Operasional Kasir & Admin AHASS
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    Akses cepat ke alat pemindaian, manajemen katalog aktivitas servis, dan katalog reward.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <Link
                                    href="/admin/scan"
                                    className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-500 hover:shadow-xs transition-all flex items-center gap-3 group"
                                >
                                    <div className="size-10 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors shrink-0">
                                        <QrCode className="size-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 transition-colors">Scan Poin AHASS</h4>
                                        <p className="text-[11px] text-zinc-500 truncate">Kreditkan poin servis member</p>
                                    </div>
                                </Link>

                                <Link
                                    href="/admin/scan-user"
                                    className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 hover:shadow-xs transition-all flex items-center gap-3 group"
                                >
                                    <div className="size-10 rounded-xl bg-amber-600/10 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors shrink-0">
                                        <UserCheck className="size-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 transition-colors">Scan User & Klaim</h4>
                                        <p className="text-[11px] text-zinc-500 truncate">Verifikasi serah terima hadiah</p>
                                    </div>
                                </Link>

                                <Link
                                    href="/admin/activities"
                                    className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 hover:shadow-xs transition-all flex items-center gap-3 group"
                                >
                                    <div className="size-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                                        <ActivityIcon className="size-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors">Katalog Aktivitas</h4>
                                        <p className="text-[11px] text-zinc-500 truncate">Atur nominal poin servis AHASS</p>
                                    </div>
                                </Link>

                                <Link
                                    href="/admin/rewards"
                                    className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 hover:shadow-xs transition-all flex items-center gap-3 group"
                                >
                                    <div className="size-10 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                                        <Gift className="size-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 transition-colors">Katalog Reward</h4>
                                        <p className="text-[11px] text-zinc-500 truncate">Kelola stok & poin hadiah</p>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Detail Member */}
            <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
                <DialogContent className="sm:max-w-md rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                            <div className="size-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
                                <Users className="size-4" />
                            </div>
                            Detail Profil Member Honda
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Informasi identitas akun loyalitas pelanggan dari database
                        </DialogDescription>
                    </DialogHeader>

                    {selectedMember && (
                        <div className="space-y-4 py-2 text-xs">
                            {/* Digital Card Preview */}
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-red-950 text-white shadow-md relative overflow-hidden border border-zinc-700/50">
                                <div className="absolute top-3 right-3 opacity-20">
                                    <img src="/images/logo/honda_logo_white.png" alt="Honda" className="w-16 h-auto" />
                                </div>
                                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                                    Honda Rewards Member ID
                                </span>
                                <div className="font-mono text-xl font-black tracking-widest text-red-400 mt-0.5">
                                    #{selectedMember.id}
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs">
                                    <div>
                                        <span className="text-[10px] text-zinc-400 block">NAMA LENGKAP</span>
                                        <span className="font-bold text-sm text-white">{selectedMember.name}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {renderTierBadge(selectedMember.tier)}
                                        <Badge
                                            variant={selectedMember.role === 'admin' ? 'destructive' : 'secondary'}
                                            className="uppercase text-[9px] font-bold"
                                        >
                                            {selectedMember.role}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-2.5 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-400">Saldo Poin Aktif:</span>
                                    <span className="font-mono font-black text-amber-600 text-sm">
                                        {selectedMember.points.toLocaleString('id-ID')} PTS
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-400">Total Akumulasi (Lifetime):</span>
                                    <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                        {selectedMember.lifetime_points.toLocaleString('id-ID')} PTS
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
                                    <span className="text-zinc-400">Email:</span>
                                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedMember.email}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-400">Nomor Telepon:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{selectedMember.phone_number}</span>
                                        {selectedMember.phone_number && selectedMember.phone_number !== '-' && (
                                            <a
                                                href={`https://wa.me/${selectedMember.phone_number.replace(/^0/, '62')}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-emerald-600 font-bold hover:underline inline-flex items-center gap-1"
                                            >
                                                <MessageCircle className="size-3" /> WA
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
                                    <span className="text-zinc-400 block mb-0.5">Alamat Domisili:</span>
                                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{selectedMember.address}</span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
                                    <span className="text-zinc-400">Status Email:</span>
                                    <span className={selectedMember.is_verified ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                                        {selectedMember.is_verified ? 'Terverifikasi' : 'Belum Verifikasi'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-400">Tanggal Terdaftar:</span>
                                    <span className="text-zinc-600 dark:text-zinc-400 font-mono">{selectedMember.joined_at}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0 flex-wrap">
                        {selectedMember && (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    onClick={() => handleCopy(selectedMember.id, 'ID Member')}
                                    className="text-xs h-9 rounded-xl flex-1 sm:flex-initial"
                                >
                                    <Copy className="size-3.5 mr-1" /> Salin ID
                                </Button>
                                <Link
                                    href={`/admin/scan-user?search=${selectedMember.id}`}
                                    className="inline-flex items-center justify-center text-xs h-9 rounded-xl px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                                >
                                    <UserCheck className="size-3.5 mr-1" /> Klaim User
                                </Link>
                            </div>
                        )}
                        <Button
                            onClick={() => setSelectedMember(null)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs h-9 rounded-xl w-full sm:w-auto"
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Detail Klaim Reward (Claim Inspection) */}
            <Dialog open={!!inspectedClaim} onOpenChange={() => setInspectedClaim(null)}>
                <DialogContent className="sm:max-w-lg rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                            <div className="size-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                                <Gift className="size-4" />
                            </div>
                            Detail Klaim Penukaran Reward Member
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Verifikasi data penukaran reward dan serahkan hadiah fisik kepada pelanggan
                        </DialogDescription>
                    </DialogHeader>

                    {inspectedClaim && (
                        <div className="space-y-4 py-2 text-xs">
                            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
                                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                                    <div className="font-bold text-red-600">REKOR KLAIM REWARD HONDA</div>
                                    <div className="text-[11px] text-zinc-500 font-mono">#{inspectedClaim.id}</div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="size-14 rounded-xl bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                                        {inspectedClaim.reward_image ? (
                                            <img
                                                src={inspectedClaim.reward_image}
                                                alt={inspectedClaim.reward_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                                <Gift className="size-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm text-zinc-900 dark:text-zinc-100">
                                            {inspectedClaim.reward_name}
                                        </h4>
                                        <p className="text-[11px] text-red-600 font-mono font-bold mt-0.5">
                                            Biaya Poin: -{inspectedClaim.points_cost} PTS
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                    <div>
                                        <span className="text-zinc-400 block text-[9px] uppercase font-bold">NAMA MEMBER</span>
                                        <span className="font-bold">{inspectedClaim.user_name}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-400 block text-[9px] uppercase font-bold">ID MEMBER</span>
                                        <span className="font-bold font-mono">#{inspectedClaim.user_id}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-400 block text-[9px] uppercase font-bold">EMAIL MEMBER</span>
                                        <span className="text-zinc-600 dark:text-zinc-400">{inspectedClaim.user_email}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-400 block text-[9px] uppercase font-bold">NO. TELEPON</span>
                                        <span className="font-mono text-zinc-600 dark:text-zinc-400">{inspectedClaim.user_phone}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-zinc-400 block text-[9px] uppercase font-bold">ALAMAT DOMISILI</span>
                                        <span className="text-zinc-600 dark:text-zinc-400">{inspectedClaim.user_address}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-400 block text-[9px] uppercase font-bold">TANGGAL PENUKARAN</span>
                                        <span className="text-zinc-600 dark:text-zinc-400">{inspectedClaim.created_at}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-400 block text-[9px] uppercase font-bold">STATUS KLAIM</span>
                                        <div className="mt-0.5">{renderClaimStatusBadge(inspectedClaim.status)}</div>
                                    </div>
                                </div>

                                {inspectedClaim.admin_notes && (
                                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-[11px]">
                                        <span className="text-zinc-400 block text-[9px] uppercase font-bold">CATATAN ADMIN</span>
                                        <p className="text-zinc-600 dark:text-zinc-400 italic">
                                            {inspectedClaim.admin_notes} (Oleh: {inspectedClaim.admin_name})
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
                                    disabled={processingClaimId === inspectedClaim.id}
                                    onClick={() => handleApproveClaim(inspectedClaim)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 rounded-xl font-bold flex-1"
                                >
                                    <Check className="size-4 mr-1.5" />
                                    Setujui Penyerahan Hadiah
                                </Button>
                                <Button
                                    variant="outline"
                                    disabled={processingClaimId === inspectedClaim.id}
                                    onClick={() => handleRejectClaim(inspectedClaim)}
                                    className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-9 rounded-xl"
                                >
                                    Tolak & Kembalikan Poin
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={() => setInspectedClaim(null)}
                                className="bg-zinc-800 hover:bg-zinc-900 text-white text-xs h-9 rounded-xl w-full"
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
