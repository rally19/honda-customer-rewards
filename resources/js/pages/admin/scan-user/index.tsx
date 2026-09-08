import { Head, Link, router } from '@inertiajs/react';
import { Scanner } from '@yudiel/react-qr-scanner';
import {
    AlertCircle,
    Award,
    Camera,
    CameraOff,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    ExternalLink,
    Eye,
    Flame,
    Gift,
    HelpCircle,
    History,
    Info,
    Keyboard,
    Mail,
    MapPin,
    Phone,
    Plus,
    QrCode,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Star,
    SwitchCamera,
    Tag,
    User,
    UserCheck,
    X,
    XCircle,
    Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/error-boundary';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    status: 'hold' | 'claimed' | 'rejected' | 'cancelled';
    admin_name: string;
    admin_notes: string;
    time_ago: string;
    created_at: string;
    raw_date: string;
};

type MemberData = {
    id: string;
    name: string;
    email: string;
    phone_number: string;
    address: string;
    role: string;
    points: number;
    lifetime_points: number;
    tier: string;
    next_tier: string | null;
    points_to_next_tier: number;
    tier_progress: number;
    email_verified: boolean;
    created_at: string;
};

type MemberStats = {
    totalClaims: number;
    holdClaims: number;
    claimedCount: number;
    rejectedCount: number;
    totalPointsSpent: number;
    totalActivities: number;
};

type GlobalStats = {
    totalClaims: number;
    holdClaims: number;
    claimedCount: number;
    totalPointsExchanged: number;
};

type Props = {
    recentClaims: ClaimItem[];
    stats: GlobalStats;
    initialMember?: MemberData | null;
    initialClaims?: ClaimItem[];
    initialMemberStats?: MemberStats | null;
};

export default function AdminScanUserIndex({
    recentClaims,
    stats,
    initialMember = null,
    initialClaims = [],
    initialMemberStats = null,
}: Props) {
    // 0. Mounted state
    const [isMounted, setIsMounted] = useState(false);

    // 1. Input Mode ('scanner' | 'manual')
    const [inputMode, setInputMode] = useState<'scanner' | 'manual'>('scanner');
    const [scannerError, setScannerError] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>(
        'environment',
    );

    const toggleFacingMode = () => {
        setFacingMode((prev) =>
            prev === 'environment' ? 'user' : 'environment',
        );
    };

    // 2. Manual Input Query
    const [manualIdInput, setManualIdInput] = useState('');

    // 3. Looked-up Member state
    const [isSearching, setIsSearching] = useState(false);
    const [member, setMember] = useState<MemberData | null>(initialMember);
    const [memberClaims, setMemberClaims] =
        useState<ClaimItem[]>(initialClaims);
    const [memberStats, setMemberStats] = useState<MemberStats | null>(
        initialMemberStats,
    );
    const [searchError, setSearchError] = useState<string | null>(null);

    // 4. Filter status for claims
    const [claimFilter, setClaimFilter] = useState<
        'all' | 'hold' | 'claimed' | 'rejected'
    >('all');

    // 5. Modals (Detail, Approve, Reject)
    const [selectedClaimDetail, setSelectedClaimDetail] =
        useState<ClaimItem | null>(null);
    const [claimToApprove, setClaimToApprove] = useState<ClaimItem | null>(
        null,
    );
    const [claimToReject, setClaimToReject] = useState<ClaimItem | null>(null);
    const [actionNotes, setActionNotes] = useState('');
    const [isActionProcessing, setIsActionProcessing] = useState(false);

    // 6. Copy ID state
    const [copiedId, setCopiedId] = useState(false);

    // 7. Mobile floating action bar visibility
    const [showMobileBar, setShowMobileBar] = useState(true);

    // 8. Refs
    const isScanningRef = useRef(false);
    const memberCardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (member) {
            setShowMobileBar(true);
        }
    }, [member?.id]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Get CSRF token
    const getCsrfToken = (): string => {
        if (typeof document === 'undefined') return '';
        const meta = document.querySelector(
            'meta[name="csrf-token"]',
        ) as HTMLMetaElement | null;
        if (meta?.content) return meta.content;
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    };

    // Lookup member by raw string (QR result or manual typing)
    const lookupMember = async (identifier: string) => {
        const cleanIdentifier = identifier.trim();
        if (!cleanIdentifier) return;

        setIsSearching(true);
        setSearchError(null);

        try {
            const res = await fetch('/admin/scan-user/lookup', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ identifier: cleanIdentifier }),
            });

            const data = await res.json();

            if (res.ok && data.found) {
                setMember(data.member);
                setMemberClaims(data.claims || []);
                setMemberStats(data.stats || null);
                toast.success(`Member ditemukan: ${data.member.name}`);
                playBeepSound();

                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setTimeout(() => {
                        memberCardRef.current?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'nearest',
                        });
                    }, 100);
                }
            } else {
                setSearchError(
                    data.message ||
                        'Member tidak ditemukan. Pastikan ID atau QR sesuai.',
                );
                toast.error(data.message || 'Member tidak ditemukan');
            }
        } catch {
            setSearchError('Terjadi kendala saat mencari data member.');
            toast.error('Gagal memverifikasi member');
        } finally {
            setIsSearching(false);
        }
    };

    // Beep audio effect on scan
    const playBeepSound = () => {
        try {
            const AudioCtx =
                window.AudioContext ||
                (
                    window as unknown as {
                        webkitAudioContext: typeof AudioContext;
                    }
                ).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880; // A5
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(
                0.001,
                ctx.currentTime + 0.15,
            );
            osc.start();
            osc.stop(ctx.currentTime + 0.15);

            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(100);
            }
        } catch {
            // Ignore audio context failures
        }
    };

    // QR Scanner Callback
    const handleQrScan = (detectedCodes: Array<{ rawValue: string }>) => {
        if (!detectedCodes || detectedCodes.length === 0) return;
        if (isScanningRef.current || isSearching) return;

        const rawVal = detectedCodes[0].rawValue?.trim();
        if (!rawVal) return;

        if (
            member &&
            (member.id === rawVal || `HND-MEMBER-${member.id}` === rawVal)
        ) {
            return;
        }

        isScanningRef.current = true;
        lookupMember(rawVal).finally(() => {
            setTimeout(() => {
                isScanningRef.current = false;
            }, 1500);
        });
    };

    // Manual Form Submit
    const handleManualSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualIdInput.trim()) return;
        lookupMember(manualIdInput);
    };

    // Copy ID Helper
    const copyMemberId = (id: string) => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(id);
            setCopiedId(true);
            toast.success('ID Member disalin ke clipboard');
            setTimeout(() => setCopiedId(false), 2000);
        }
    };

    // Approve Claim handler
    const handleApproveClaim = () => {
        if (!claimToApprove) return;
        setIsActionProcessing(true);

        router.post(
            `/admin/rewards/exchanges/${claimToApprove.id}/approve`,
            {
                admin_notes:
                    actionNotes.trim() ||
                    'Disetujui melalui Scan / Input User AHASS.',
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        `Klaim #${claimToApprove.id} berhasil disetujui! Hadiah dapat diserahkan.`,
                    );
                    setClaimToApprove(null);
                    setActionNotes('');
                    // Re-lookup member to update claims & stats
                    if (member) {
                        lookupMember(member.id);
                    }
                },
                onError: () => {
                    toast.error('Gagal menyetujui klaim reward');
                },
                onFinish: () => {
                    setIsActionProcessing(false);
                },
            },
        );
    };

    // Reject Claim handler
    const handleRejectClaim = () => {
        if (!claimToReject) return;
        setIsActionProcessing(true);

        router.post(
            `/admin/rewards/exchanges/${claimToReject.id}/reject`,
            {
                admin_notes:
                    actionNotes.trim() ||
                    'Ditolak melalui Scan / Input User AHASS.',
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        `Klaim #${claimToReject.id} ditolak. Poin & stok dikembalikan.`,
                    );
                    setClaimToReject(null);
                    setActionNotes('');
                    // Re-lookup member to update claims & stats
                    if (member) {
                        lookupMember(member.id);
                    }
                },
                onError: () => {
                    toast.error('Gagal menolak klaim reward');
                },
                onFinish: () => {
                    setIsActionProcessing(false);
                },
            },
        );
    };

    // Tier badge styles matching admin/scan/index.tsx standard
    const getTierBadgeStyle = (tierName: string) => {
        const t = (tierName || '').toLowerCase();
        switch (t) {
            case 'diamond':
                return 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700 font-bold';
            case 'platinum':
                return 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700 font-bold';
            case 'gold':
                return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-bold';
            case 'silver':
                return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 font-bold';
            default:
                return 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700 font-bold';
        }
    };

    // Status badge style for claims
    const getClaimStatusBadge = (status: string) => {
        switch (status) {
            case 'hold':
                return (
                    <Badge className="border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:border-amber-700 dark:bg-amber-950/80 dark:text-amber-300">
                        <Clock className="mr-1 size-3" />
                        Menunggu Verifikasi
                    </Badge>
                );
            case 'claimed':
                return (
                    <Badge className="border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                        <CheckCircle2 className="mr-1 size-3" />
                        Disetujui / Diserahkan
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="border border-rose-300 bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800 dark:border-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                        <XCircle className="mr-1 size-3" />
                        Ditolak
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge className="border border-zinc-300 bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                        <AlertCircle className="mr-1 size-3" />
                        Dibatalkan
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Filtered claims for currently looked-up member
    const filteredClaims = useMemo(() => {
        if (!memberClaims) return [];
        if (claimFilter === 'all') return memberClaims;
        if (claimFilter === 'hold')
            return memberClaims.filter((c) => c.status === 'hold');
        if (claimFilter === 'claimed')
            return memberClaims.filter((c) => c.status === 'claimed');
        if (claimFilter === 'rejected')
            return memberClaims.filter(
                (c) => c.status === 'rejected' || c.status === 'cancelled',
            );
        return memberClaims;
    }, [memberClaims, claimFilter]);

    return (
        <>
            <Head title="Scan & Verifikasi Klaim Reward Member - Admin AHASS" />

            <div className="mx-auto max-w-7xl space-y-6 p-3 sm:p-5 md:space-y-8 md:p-6">
                {/* Header Title Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-red-600 via-red-700 to-zinc-900 p-5 text-white shadow-xl shadow-red-600/15 sm:p-6 md:p-8">
                    <div className="pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 size-64 rounded-full bg-white/5 blur-2xl" />
                    <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-semibold tracking-wider text-red-100 uppercase backdrop-blur-md sm:text-xs">
                                <UserCheck className="size-3.5" />
                                Official AHASS Reward Verification
                            </div>
                            <h1 className="text-xl font-black tracking-tight sm:text-2xl md:text-3xl">
                                Scan QR & Input User (Klaim Reward)
                            </h1>
                            <p className="max-w-2xl text-xs leading-relaxed text-red-100/80 sm:text-sm">
                                Identifikasi profil member pelanggan secara
                                detail dan verifikasi serah terima hadiah reward
                                Honda & AHASS dengan memindai QR Member atau
                                mengetik 10 digit ID.
                            </p>
                        </div>

                        <div className="grid shrink-0 grid-cols-3 gap-2.5 rounded-2xl border border-white/15 bg-black/20 p-3 backdrop-blur-md sm:flex sm:items-center">
                            <div className="px-3 py-1 text-center">
                                <div className="text-lg font-black text-amber-300">
                                    {stats.holdClaims}
                                </div>
                                <div className="text-[10px] font-bold text-red-200 uppercase">
                                    Menunggu Hold
                                </div>
                            </div>
                            <div className="hidden h-8 w-px bg-white/20 sm:block" />
                            <div className="px-3 py-1 text-center">
                                <div className="text-lg font-black text-white">
                                    {stats.totalClaims}
                                </div>
                                <div className="text-[10px] font-bold text-red-200 uppercase">
                                    Total Klaim
                                </div>
                            </div>
                            <div className="hidden h-8 w-px bg-white/20 sm:block" />
                            <div className="px-3 py-1 text-center">
                                <div className="text-lg font-black text-emerald-300">
                                    {stats.claimedCount}
                                </div>
                                <div className="text-[10px] font-bold text-red-200 uppercase">
                                    Diserahkan
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main 2-Column Content Layout */}
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                    {/* Left Column: Scanner & Identifikasi Member (5 Cols) */}
                    <div className="space-y-6 self-start lg:sticky lg:top-[80px] lg:col-span-5">
                        {/* Box 1: Mode Identifikasi (Scan Kamera / Ketik Manual) */}
                        <div className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-4 shadow-xs sm:p-5 md:p-6 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex size-7 items-center justify-center rounded-xl bg-red-600 text-xs font-bold text-white shadow-xs">
                                        1
                                    </span>
                                    <div>
                                        <h2 className="text-sm font-bold text-zinc-900 sm:text-base dark:text-zinc-100">
                                            Identifikasi Member
                                        </h2>
                                        <p className="text-xs text-zinc-500">
                                            Pindai QR kamera ponsel member atau
                                            ketik 10 digit ID
                                        </p>
                                    </div>
                                </div>

                                {/* Mode Switcher Tabs */}
                                <div className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1 sm:flex sm:w-auto dark:bg-zinc-800">
                                    <button
                                        type="button"
                                        onClick={() => setInputMode('scanner')}
                                        className={`flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:h-auto ${
                                            inputMode === 'scanner'
                                                ? 'bg-white text-red-600 shadow-xs dark:bg-zinc-900 dark:text-red-400'
                                                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
                                        }`}
                                    >
                                        <Camera className="size-3.5" />
                                        Scan Kamera
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setInputMode('manual')}
                                        className={`flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:h-auto ${
                                            inputMode === 'manual'
                                                ? 'bg-white text-red-600 shadow-xs dark:bg-zinc-900 dark:text-red-400'
                                                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
                                        }`}
                                    >
                                        <Keyboard className="size-3.5" />
                                        Ketik ID
                                    </button>
                                </div>
                            </div>

                            {/* TAB 1: SCANNER KAMERA (@yudiel/react-qr-scanner) */}
                            {inputMode === 'scanner' ? (
                                <div className="space-y-3">
                                    <div className="relative mx-auto flex aspect-square w-full max-w-xl flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-red-500/30 bg-zinc-950 shadow-inner sm:aspect-[4/3] sm:rounded-3xl">
                                        <ErrorBoundary
                                            name="Kamera Scanner QR Member"
                                            onReset={() => {
                                                setScannerError(null);
                                                setIsCameraActive(true);
                                            }}
                                            fallback={(err, reset) => (
                                                <div className="max-w-sm space-y-3 p-6 text-center text-zinc-300">
                                                    <CameraOff className="mx-auto size-10 text-amber-500 opacity-80" />
                                                    <div className="space-y-1">
                                                        <h4 className="text-sm font-bold text-white">
                                                            Kamera Tidak Dapat
                                                            Dimuat
                                                        </h4>
                                                        <p className="text-xs text-zinc-400">
                                                            Izin akses kamera
                                                            belum diberikan atau
                                                            browser membatasi
                                                            media stream.
                                                        </p>
                                                    </div>
                                                    <div className="flex justify-center gap-2 pt-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={reset}
                                                            className="rounded-xl text-xs"
                                                        >
                                                            Coba Lagi
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                setInputMode(
                                                                    'manual',
                                                                )
                                                            }
                                                            className="rounded-xl bg-red-600 text-xs text-white hover:bg-red-700"
                                                        >
                                                            Ketik Manual
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        >
                                            {isCameraActive && isMounted ? (
                                                <div className="relative h-full w-full">
                                                    <Scanner
                                                        key={facingMode}
                                                        onScan={handleQrScan}
                                                        constraints={{
                                                            facingMode,
                                                        }}
                                                        onError={(error) => {
                                                            setScannerError(
                                                                error instanceof
                                                                    Error
                                                                    ? error.message
                                                                    : 'Gagal membuka video stream kamera',
                                                            );
                                                        }}
                                                        formats={['qr_code']}
                                                        styles={{
                                                            container: {
                                                                width: '100%',
                                                                height: '100%',
                                                            },
                                                            video: {
                                                                objectFit:
                                                                    'cover',
                                                            },
                                                        }}
                                                    />

                                                    {/* Switch Camera Floating Button (Top-Right) */}
                                                    <div className="absolute top-3 right-3 z-20">
                                                        <button
                                                            type="button"
                                                            onClick={
                                                                toggleFacingMode
                                                            }
                                                            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/20 bg-black/65 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur-md transition-all hover:bg-black/85 active:scale-95"
                                                            title={`Beralih ke Kamera ${facingMode === 'environment' ? 'Depan' : 'Belakang'}`}
                                                        >
                                                            <SwitchCamera className="size-3.5 text-amber-400" />
                                                            <span>
                                                                {facingMode ===
                                                                'environment'
                                                                    ? 'Kamera Belakang'
                                                                    : 'Kamera Depan'}
                                                            </span>
                                                        </button>
                                                    </div>

                                                    {/* Scanner Target Guide Overlay */}
                                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                        <div className="relative size-48 rounded-2xl border-2 border-red-500/70 shadow-2xl sm:size-60 sm:rounded-3xl md:size-64">
                                                            <div className="absolute -top-1 -left-1 size-5 rounded-tl-md border-t-4 border-l-4 border-red-500" />
                                                            <div className="absolute -top-1 -right-1 size-5 rounded-tr-md border-t-4 border-r-4 border-red-500" />
                                                            <div className="absolute -bottom-1 -left-1 size-5 rounded-bl-md border-b-4 border-l-4 border-red-500" />
                                                            <div className="absolute -right-1 -bottom-1 size-5 rounded-br-md border-r-4 border-b-4 border-red-500" />
                                                            <div className="absolute inset-x-2 top-1/2 h-0.5 animate-pulse bg-red-500/80" />
                                                        </div>
                                                    </div>

                                                    {/* Scanning status banner with Switch & Pause actions */}
                                                    <div className="absolute inset-x-4 bottom-3 z-20 flex items-center justify-between rounded-xl border border-white/10 bg-black/75 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur-md">
                                                        <div className="flex items-center gap-2">
                                                            <span className="size-2 animate-ping rounded-full bg-emerald-400" />
                                                            <span className="text-[11px] font-medium">
                                                                Mencari QR ID
                                                                Member...
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <button
                                                                type="button"
                                                                onClick={
                                                                    toggleFacingMode
                                                                }
                                                                className="flex cursor-pointer items-center gap-1 text-[11px] text-zinc-300 hover:text-white"
                                                                title={`Beralih ke Kamera ${facingMode === 'environment' ? 'Depan' : 'Belakang'}`}
                                                            >
                                                                <SwitchCamera className="size-3 text-amber-400" />
                                                                <span className="hidden sm:inline">
                                                                    Kamera:
                                                                </span>
                                                                <span>
                                                                    {facingMode ===
                                                                    'environment'
                                                                        ? 'Belakang'
                                                                        : 'Depan'}
                                                                </span>
                                                            </button>
                                                            <span className="text-zinc-600">
                                                                |
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setIsCameraActive(
                                                                        false,
                                                                    )
                                                                }
                                                                className="cursor-pointer text-[11px] text-zinc-300 underline hover:text-white"
                                                            >
                                                                Pause
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3 p-6 text-center">
                                                    <CameraOff className="mx-auto size-10 text-zinc-500 opacity-80" />
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-semibold text-zinc-300">
                                                            Kamera sedang
                                                            dijeda.
                                                        </p>
                                                        <p className="text-[11px] text-zinc-500">
                                                            Klik tombol di bawah
                                                            untuk mengaktifkan
                                                            pemindaian QR
                                                            kamera.
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            setIsCameraActive(
                                                                true,
                                                            )
                                                        }
                                                        className="cursor-pointer rounded-xl bg-red-600 text-xs font-semibold text-white hover:bg-red-700"
                                                    >
                                                        Aktifkan Kamera
                                                    </Button>
                                                </div>
                                            )}
                                        </ErrorBoundary>
                                    </div>

                                    {scannerError && (
                                        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                            <AlertCircle className="mt-0.5 size-4 shrink-0" />
                                            <div className="flex-1">
                                                <span>{scannerError}</span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setInputMode('manual')
                                                    }
                                                    className="mt-1 block font-bold text-red-600 underline hover:text-red-700"
                                                >
                                                    Beralih ke Input Ketik
                                                    Manual
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* TAB 2: INPUT KETIK MANUAL */
                                <form
                                    onSubmit={handleManualSearch}
                                    className="space-y-3"
                                >
                                    <div>
                                        <Label
                                            htmlFor="manualId"
                                            className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                                        >
                                            Masukkan 10 Digit ID Member Honda /
                                            Email / No. HP
                                        </Label>
                                        <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                                            <div className="relative flex-1">
                                                <User className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400" />
                                                <Input
                                                    id="manualId"
                                                    type="text"
                                                    placeholder="Contoh: 8844766994 atau email member"
                                                    value={manualIdInput}
                                                    onChange={(e) =>
                                                        setManualIdInput(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-11 rounded-xl pl-10 font-mono text-sm tracking-wider"
                                                    autoFocus
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                disabled={
                                                    isSearching ||
                                                    !manualIdInput.trim()
                                                }
                                                className="h-11 shrink-0 cursor-pointer rounded-xl bg-red-600 px-5 text-xs font-semibold text-white shadow-md shadow-red-600/20 transition-all hover:bg-red-700 active:scale-95"
                                            >
                                                {isSearching ? (
                                                    <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
                                                ) : (
                                                    <Search className="mr-1.5 size-3.5" />
                                                )}
                                                Cari Member
                                            </Button>
                                        </div>
                                        <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                                            Mendukung ID angka 10-digit (misal:{' '}
                                            <code>8844766994</code>), email,
                                            atau nomor HP terdaftar.
                                        </p>
                                    </div>
                                </form>
                            )}

                            {searchError && (
                                <div className="flex items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="size-4 shrink-0" />
                                        <span>{searchError}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSearchError(null)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Live Feed: Klaim Reward Terbaru Sistem */}
                        <div className="space-y-3 rounded-3xl border border-zinc-200 bg-white p-4 shadow-xs sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Gift className="size-4 text-red-600" />
                                    <h3 className="text-xs font-bold text-zinc-900 sm:text-sm dark:text-zinc-100">
                                        Klaim Reward Terbaru di AHASS
                                    </h3>
                                </div>
                                <span className="font-mono text-[10px] text-zinc-400">
                                    Live Stream
                                </span>
                            </div>

                            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                                {recentClaims.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-zinc-400">
                                        Belum ada riwayat klaim reward terbaru
                                        di sistem.
                                    </div>
                                ) : (
                                    recentClaims.map((claim) => (
                                        <div
                                            key={claim.id}
                                            className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/60 bg-zinc-50 p-3 text-xs transition-colors hover:bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="truncate font-bold text-zinc-900 dark:text-white">
                                                        {claim.reward_name}
                                                    </span>
                                                    <span className="font-mono text-[10px] text-zinc-400">
                                                        #{claim.id}
                                                    </span>
                                                </div>
                                                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500">
                                                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                                        {claim.user_name}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="font-bold text-amber-600 dark:text-amber-400">
                                                        {claim.points_cost} Pts
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                        {claim.time_ago}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-2">
                                                {claim.status === 'hold' ? (
                                                    <Badge className="bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                                                        Hold
                                                    </Badge>
                                                ) : claim.status ===
                                                  'claimed' ? (
                                                    <Badge className="bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                                                        Claimed
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="px-2 py-0.5 text-[10px]"
                                                    >
                                                        {claim.status}
                                                    </Badge>
                                                )}

                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        lookupMember(
                                                            claim.user_id,
                                                        )
                                                    }
                                                    className="h-7 cursor-pointer rounded-lg px-2 text-[11px] font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                                                    title="Lihat Member ini"
                                                >
                                                    Lihat
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Detail Informasi Member & Riwayat Klaim Reward (7 Cols) */}
                    <div className="space-y-6 self-start lg:sticky lg:top-[80px] lg:col-span-7">
                        <div
                            ref={memberCardRef}
                            className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-4 shadow-xs sm:p-5 md:p-6 dark:border-zinc-800 dark:bg-zinc-900"
                        >
                            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex size-7 items-center justify-center rounded-xl bg-red-600 text-xs font-bold text-white shadow-xs">
                                        2
                                    </span>
                                    <div>
                                        <h2 className="text-sm font-bold text-zinc-900 sm:text-base dark:text-zinc-100">
                                            Informasi Member & Klaim Reward
                                        </h2>
                                        <p className="text-xs text-zinc-500">
                                            Tinjau identitas lengkap dan kelola
                                            serah terima reward member
                                        </p>
                                    </div>
                                </div>

                                {member && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            setMember(null);
                                            setMemberClaims([]);
                                            setMemberStats(null);
                                            setManualIdInput('');
                                        }}
                                        className="h-8 cursor-pointer px-2 text-xs text-zinc-400 hover:text-red-600"
                                    >
                                        Ganti Member
                                    </Button>
                                )}
                            </div>

                            {member ? (
                                <div className="animate-smooth-in space-y-6">
                                    {/* Member Identity Card */}
                                    <div className="space-y-4 rounded-2xl border border-zinc-200/90 bg-zinc-50 p-4 sm:p-5 dark:border-zinc-700/60 dark:bg-zinc-800/60">
                                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                                            <div className="flex items-start gap-3">
                                                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-lg font-black text-white shadow-md shadow-red-600/20">
                                                    {member.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="truncate text-base font-bold text-zinc-900 sm:text-lg dark:text-zinc-100">
                                                            {member.name}
                                                        </h3>
                                                        <Badge
                                                            className={`shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-black tracking-wider uppercase ${getTierBadgeStyle(
                                                                member.tier,
                                                            )}`}
                                                        >
                                                            {member.tier}
                                                        </Badge>
                                                    </div>

                                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                copyMemberId(
                                                                    member.id,
                                                                )
                                                            }
                                                            className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 font-mono font-bold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-900/60"
                                                            title="Klik untuk menyalin ID"
                                                        >
                                                            ID: {member.id}
                                                            {copiedId ? (
                                                                <Check className="size-3 text-emerald-600" />
                                                            ) : (
                                                                <Copy className="size-3" />
                                                            )}
                                                        </button>
                                                        <span className="text-zinc-400">
                                                            •
                                                        </span>
                                                        <span className="truncate text-zinc-500 dark:text-zinc-400">
                                                            {member.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Saldo Poin Pill */}
                                            <div className="rounded-xl border border-zinc-200 bg-white p-3 sm:border-0 sm:bg-transparent sm:p-0 sm:text-right dark:border-zinc-800 dark:bg-zinc-900 sm:dark:bg-transparent">
                                                <div className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                                                    Saldo Poin Aktif
                                                </div>
                                                <div className="text-2xl font-black text-red-600 dark:text-red-400">
                                                    {member.points.toLocaleString(
                                                        'id-ID',
                                                    )}{' '}
                                                    <span className="text-xs font-bold text-zinc-500">
                                                        PTS
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-zinc-400">
                                                    Akumulasi:{' '}
                                                    {member.lifetime_points.toLocaleString(
                                                        'id-ID',
                                                    )}{' '}
                                                    Pts
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tier Progress Bar */}
                                        <div className="space-y-1.5 pt-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                                                    Tingkat Loyalitas:{' '}
                                                    <strong className="text-zinc-900 dark:text-zinc-100">
                                                        {member.tier}
                                                    </strong>
                                                </span>
                                                <span className="text-[11px] font-bold text-zinc-500">
                                                    {member.next_tier
                                                        ? `${member.points_to_next_tier.toLocaleString('id-ID')} Poin lagi menuju ${member.next_tier}`
                                                        : 'Tingkat Tertinggi (Diamond)'}
                                                </span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                                                <div
                                                    className="h-full rounded-full bg-linear-to-r from-red-600 to-amber-500 transition-all duration-500"
                                                    style={{
                                                        width: `${Math.min(100, Math.max(0, member.tier_progress))}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Contact & Detail Grid */}
                                        <div className="grid grid-cols-1 gap-2.5 border-t border-zinc-200/60 pt-3 text-xs sm:grid-cols-2 dark:border-zinc-700/60">
                                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                                <Phone className="size-3.5 shrink-0 text-zinc-400" />
                                                <span className="truncate">
                                                    {member.phone_number}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                                <MapPin className="size-3.5 shrink-0 text-zinc-400" />
                                                <span className="truncate">
                                                    {member.address}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                                <Clock className="size-3.5 shrink-0 text-zinc-400" />
                                                <span>
                                                    Member sejak{' '}
                                                    {member.created_at}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                                <ShieldCheck className="size-3.5 shrink-0 text-emerald-500" />
                                                <span>
                                                    {member.email_verified
                                                        ? 'Email Terverifikasi'
                                                        : 'Belum Verifikasi Email'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Personal Claim Stats Summary */}
                                        {memberStats && (
                                            <div className="grid grid-cols-2 gap-2 pt-2 text-center sm:grid-cols-4">
                                                <div className="rounded-xl border border-zinc-200/80 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
                                                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                        {
                                                            memberStats.totalClaims
                                                        }
                                                    </div>
                                                    <div className="text-[10px] text-zinc-500">
                                                        Total Klaim
                                                    </div>
                                                </div>
                                                <div className="rounded-xl border border-amber-200/80 bg-amber-50 p-2 dark:border-amber-900/40 dark:bg-amber-950/40">
                                                    <div className="text-sm font-bold text-amber-700 dark:text-amber-400">
                                                        {memberStats.holdClaims}
                                                    </div>
                                                    <div className="text-[10px] text-amber-800 dark:text-amber-300">
                                                        Menunggu Hold
                                                    </div>
                                                </div>
                                                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50 p-2 dark:border-emerald-900/40 dark:bg-emerald-950/40">
                                                    <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                                        {
                                                            memberStats.claimedCount
                                                        }
                                                    </div>
                                                    <div className="text-[10px] text-emerald-800 dark:text-emerald-300">
                                                        Disetujui
                                                    </div>
                                                </div>
                                                <div className="rounded-xl border border-zinc-200/80 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
                                                    <div className="text-sm font-bold text-red-600 dark:text-red-400">
                                                        {memberStats.totalPointsSpent.toLocaleString(
                                                            'id-ID',
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-zinc-500">
                                                        Poin Ditukar
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Cross-Link: Shortcut to Scan Poin / Tambah Poin Member */}
                                        <div className="flex items-center justify-between gap-2 border-t border-zinc-200/60 pt-2.5 dark:border-zinc-700/60">
                                            <span className="text-[11px] text-zinc-500">
                                                Pelanggan baru saja servis atau
                                                transaksi?
                                            </span>
                                            <Link
                                                href={`/admin/scan?user_id=${member.id}`}
                                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-200/80 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-900/60"
                                            >
                                                <Zap className="size-3.5" />
                                                Beri Poin Member
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Reward Claims Section */}
                                    <div className="space-y-4">
                                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                            <div>
                                                <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900 sm:text-base dark:text-zinc-100">
                                                    <Gift className="size-4 text-red-600" />
                                                    Daftar Klaim Reward Member
                                                </h3>
                                                <p className="text-xs text-zinc-500">
                                                    Kelola dan verifikasi
                                                    penyerahan hadiah
                                                    voucher/produk kepada
                                                    pelanggan
                                                </p>
                                            </div>

                                            {/* Status Filter Tabs */}
                                            <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-zinc-100 p-1 text-xs dark:bg-zinc-800">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setClaimFilter('all')
                                                    }
                                                    className={`cursor-pointer rounded-lg px-2.5 py-1 font-semibold whitespace-nowrap ${
                                                        claimFilter === 'all'
                                                            ? 'bg-white text-red-600 shadow-xs dark:bg-zinc-900'
                                                            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
                                                    }`}
                                                >
                                                    Semua ({memberClaims.length}
                                                    )
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setClaimFilter('hold')
                                                    }
                                                    className={`cursor-pointer rounded-lg px-2.5 py-1 font-semibold whitespace-nowrap ${
                                                        claimFilter === 'hold'
                                                            ? 'bg-white text-amber-600 shadow-xs dark:bg-zinc-900'
                                                            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
                                                    }`}
                                                >
                                                    Hold (
                                                    {
                                                        memberClaims.filter(
                                                            (c) =>
                                                                c.status ===
                                                                'hold',
                                                        ).length
                                                    }
                                                    )
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setClaimFilter(
                                                            'claimed',
                                                        )
                                                    }
                                                    className={`cursor-pointer rounded-lg px-2.5 py-1 font-semibold whitespace-nowrap ${
                                                        claimFilter ===
                                                        'claimed'
                                                            ? 'bg-white text-emerald-600 shadow-xs dark:bg-zinc-900'
                                                            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
                                                    }`}
                                                >
                                                    Selesai (
                                                    {
                                                        memberClaims.filter(
                                                            (c) =>
                                                                c.status ===
                                                                'claimed',
                                                        ).length
                                                    }
                                                    )
                                                </button>
                                            </div>
                                        </div>

                                        {/* Claims List */}
                                        {filteredClaims.length === 0 ? (
                                            <div className="space-y-2 rounded-2xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
                                                <Gift className="mx-auto size-10 text-zinc-300 dark:text-zinc-700" />
                                                <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                                    Tidak Ada Klaim Reward
                                                </div>
                                                <p className="mx-auto max-w-sm text-xs text-zinc-400">
                                                    Member ini belum memiliki
                                                    catatan penukaran reward
                                                    pada kategori yang dipilih.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {filteredClaims.map((claim) => (
                                                    <div
                                                        key={claim.id}
                                                        className={`rounded-2xl border p-4 transition-all ${
                                                            claim.status ===
                                                            'hold'
                                                                ? 'border-amber-300 bg-amber-50/40 shadow-xs dark:border-amber-800/80 dark:bg-amber-950/20'
                                                                : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                                                        }`}
                                                    >
                                                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                                            <div className="flex min-w-0 items-start gap-3.5">
                                                                {/* Reward Thumbnail Image */}
                                                                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                                                                    {claim.reward_image ? (
                                                                        <img
                                                                            src={
                                                                                claim.reward_image
                                                                            }
                                                                            alt={
                                                                                claim.reward_name
                                                                            }
                                                                            className="size-full object-cover"
                                                                            onError={(
                                                                                e,
                                                                            ) => {
                                                                                (
                                                                                    e.target as HTMLImageElement
                                                                                ).src =
                                                                                    '/images/pictures/voucher_service_img.jpg';
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <Gift className="size-6 text-zinc-400" />
                                                                    )}
                                                                </div>

                                                                <div className="min-w-0 space-y-1">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <h4 className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                                            {
                                                                                claim.reward_name
                                                                            }
                                                                        </h4>
                                                                        {getClaimStatusBadge(
                                                                            claim.status,
                                                                        )}
                                                                    </div>

                                                                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                                                        <span className="font-mono font-bold text-red-600 dark:text-red-400">
                                                                            Kode
                                                                            #
                                                                            {
                                                                                claim.id
                                                                            }
                                                                        </span>
                                                                        <span>
                                                                            •
                                                                        </span>
                                                                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                                                            -
                                                                            {
                                                                                claim.points_cost
                                                                            }{' '}
                                                                            Pts
                                                                        </span>
                                                                        <span>
                                                                            •
                                                                        </span>
                                                                        <span>
                                                                            {
                                                                                claim.created_at
                                                                            }
                                                                        </span>
                                                                    </div>

                                                                    {claim.admin_notes && (
                                                                        <div className="mt-1 inline-block rounded-lg bg-zinc-100/80 px-2.5 py-1 text-[11px] text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400">
                                                                            <strong>
                                                                                Catatan:
                                                                            </strong>{' '}
                                                                            {
                                                                                claim.admin_notes
                                                                            }
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Actions for this Claim */}
                                                            <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        setSelectedClaimDetail(
                                                                            claim,
                                                                        )
                                                                    }
                                                                    className="h-8 cursor-pointer rounded-xl text-xs font-semibold"
                                                                >
                                                                    <Eye className="mr-1 size-3.5" />
                                                                    Detail
                                                                </Button>

                                                                {claim.status ===
                                                                    'hold' && (
                                                                    <>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                setClaimToApprove(
                                                                                    claim,
                                                                                );
                                                                                setActionNotes(
                                                                                    'Hadiah diserahkan langsung kepada member di AHASS.',
                                                                                );
                                                                            }}
                                                                            className="h-8 cursor-pointer rounded-xl bg-emerald-600 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
                                                                        >
                                                                            <Check className="mr-1 size-3.5" />
                                                                            Serahkan
                                                                            Hadiah
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => {
                                                                                setClaimToReject(
                                                                                    claim,
                                                                                );
                                                                                setActionNotes(
                                                                                    'Stok habis atau verifikasi tidak sesuai.',
                                                                                );
                                                                            }}
                                                                            className="h-8 cursor-pointer rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
                                                                        >
                                                                            <X className="mr-1 size-3.5" />
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
                                </div>
                            ) : (
                                /* Empty / Waiting State */
                                <div className="space-y-4 px-4 py-16 text-center">
                                    <div className="mx-auto flex size-20 items-center justify-center rounded-3xl border border-red-200 bg-red-50 text-red-600 shadow-inner dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                                        <QrCode className="size-10" />
                                    </div>
                                    <div className="mx-auto max-w-sm space-y-1">
                                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                                            Belum Ada Member yang Dipindai
                                        </h3>
                                        <p className="text-xs leading-relaxed text-zinc-500">
                                            Arahkan kamera ke QR Member
                                            pelanggan atau masukkan 10 digit ID
                                            di sebelah kiri untuk melihat
                                            rincian akun dan status klaim reward
                                            secara spesifik.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Spacer on mobile so content is never covered by the floating action bar */}
                {member && showMobileBar && (
                    <div className="h-24 sm:h-28 lg:hidden" aria-hidden="true" />
                )}
            </div>

            {/* Modal 1: Detail Lengkap Klaim Reward */}
            <Dialog
                open={!!selectedClaimDetail}
                onOpenChange={() => setSelectedClaimDetail(null)}
            >
                <DialogContent className="rounded-3xl border-zinc-200 bg-white p-6 sm:max-w-md dark:border-zinc-800 dark:bg-zinc-900">
                    <DialogHeader className="space-y-2">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                            <Gift className="size-6" />
                        </div>
                        <DialogTitle className="text-center text-lg font-bold text-zinc-900 dark:text-white">
                            Rincian Tanda Terima Reward
                        </DialogTitle>
                        <DialogDescription className="text-center text-xs text-zinc-500">
                            Informasi bukti transaksi penukaran reward pelanggan
                        </DialogDescription>
                    </DialogHeader>

                    {selectedClaimDetail && (
                        <div className="space-y-4 py-2 text-xs">
                            <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700/60 dark:bg-zinc-800/60">
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">
                                        Status Klaim
                                    </span>
                                    {getClaimStatusBadge(
                                        selectedClaimDetail.status,
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">
                                        Kode Transaksi
                                    </span>
                                    <span className="font-mono font-bold text-zinc-900 dark:text-white">
                                        #{selectedClaimDetail.id}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">
                                        Nama Hadiah
                                    </span>
                                    <span className="font-bold text-zinc-900 dark:text-white">
                                        {selectedClaimDetail.reward_name}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">
                                        Poin Ditukar
                                    </span>
                                    <span className="font-bold text-red-600 dark:text-red-400">
                                        -{selectedClaimDetail.points_cost} Poin
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">
                                        Waktu Pengajuan
                                    </span>
                                    <span className="text-zinc-700 dark:text-zinc-300">
                                        {selectedClaimDetail.created_at}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">
                                        Pemeriksa
                                    </span>
                                    <span className="text-zinc-700 dark:text-zinc-300">
                                        {selectedClaimDetail.admin_name}
                                    </span>
                                </div>
                                {selectedClaimDetail.admin_notes && (
                                    <div className="space-y-1 border-t border-zinc-200/60 pt-2 dark:border-zinc-700/60">
                                        <span className="font-semibold text-zinc-500">
                                            Catatan Pemeriksa:
                                        </span>
                                        <p className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                                            {selectedClaimDetail.admin_notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSelectedClaimDetail(null)}
                            className="w-full rounded-xl text-xs font-semibold"
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal 2: Konfirmasi Serah Terima / Persetujuan Hadiah */}
            <Dialog
                open={!!claimToApprove}
                onOpenChange={() => setClaimToApprove(null)}
            >
                <DialogContent className="rounded-3xl border-zinc-200 bg-white p-6 sm:max-w-md dark:border-zinc-800 dark:bg-zinc-900">
                    <DialogHeader className="space-y-2">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                            <Check className="size-6" />
                        </div>
                        <DialogTitle className="text-center text-lg font-bold text-zinc-900 dark:text-white">
                            Konfirmasi Serah Terima Hadiah
                        </DialogTitle>
                        <DialogDescription className="text-center text-xs text-zinc-500">
                            Pastikan voucher atau fisik hadiah telah diserahkan
                            langsung kepada member yang bersangkutan.
                        </DialogDescription>
                    </DialogHeader>

                    {claimToApprove && (
                        <div className="space-y-3 py-2 text-xs">
                            <div className="space-y-1.5 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700/60 dark:bg-zinc-800/60">
                                <div className="font-bold text-zinc-900 dark:text-white">
                                    {claimToApprove.reward_name}
                                </div>
                                <div className="text-zinc-500">
                                    Member:{' '}
                                    <strong>{claimToApprove.user_name}</strong>{' '}
                                    (ID: {claimToApprove.user_id})
                                </div>
                                <div className="font-semibold text-emerald-600">
                                    Biaya Poin: {claimToApprove.points_cost} Pts
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="approveNotes"
                                    className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                                >
                                    Catatan Serah Terima (Opsional)
                                </Label>
                                <Input
                                    id="approveNotes"
                                    type="text"
                                    placeholder="Contoh: Diserahkan di kasir AHASS nomor 2"
                                    value={actionNotes}
                                    onChange={(e) =>
                                        setActionNotes(e.target.value)
                                    }
                                    className="h-10 rounded-xl text-xs"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setClaimToApprove(null)}
                            disabled={isActionProcessing}
                            className="flex-1 rounded-xl text-xs font-semibold"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleApproveClaim}
                            disabled={isActionProcessing}
                            className="flex-1 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                            {isActionProcessing
                                ? 'Memproses...'
                                : 'Ya, Setujui & Serahkan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal 3: Konfirmasi Penolakan Klaim (Refund Poin & Stok) */}
            <Dialog
                open={!!claimToReject}
                onOpenChange={() => setClaimToReject(null)}
            >
                <DialogContent className="rounded-3xl border-zinc-200 bg-white p-6 sm:max-w-md dark:border-zinc-800 dark:bg-zinc-900">
                    <DialogHeader className="space-y-2">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                            <X className="size-6" />
                        </div>
                        <DialogTitle className="text-center text-lg font-bold text-zinc-900 dark:text-white">
                            Tolak Klaim Reward
                        </DialogTitle>
                        <DialogDescription className="text-center text-xs text-zinc-500">
                            Saldo{' '}
                            <strong>{claimToReject?.points_cost} Poin</strong>{' '}
                            dan <strong>1 Stok Hadiah</strong> akan dikembalikan
                            secara otomatis ke akun member.
                        </DialogDescription>
                    </DialogHeader>

                    {claimToReject && (
                        <div className="space-y-3 py-2 text-xs">
                            <div className="space-y-1.5 rounded-2xl border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-900/60 dark:bg-rose-950/20">
                                <div className="font-bold text-zinc-900 dark:text-white">
                                    {claimToReject.reward_name}
                                </div>
                                <div className="text-zinc-500">
                                    Member:{' '}
                                    <strong>{claimToReject.user_name}</strong>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="rejectNotes"
                                    className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                                >
                                    Alasan Penolakan
                                </Label>
                                <textarea
                                    id="rejectNotes"
                                    placeholder="Contoh: Stok merchandise di dealer habis atau masa penukaran lewat batas"
                                    value={actionNotes}
                                    onChange={(e) =>
                                        setActionNotes(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs shadow-xs placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setClaimToReject(null)}
                            disabled={isActionProcessing}
                            className="flex-1 rounded-xl text-xs font-semibold"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleRejectClaim}
                            disabled={isActionProcessing}
                            className="flex-1 rounded-xl bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700"
                        >
                            {isActionProcessing
                                ? 'Memproses...'
                                : 'Tolak & Kembalikan Poin'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* FLOATING MOBILE STICKY ACTION BAR: Pops up when member is selected on phone screens */}
            {member && showMobileBar && (
                <div className="fixed inset-x-3 bottom-4 z-30 sm:inset-x-6 lg:hidden">
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-950/95 p-3 text-white shadow-2xl shadow-black/50 backdrop-blur-xl dark:bg-zinc-900/95">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                                <span className="truncate text-xs font-bold text-white">
                                    {member.name}
                                </span>
                                <Badge className="border-0 bg-red-600 px-1.5 py-0 font-mono text-[10px] text-white">
                                    {member.points.toLocaleString('id-ID')} PTS
                                </Badge>
                            </div>
                            <p className="truncate text-[10px] text-zinc-400">
                                {memberClaims.filter((c) => c.status === 'hold')
                                    .length > 0
                                    ? `${memberClaims.filter((c) => c.status === 'hold').length} klaim menunggu verifikasi`
                                    : 'Semua klaim reward terselesaikan'}
                            </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                            <Link
                                href={`/admin/scan?user_id=${member.id}`}
                                className="flex h-9 cursor-pointer items-center gap-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-xs font-bold text-white transition-all hover:bg-zinc-700"
                            >
                                <Zap className="size-3 text-amber-400" />
                                Poin
                            </Link>
                            <Button
                                type="button"
                                onClick={() => {
                                    memberCardRef.current?.scrollIntoView({
                                        behavior: 'smooth',
                                        block: 'start',
                                    });
                                }}
                                className="h-9 cursor-pointer rounded-xl bg-red-600 px-3.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 transition-all hover:bg-red-700"
                            >
                                Klaim
                            </Button>
                            <button
                                type="button"
                                onClick={() => setShowMobileBar(false)}
                                className="flex size-8 cursor-pointer items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                                title="Tutup bilah ringkasan"
                                aria-label="Tutup bilah ringkasan"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

AdminScanUserIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Admin Console', href: '/admin/dashboard' },
            { title: 'Scan / Input User', href: '/admin/scan-user' },
        ]}
    >
        {page}
    </AppLayout>
);
