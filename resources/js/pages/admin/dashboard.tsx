import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowRight,
    Award,
    Building2,
    Calculator,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Coins,
    Copy,
    Download,
    ExternalLink,
    Eye,
    FileText,
    Filter,
    Flame,
    Gift,
    HelpCircle,
    History,
    Info,
    LayoutDashboard,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    Plus,
    QrCode,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    ShoppingBag,
    Smartphone,
    Sparkles,
    Star,
    Tag,
    Trash2,
    TrendingUp,
    UserCheck,
    Users,
    Wrench,
    X,
    XCircle,
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
    is_verified: boolean;
    joined_at: string;
};

type Voucher = {
    id: string;
    title: string;
    category: string;
    points_required: number;
    stock: number;
    claimed: number;
    status: string;
    image: string;
};

type PointClaim = {
    id: string;
    transaction_code?: string;
    member_name: string;
    member_id: string;
    phone_number?: string;
    merchant_name: string;
    transaction_type: string;
    transaction_amount: number;
    points_claimed: number;
    status: 'pending' | 'approved' | 'rejected';
    date: string;
    notes?: string;
};

type ClaimCategory = {
    category: string;
    count: number;
    percentage: number;
    badge: string;
};

type AhassBranch = {
    code: string;
    name: string;
    city: string;
    active_services: number;
    rating: number;
};

type Props = {
    stats: {
        totalMembers: number;
        totalAdmins: number;
        verifiedRate: number;
        newMembersThisWeek: number;
        totalPointsCirculating: number;
        totalPointsRedeemed: number;
        activeVouchersCount: number;
        pendingServiceClaims: number;
        satisfactionRate: number;
    };
    recentMembers: Member[];
    vouchers: Voucher[];
    pointClaims: PointClaim[];
    claimCategories?: ClaimCategory[];
    ahassBranches?: AhassBranch[];
};

export default function AdminDashboard({
    stats,
    recentMembers = [],
    vouchers = [],
    pointClaims = [],
    claimCategories = [],
    ahassBranches = [],
}: Props) {
    const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'claims' | 'vouchers' | 'policy'>('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
    const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
    const [claimsFilter, setClaimsFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    const [claims, setClaims] = useState<PointClaim[]>(pointClaims);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [inspectedClaim, setInspectedClaim] = useState<PointClaim | null>(null);
    const [voucherList, setVoucherList] = useState<Voucher[]>(vouchers);
    const [newVoucherModal, setNewVoucherModal] = useState(false);

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
        if (claimsFilter === 'all') return claims;
        return claims.filter((c) => c.status === claimsFilter);
    }, [claims, claimsFilter]);

    // Handle Approve Claim
    const handleApproveClaim = (claimId: string, memberName: string, points: number) => {
        setClaims((prev) =>
            prev.map((c) => (c.id === claimId ? { ...c, status: 'approved' as const } : c))
        );
        if (inspectedClaim && inspectedClaim.id === claimId) {
            setInspectedClaim((prev) => (prev ? { ...prev, status: 'approved' as const } : null));
        }
        toast.success(`Klaim poin untuk ${memberName} berhasil disetujui. +${points} Poin telah dikreditkan ke e-wallet member!`);
    };

    // Handle Reject Claim
    const handleRejectClaim = (claimId: string, memberName: string) => {
        setClaims((prev) =>
            prev.map((c) => (c.id === claimId ? { ...c, status: 'rejected' as const } : c))
        );
        if (inspectedClaim && inspectedClaim.id === claimId) {
            setInspectedClaim((prev) => (prev ? { ...prev, status: 'rejected' as const } : null));
        }
        toast.error(`Klaim poin untuk ${memberName} telah ditolak.`);
    };

    // Copy to clipboard helper
    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} berhasil disalin ke clipboard.`);
    };

    const pendingClaimsCount = claims.filter((c) => c.status === 'pending').length;

    return (
        <>
            <Head title="Admin Console - Honda Customer Rewards" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Top Executive Banner */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 bg-gradient-to-r from-red-600 via-red-700 to-zinc-950 text-white p-6 md:p-8 rounded-3xl shadow-xl shadow-red-950/20 relative overflow-hidden">
                    {/* Watermark Logo */}
                    <div className="absolute -right-8 -bottom-10 opacity-15 pointer-events-none select-none">
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
                                Sistem Loyalty Terpisah & Terverifikasi
                            </span>
                            <span className="text-xs text-red-200/90 font-mono">v2.5 Pro</span>
                        </div>

                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                            Portal Administrasi Loyalty & Verifikasi Poin
                        </h1>
                        <p className="text-xs md:text-sm text-red-100/90 leading-relaxed">
                            Pusat pemantauan aktivitas loyalitas Honda & AHASS, pencatatan transaksi poin, database pengguna terdaftar, dan pengelolaan katalog reward.
                        </p>
                    </div>

                    <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-white text-red-700 hover:bg-red-50 active:scale-95 transition-all shadow-md cursor-pointer"
                        >
                            <Smartphone className="size-4 text-red-600" />
                            Tampilan Member E-Wallet
                        </Link>
                        <Link
                            href="/admin/scan"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-black/30 hover:bg-black/50 border border-white/30 text-white active:scale-95 transition-all shadow-md cursor-pointer"
                        >
                            <QrCode className="size-4 text-amber-300" />
                            Scan / Input Poin
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
                                Total Member Honda
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
                                    +{stats.newMembersThisWeek} baru
                                </span>
                                <span className="text-zinc-400">&bull;</span>
                                <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                                    {stats.verifiedRate}% Terverifikasi
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Metric 2: Poin Beredar */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-2xl shadow-xs hover:border-red-500/40 hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                Poin Loyalitas Beredar
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
                                <span className="text-emerald-600 font-semibold text-[11px]">Nilai: Rp 34,8 Jt</span>
                            </div>
                        </div>
                    </div>

                    {/* Metric 3: Log Transaksi Poin */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-2xl shadow-xs hover:border-red-500/40 hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                Transaksi Poin Masuk
                            </span>
                            <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                                <History className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                                <span>{claims.length}</span>
                                {pendingClaimsCount > 0 ? (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/50">
                                        Perlu Validasi
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                                        Tuntas
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                <span>Total <strong>{claims.length} transaksi poin</strong> tercatat</span>
                            </div>
                        </div>
                    </div>

                    {/* Metric 4: Kepuasan & Voucher */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-2xl shadow-xs hover:border-red-500/40 hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                Program & Kepuasan
                            </span>
                            <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                                <Gift className="size-5 text-purple-600" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {voucherList.length}{' '}
                                <span className="text-sm font-bold text-zinc-500">Reward</span>
                            </div>
                            <div className="flex items-center justify-between mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                <span>CSAT Loyalitas {stats.satisfactionRate}%</span>
                                <span className="text-purple-600 dark:text-purple-400 font-semibold">Aktif</span>
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
                            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                                activeTab === 'overview'
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
                            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                                activeTab === 'members'
                                    ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <Users className="size-4" />
                            Database Member
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/20 text-white font-mono">
                                {recentMembers.length}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('claims')}
                            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                                activeTab === 'claims'
                                    ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <History className="size-4" />
                            Log Transaksi Poin
                            {pendingClaimsCount > 0 && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-black animate-pulse">
                                    {pendingClaimsCount}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('vouchers')}
                            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                                activeTab === 'vouchers'
                                    ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <Gift className="size-4" />
                            Katalog Voucher
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/20 text-white font-mono">
                                {voucherList.length}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('policy')}
                            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                                activeTab === 'policy'
                                    ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <Calculator className="size-4" />
                            Aturan & Keamanan Poin
                        </button>
                    </div>

                    {/* Quick Search */}
                    <div className="relative w-full md:w-72 shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                        <Input
                            type="text"
                            placeholder="Cari nama, email, no. HP, ID..."
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
                        {pendingClaimsCount > 0 && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                                        <History className="size-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">
                                            {pendingClaimsCount} Transaksi Poin Menunggu Validasi Petugas
                                        </h4>
                                        <p className="text-xs text-amber-800/90 dark:text-amber-300">
                                            Terdapat transaksi pemberian poin reward yang dapat ditinjau dan disetujui langsung oleh Administrator.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => setActiveTab('claims')}
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl h-9 px-4 shrink-0 shadow-xs cursor-pointer"
                                >
                                    Tinjau Transaksi
                                    <ArrowRight className="size-3.5 ml-1.5" />
                                </Button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Col (2 Span): Claims Queue & Categories */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
                                    <div className="flex items-center justify-between mb-5">
                                        <div>
                                            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                                <History className="size-4 text-red-600" />
                                                Antrean Verifikasi Transaksi Poin
                                            </h2>
                                            <p className="text-xs text-zinc-500">
                                                Daftar pencatatan transaksi pemberian poin dari member AHASS yang menunggu validasi admin
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('claims')}
                                            className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                                        >
                                            Buka Semua ({claims.length})
                                            <ArrowRight className="size-3" />
                                        </button>
                                    </div>

                                    <div className="space-y-3.5">
                                        {claims.slice(0, 3).map((claim) => (
                                            <div
                                                key={claim.id}
                                                className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-red-300 dark:hover:border-red-900/50 transition-all"
                                            >
                                                <div className="space-y-1.5">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-200/70 dark:bg-zinc-800 px-2 py-0.5 rounded">
                                                            {claim.id}
                                                        </span>
                                                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                                            {claim.member_name}
                                                        </span>
                                                        {claim.transaction_code && (
                                                            <Badge variant="outline" className="font-mono text-[10px]">
                                                                {claim.transaction_code}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="text-xs text-zinc-600 dark:text-zinc-300 flex flex-wrap items-center gap-2">
                                                        <span className="font-semibold text-red-600 dark:text-red-400">
                                                            {claim.transaction_type}
                                                        </span>
                                                        <span>&bull;</span>
                                                        <span>{claim.merchant_name}</span>
                                                    </div>

                                                    <div className="text-[11px] text-zinc-500 flex flex-wrap items-center gap-3">
                                                        <span>Nominal: <strong className="text-zinc-900 dark:text-zinc-100">Rp {claim.transaction_amount.toLocaleString('id-ID')}</strong></span>
                                                        <span>&bull;</span>
                                                        <span>{claim.date}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center md:flex-col md:items-end justify-between gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-200 dark:border-zinc-800">
                                                    <div className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                                                        +{claim.points_claimed} PTS
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

                                                        {claim.status === 'pending' ? (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleApproveClaim(
                                                                            claim.id,
                                                                            claim.member_name,
                                                                            claim.points_claimed
                                                                        )
                                                                    }
                                                                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 rounded-lg font-bold"
                                                                >
                                                                    <Check className="size-3.5 mr-1" />
                                                                    Setujui
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() =>
                                                                        handleRejectClaim(claim.id, claim.member_name)
                                                                    }
                                                                    className="h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 px-2.5 rounded-lg"
                                                                >
                                                                    Tolak
                                                                </Button>
                                                            </>
                                                        ) : claim.status === 'approved' ? (
                                                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border-none text-[11px] font-bold">
                                                                Disetujui
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="destructive" className="text-[11px] font-bold">
                                                                Ditolak
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Transaction Categories Breakdown */}
                                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                                                Kategori Transaksi Resmi Terpopuler
                                            </h3>
                                            <p className="text-xs text-zinc-500">
                                                Sebaran kategori layanan & transaksi yang dicatatkan member loyalitas
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {claimCategories.map((item, idx) => (
                                            <div key={idx} className="space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                                        {item.category}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[10px] py-0">
                                                            {item.badge}
                                                        </Badge>
                                                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                                            {item.count} klaim ({item.percentage}%)
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                                    <div
                                                        className="h-full bg-red-600 rounded-full transition-all duration-500"
                                                        style={{ width: `${item.percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Col: Recent Members & System Status */}
                            <div className="space-y-6">
                                {/* Recent Member registrations */}
                                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                                <Users className="size-4 text-red-600" />
                                                Pendaftar Member Terbaru
                                            </h3>
                                            <p className="text-xs text-zinc-500">Data registrasi pelanggan</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('members')}
                                            className="text-xs text-red-600 hover:text-red-700 font-bold cursor-pointer"
                                        >
                                            Lihat Semua
                                        </button>
                                    </div>

                                    <div className="space-y-3 flex-1">
                                        {recentMembers.slice(0, 4).map((member) => (
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
                                                    <div className="text-[11px] text-zinc-400 truncate">
                                                        {member.address}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    {member.is_verified ? (
                                                        <CheckCircle2 className="size-4 text-emerald-500" />
                                                    ) : (
                                                        <Clock className="size-4 text-amber-500" />
                                                    )}
                                                    <span className="text-[10px] text-zinc-400">
                                                        #{member.id.slice(-4)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Security & System Check */}
                                    <div className="mt-5 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2 text-xs">
                                        <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                            <ShieldCheck className="size-4 text-emerald-600" />
                                            Status Keamanan & Otentikasi
                                        </div>
                                        <div className="space-y-1 text-zinc-600 dark:text-zinc-400 text-[11px]">
                                            <div className="flex items-center justify-between">
                                                <span>Verifikasi Email Wajib:</span>
                                                <strong className="text-emerald-600 font-semibold">Aktif (Gmail SMTP)</strong>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Two-Factor Authentication:</span>
                                                <strong className="text-emerald-600 font-semibold">Email OTP + TOTP</strong>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Kontrol Akses Role:</span>
                                                <strong className="text-zinc-900 dark:text-zinc-100">User & Admin Guard</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Active AHASS Partners */}
                                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                            <Building2 className="size-4 text-red-600" />
                                            Jaringan Mitra Dealer & AHASS
                                        </h3>
                                        <span className="text-xs text-zinc-500">4 Mitra Resmi</span>
                                    </div>

                                    <div className="space-y-2.5">
                                        {ahassBranches.map((branch) => (
                                            <div
                                                key={branch.code}
                                                className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-xs"
                                            >
                                                <div>
                                                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                        {branch.name}
                                                    </div>
                                                    <div className="text-[11px] text-zinc-500">
                                                        {branch.city} &bull; {branch.active_services} klaim poin bulan ini
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                                                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                                                    <span>{branch.rating}</span>
                                                </div>
                                            </div>
                                        ))}
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
                                    Kelola {filteredMembers.length} pelanggan terdaftar dengan nomor kontak WhatsApp dan alamat lengkap
                                </p>
                            </div>

                            {/* Filters and export */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setRoleFilter('all')}
                                        className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-all ${
                                            roleFilter === 'all'
                                                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                                                : 'text-zinc-600 dark:text-zinc-400'
                                        }`}
                                    >
                                        Semua Role
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRoleFilter('user')}
                                        className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-all ${
                                            roleFilter === 'user'
                                                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                                                : 'text-zinc-600 dark:text-zinc-400'
                                        }`}
                                    >
                                        Member (User)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRoleFilter('admin')}
                                        className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-all ${
                                            roleFilter === 'admin'
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
                                            .map((m) => `"${m.id}","${m.name}","${m.email}","${m.phone_number}","${m.address}","${m.role}","${m.is_verified ? 'Verified' : 'Pending'}"`)
                                            .join('\n');
                                        const header = '"ID","Nama","Email","No. Telepon","Alamat","Role","Status Email"\n';
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
                                        <th className="py-3.5 px-4">Kontak & WhatsApp</th>
                                        <th className="py-3.5 px-4">Alamat Domisili</th>
                                        <th className="py-3.5 px-4">Tipe Akun</th>
                                        <th className="py-3.5 px-4">Status Email</th>
                                        <th className="py-3.5 px-4">Bergabung</th>
                                        <th className="py-3.5 px-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                    {filteredMembers.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center text-zinc-400">
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
                                                    <Badge
                                                        variant={member.role === 'admin' ? 'destructive' : 'secondary'}
                                                        className="capitalize font-bold text-[10px]"
                                                    >
                                                        {member.role === 'admin' ? 'Administrator' : 'Member Loyalitas'}
                                                    </Badge>
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
                                                            Belum Verifikasi
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-zinc-500 whitespace-nowrap">
                                                    {member.joined_at}
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setSelectedMember(member)}
                                                        className="h-8 px-2.5 text-xs text-zinc-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer"
                                                    >
                                                        <Eye className="size-3.5 mr-1" />
                                                        Detail
                                                    </Button>
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
                                    <History className="size-5 text-red-600" />
                                    Pusat Verifikasi & Log Transaksi Poin
                                </h2>
                                <p className="text-xs text-zinc-500">
                                    Validasi dan tinjau transaksi layanan servis serta pembelian resmi Honda untuk mengkreditkan reward poin kepada member
                                </p>
                            </div>

                            {/* Claim Status Filters */}
                            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs">
                                <button
                                    type="button"
                                    onClick={() => setClaimsFilter('all')}
                                    className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                                        claimsFilter === 'all'
                                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                                            : 'text-zinc-600 dark:text-zinc-400'
                                    }`}
                                >
                                    Semua ({claims.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setClaimsFilter('pending')}
                                    className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                                        claimsFilter === 'pending'
                                            ? 'bg-amber-500 text-white shadow-xs'
                                            : 'text-zinc-600 dark:text-zinc-400'
                                    }`}
                                >
                                    Menunggu ({claims.filter((c) => c.status === 'pending').length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setClaimsFilter('approved')}
                                    className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                                        claimsFilter === 'approved'
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'text-zinc-600 dark:text-zinc-400'
                                    }`}
                                >
                                    Disetujui
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setClaimsFilter('rejected')}
                                    className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                                        claimsFilter === 'rejected'
                                            ? 'bg-red-600 text-white shadow-xs'
                                            : 'text-zinc-600 dark:text-zinc-400'
                                    }`}
                                >
                                    Ditolak
                                </button>
                            </div>
                        </div>

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
                                                    {claim.id}
                                                </Badge>
                                                {claim.transaction_code && (
                                                    <span className="text-[11px] text-zinc-500 font-mono">
                                                        {claim.transaction_code}
                                                    </span>
                                                )}
                                            </div>

                                            <Badge
                                                className={
                                                    claim.status === 'approved'
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border-none font-bold'
                                                        : claim.status === 'rejected'
                                                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400 border-none font-bold'
                                                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border-none font-bold'
                                                }
                                            >
                                                {claim.status === 'approved'
                                                    ? 'Disetujui (+Poin Masuk)'
                                                    : claim.status === 'rejected'
                                                      ? 'Klaim Ditolak'
                                                      : 'Menunggu Validasi'}
                                            </Badge>
                                        </div>

                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="font-black text-base text-zinc-900 dark:text-zinc-100">
                                                    {claim.member_name}
                                                </h3>
                                                <p className="text-xs text-zinc-500">
                                                    ID Member: #{claim.member_id}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-lg border border-red-200 dark:border-red-900/40">
                                                    +{claim.points_claimed} PTS
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
                                            <div>
                                                <span className="text-zinc-400 text-[10px] uppercase font-bold block">
                                                    Mitra Dealer / AHASS
                                                </span>
                                                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                                    {claim.merchant_name}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-zinc-400 text-[10px] uppercase font-bold block">
                                                    Tanggal Transaksi
                                                </span>
                                                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                                    {claim.date}
                                                </span>
                                            </div>
                                            <div className="col-span-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                                <span className="text-zinc-400 text-[10px] uppercase font-bold block">
                                                    Jenis Transaksi
                                                </span>
                                                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                                    {claim.transaction_type}
                                                </span>
                                            </div>
                                            <div className="col-span-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                                <div>
                                                    <span className="text-zinc-400 text-[10px] uppercase font-bold block">
                                                        Total Nilai Pembelian
                                                    </span>
                                                    <span className="font-black text-sm text-zinc-900 dark:text-zinc-100">
                                                        Rp {claim.transaction_amount.toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-zinc-400 text-[10px] uppercase font-bold block">
                                                        Estimasi Poin
                                                    </span>
                                                    <span className="font-black text-sm text-amber-600 dark:text-amber-400">
                                                        +{claim.points_claimed} PTS
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
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
                                            Detail Transaksi
                                        </Button>

                                        {claim.status === 'pending' ? (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        handleApproveClaim(
                                                            claim.id,
                                                            claim.member_name,
                                                            claim.points_claimed
                                                        )
                                                    }
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 rounded-xl font-bold cursor-pointer"
                                                >
                                                    <Check className="size-4 mr-1" />
                                                    Setujui
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleRejectClaim(claim.id, claim.member_name)}
                                                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs h-9 px-3 rounded-xl cursor-pointer"
                                                >
                                                    Tolak
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-zinc-400 font-mono">
                                                {claim.date}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 4: VOUCHERS CATALOG */}
                {activeTab === 'vouchers' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Gift className="size-5 text-red-600" />
                                    Manajemen Katalog Voucher Reward
                                </h2>
                                <p className="text-xs text-zinc-500">
                                    Kelola kupon hadiah servis AHASS, oli AHM, sparepart, diskon motor, dan merchandise yang dapat ditukarkan member
                                </p>
                            </div>

                            <Button
                                onClick={() => setNewVoucherModal(true)}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold gap-2 h-10 px-4 rounded-xl cursor-pointer shadow-md shadow-red-600/20"
                            >
                                <Plus className="size-4" />
                                Tambah Program Voucher
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {voucherList.map((voucher) => {
                                const totalQuota = voucher.stock + voucher.claimed;
                                const claimPercent = totalQuota > 0 ? Math.round((voucher.claimed / totalQuota) * 100) : 0;

                                return (
                                    <div
                                        key={voucher.id}
                                        className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col group"
                                    >
                                        <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                            <img
                                                src={voucher.image}
                                                alt={voucher.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-bold">
                                                {voucher.category}
                                            </div>
                                            <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-xl text-xs font-black shadow-md">
                                                {voucher.points_required} PTS
                                            </div>
                                        </div>

                                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-mono font-bold text-zinc-400 block">
                                                    {voucher.id}
                                                </span>
                                                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-snug group-hover:text-red-600 transition-colors">
                                                    {voucher.title}
                                                </h3>
                                            </div>

                                            {/* Stock claim progress bar */}
                                            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                                                <div className="flex items-center justify-between text-zinc-500">
                                                    <span>Tingkat Penukaran</span>
                                                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                                        {voucher.claimed} / {totalQuota} ({claimPercent}%)
                                                    </span>
                                                </div>
                                                <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full"
                                                        style={{ width: `${claimPercent}%` }}
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between text-[11px] pt-1 text-zinc-500">
                                                    <span>Sisa Stok: <strong className="text-zinc-900 dark:text-zinc-100">{voucher.stock} kupon</strong></span>
                                                    <Badge variant="outline" className="text-[10px] py-0 text-emerald-600 border-emerald-300">
                                                        Aktif
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* TAB 5: POLICY & POINTS CALCULATION */}
                {activeTab === 'policy' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xs">
                            <div className="max-w-3xl space-y-6">
                                <div>
                                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                        <Calculator className="size-5 text-red-600" />
                                        Kebijakan Akumulasi & Penukaran Poin Loyalitas Resmi
                                    </h2>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        Panduan operasional sistem reward loyalitas Honda yang mandiri dan terpisah dari sistem operasional bengkel lainnya
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 space-y-2">
                                        <div className="size-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs">
                                            1
                                        </div>
                                        <h4 className="font-bold text-sm text-red-900 dark:text-red-200">
                                            Servis Berkala AHASS
                                        </h4>
                                        <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
                                            Member memperoleh poin reward langsung saat melakukan servis di bengkel resmi AHASS melalui scanner QR ID member.
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 space-y-2">
                                        <div className="size-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                                            2
                                        </div>
                                        <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                                            Pembelian Part & Oli AHM
                                        </h4>
                                        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                            Setiap pembelian oli resmi MPX/SPX atau suku cadang resmi Honda Genuine Parts otomatis memperoleh reward poin di kasir.
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                                        <div className="size-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                                            3
                                        </div>
                                        <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                                            Penukaran Kupon Voucher
                                        </h4>
                                        <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                                            Poin dapat ditukarkan langsung di e-wallet dengan rasio nilai rata-rata <strong>1 Poin &asymp; Rp 100</strong> potongan biaya.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 space-y-3">
                                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                        <ShieldCheck className="size-4 text-emerald-600" />
                                        Arsitektur Keamanan & Sistem Terpisah
                                    </h4>
                                    <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 list-disc pl-5">
                                        <li>
                                            <strong>Sistem Terpisah Mandiri:</strong> Aplikasi ini beroperasi independen untuk program loyalitas dan pemberian hadiah, tidak terikat langsung pada sistem mekanis internal bengkel.
                                        </li>
                                        <li>
                                            <strong>Verifikasi Email:</strong> Member wajib memverifikasi alamat email mereka sebelum dapat mengklaim voucher atau menukarkan poin reward.
                                        </li>
                                        <li>
                                            <strong>Two-Factor Authentication (2FA):</strong> Sistem mendukung pengiriman kode OTP 6-digit via Email SMTP (Gmail) serta aplikasi authenticator (TOTP).
                                        </li>
                                        <li>
                                            <strong>Validasi Transaksi Poin:</strong> Setiap pemberian poin diverifikasi langsung oleh petugas resmi melalui scanner kamera QR atau input ID Member.
                                        </li>
                                    </ul>
                                </div>
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
                            Informasi identitas akun loyalitas pelanggan
                        </DialogDescription>
                    </DialogHeader>

                    {selectedMember && (
                        <div className="space-y-4 py-2 text-xs">
                            {/* Digital Card Preview */}
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-red-950 text-white shadow-md relative overflow-hidden border border-zinc-700/50">
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
                                    <Badge variant={selectedMember.role === 'admin' ? 'destructive' : 'secondary'} className="uppercase text-[10px] font-bold">
                                        {selectedMember.role}
                                    </Badge>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-2.5 p-3.5 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
                                <div className="flex items-center justify-between">
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
                                    <span className="text-zinc-400 block mb-0.5">Alamat Lengkap:</span>
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

                    <DialogFooter className="gap-2 sm:gap-0">
                        {selectedMember && (
                            <Button
                                variant="outline"
                                onClick={() => handleCopy(selectedMember.id, 'ID Member')}
                                className="text-xs h-9 rounded-xl"
                            >
                                <Copy className="size-3.5 mr-1" /> Salin ID
                            </Button>
                        )}
                        <Button
                            onClick={() => setSelectedMember(null)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs h-9 rounded-xl"
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Detail Transaksi (Claim Inspection) */}
            <Dialog open={!!inspectedClaim} onOpenChange={() => setInspectedClaim(null)}>
                <DialogContent className="sm:max-w-lg rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                            <div className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                                <History className="size-4" />
                            </div>
                            Pemeriksaan Rekaman Transaksi Resmi
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Verifikasi rincian transaksi layanan dan alokasi poin reward member
                        </DialogDescription>
                    </DialogHeader>

                    {inspectedClaim && (
                        <div className="space-y-4 py-2 text-xs">
                            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 font-mono">
                                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                                    <div className="font-bold text-red-600">LOG TRANSAKSI RESMI HONDA AHASS</div>
                                    <div className="text-[10px] text-zinc-500">{inspectedClaim.date}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <div>
                                        <span className="text-zinc-400 block text-[9px]">KODE TRANSAKSI</span>
                                        <span className="font-bold">{inspectedClaim.transaction_code || `#${inspectedClaim.id}`}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-400 block text-[9px]">TEMPAT TRANSAKSI</span>
                                        <span className="font-bold">{inspectedClaim.merchant_name}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-400 block text-[9px]">NAMA MEMBER</span>
                                        <span className="font-bold">{inspectedClaim.member_name}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-400 block text-[9px]">ID MEMBER</span>
                                        <span className="font-bold">#{inspectedClaim.member_id}</span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                    <span className="text-zinc-400 block text-[9px]">DESKRIPSI PEMBELIAN</span>
                                    <span className="font-sans font-medium text-zinc-800 dark:text-zinc-200">
                                        {inspectedClaim.transaction_type}
                                    </span>
                                    {inspectedClaim.notes && (
                                        <p className="font-sans text-[11px] text-zinc-500 mt-1 italic">
                                            Catatan: {inspectedClaim.notes}
                                        </p>
                                    )}
                                </div>

                                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                                    <span className="font-bold text-zinc-600 dark:text-zinc-400">TOTAL NILAI PEMBAYARAN:</span>
                                    <span className="font-bold text-sm text-zinc-900 dark:text-white">
                                        Rp {inspectedClaim.transaction_amount.toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-red-600 font-bold">
                                    <span>POIN REWARD YANG DIKLAIM:</span>
                                    <span>+{inspectedClaim.points_claimed} PTS</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        {inspectedClaim && inspectedClaim.status === 'pending' ? (
                            <>
                                <Button
                                    onClick={() =>
                                        handleApproveClaim(
                                            inspectedClaim.id,
                                            inspectedClaim.member_name,
                                            inspectedClaim.points_claimed
                                        )
                                    }
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 rounded-xl font-bold flex-1"
                                >
                                    <Check className="size-4 mr-1.5" />
                                    Setujui & Kirim +{inspectedClaim.points_claimed} Poin
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleRejectClaim(inspectedClaim.id, inspectedClaim.member_name)}
                                    className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-9 rounded-xl"
                                >
                                    Tolak Klaim
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

            {/* Modal Tambah Program Voucher Baru */}
            <Dialog open={newVoucherModal} onOpenChange={setNewVoucherModal}>
                <DialogContent className="sm:max-w-md rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                            <div className="size-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
                                <Gift className="size-4" />
                            </div>
                            Tambah Program Voucher Reward Baru
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Terbitkan kupon promo baru yang dapat ditukarkan pelanggan menggunakan poin reward
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.currentTarget;
                            const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                            const points = Number((form.elements.namedItem('points') as HTMLInputElement).value);
                            const stock = Number((form.elements.namedItem('stock') as HTMLInputElement).value);
                            const category = (form.elements.namedItem('category') as HTMLInputElement).value;

                            const newVch: Voucher = {
                                id: `VCH-0${voucherList.length + 1}`,
                                title,
                                points_required: points,
                                stock,
                                claimed: 0,
                                category,
                                status: 'active',
                                image: '/images/pictures/voucher_service_img.jpg',
                            };

                            setVoucherList([newVch, ...voucherList]);
                            setNewVoucherModal(false);
                            toast.success(`Voucher "${title}" berhasil ditambahkan ke katalog reward!`);
                        }}
                        className="space-y-3.5 py-2 text-xs"
                    >
                        <div>
                            <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                Judul Program Voucher
                            </label>
                            <Input
                                name="title"
                                placeholder="Contoh: Diskon Oli AHM SPX 50%"
                                required
                                className="text-xs h-9 rounded-xl"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                    Poin Dibutuhkan
                                </label>
                                <Input
                                    name="points"
                                    type="number"
                                    min="10"
                                    placeholder="200"
                                    required
                                    className="text-xs h-9 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                    Kuota Stok Awal
                                </label>
                                <Input
                                    name="stock"
                                    type="number"
                                    min="1"
                                    placeholder="100"
                                    required
                                    className="text-xs h-9 rounded-xl"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                Kategori Reward
                            </label>
                            <Input
                                name="category"
                                placeholder="Oli & Servis / Aksesori / Merchandise"
                                defaultValue="Servis & Oli AHASS"
                                required
                                className="text-xs h-9 rounded-xl"
                            />
                        </div>

                        <DialogFooter className="pt-3">
                            <Button
                                type="submit"
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-10 rounded-xl cursor-pointer shadow-md shadow-red-600/20"
                            >
                                Terbitkan Voucher Reward
                            </Button>
                        </DialogFooter>
                    </form>
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
