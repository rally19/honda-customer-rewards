import { Head, router } from '@inertiajs/react';
import { useLiveSync } from '@/hooks/use-live-sync';
import { broadcastLiveEvent } from '@/lib/live-sync';
import {
    AlertCircle,
    ArrowRight,
    Award,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    Download,
    Eye,
    Maximize2,
    Minimize2,
    Plus,
    QrCode as QrCodeIcon,
    Radio,
    RefreshCw,
    RotateCcw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    UserCheck,
    Users,
    X,
    XCircle,
    Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import QrCode, { type QrCodeHandle } from '@/components/qr-code';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
};

type ActiveToken = {
    id: string;
    token: string;
    activity_id: string;
    activity_name: string;
    points: number;
    notes: string;
    status: 'active' | 'pending_confirmation' | 'claimed' | 'rejected' | 'expired' | 'cancelled' | string;
    requires_manual_confirmation: boolean;
    auto_regenerate: boolean;
    duration_minutes: number;
    admin_id: string;
    admin_name: string;
    scanned_by_user_id: string | null;
    scanned_by_user_name: string | null;
    scanned_by_user_phone?: string | null;
    scanned_by_user_tier?: string | null;
    scanned_at: string | null;
    expires_at: string;
    expires_at_formatted: string;
    seconds_remaining: number;
    created_at: string;
};

type RecentToken = {
    id: string;
    token: string;
    activity_id: string;
    activity_name: string;
    points: number;
    status: string;
    requires_manual_confirmation: boolean;
    auto_regenerate: boolean;
    duration_minutes: number;
    admin_id: string | null;
    admin_name: string;
    scanned_by_user_id: string | null;
    scanned_by_user_name: string;
    scanned_by_user_phone: string;
    scanned_at: string;
    claimed_at: string;
    expires_at: string;
    expires_at_formatted: string;
    created_at: string;
};

type Stats = {
    activeTokensCount: number;
    pendingConfirmationCount: number;
    todayClaimedCount: number;
    todayClaimedPoints: number;
};

type Props = {
    activities: ActivityItem[];
    activeToken: ActiveToken | null;
    recentTokens: RecentToken[];
    stats: Stats;
};

const DURATION_OPTIONS = [
    { label: '1 Menit', value: 1 },
    { label: '3 Menit', value: 3 },
    { label: '5 Menit', value: 5, recommended: true },
    { label: '10 Menit', value: 10 },
    { label: '15 Menit', value: 15 },
    { label: '30 Menit', value: 30 },
];

export default function AdminQrPointPage({
    activities = [],
    activeToken,
    recentTokens = [],
    stats,
}: Props) {
    // Enable live background synchronization every 3 seconds
    useLiveSync();

    // Form selection states
    const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(() => {
        if (activeToken) {
            const found = activities.find((a) => a.id === activeToken.activity_id);
            if (found) return found;
        }
        return activities.length > 0 ? activities[0] : null;
    });
    const [activitySearch, setActivitySearch] = useState('');
    const [customPoints, setCustomPoints] = useState<number | ''>('');
    const [durationMinutes, setDurationMinutes] = useState<number>(5);
    const [autoRegenerate, setAutoRegenerate] = useState<boolean>(true);
    const [requiresManualConfirmation, setRequiresManualConfirmation] = useState<boolean>(false);
    const [notes, setNotes] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isActionProcessing, setIsActionProcessing] = useState(false);

    // Full screen presentation mode
    const [isFullScreen, setIsFullScreen] = useState(false);

    // QR ref for downloading
    const qrCodeRef = useRef<QrCodeHandle>(null);
    const fullScreenQrRef = useRef<QrCodeHandle>(null);

    // Timer seconds remaining countdown
    const [secondsLeft, setSecondsLeft] = useState<number>(
        activeToken ? Math.max(0, Math.floor(activeToken.seconds_remaining)) : 0
    );

    useEffect(() => {
        if (activeToken) {
            setSecondsLeft(Math.max(0, Math.floor(activeToken.seconds_remaining)));
        } else {
            setSecondsLeft(0);
        }
    }, [activeToken]);

    useEffect(() => {
        if (secondsLeft <= 0) return;
        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.reload({
                        only: ['activeToken', 'recentTokens', 'stats'],
                        onSuccess: (page) => {
                            const newActive = (page.props as unknown as { activeToken?: ActiveToken | null }).activeToken;
                            if (newActive && newActive.id !== activeToken?.id) {
                                toast.info('QR Poin otomatis diperbarui dengan kode baru.');
                            }
                        },
                    });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [secondsLeft, activeToken]);

    // Format timer MM:SS
    const formatTimer = (sec: number) => {
        const total = Math.max(0, Math.floor(sec));
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Filter activities by search
    const filteredActivities = useMemo(() => {
        if (!activitySearch.trim()) return activities;
        const q = activitySearch.toLowerCase();
        return activities.filter(
            (a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
        );
    }, [activities, activitySearch]);

    // Handle Select Activity
    const handleSelectActivity = (act: ActivityItem) => {
        setSelectedActivity(act);
        setCustomPoints('');
    };

    // Points to award
    const effectivePoints = useMemo(() => {
        if (customPoints !== '' && Number(customPoints) > 0) {
            return Number(customPoints);
        }
        return selectedActivity?.points || 0;
    }, [customPoints, selectedActivity]);

    // Handle Generate QR
    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedActivity) {
            toast.error('Pilih aktivitas servis/layanan terlebih dahulu.');
            return;
        }

        setIsGenerating(true);
        router.post(
            '/admin/qr-poin/generate',
            {
                activity_id: selectedActivity.id,
                points: effectivePoints,
                duration_minutes: durationMinutes,
                auto_regenerate: autoRegenerate,
                requires_manual_confirmation: requiresManualConfirmation,
                notes: notes.trim() || undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsGenerating(false);
                    toast.success('QR Poin berhasil digenerate dan siap discan pelanggan!');
                    broadcastLiveEvent('QR_POINT_GENERATED', {
                        activity_name: selectedActivity.name,
                        points: effectivePoints,
                    });
                },
                onError: (errors) => {
                    setIsGenerating(false);
                    const msg = Object.values(errors)[0] as string;
                    toast.error(msg || 'Gagal generate QR Poin.');
                },
            }
        );
    };

    // Handle Cancel Active QR
    const handleCancel = (tokenObj: ActiveToken) => {
        if (isActionProcessing) return;
        setIsActionProcessing(true);
        router.post(
            `/admin/qr-poin/${tokenObj.id}/cancel`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsActionProcessing(false);
                    toast.info('QR Poin berhasil dibatalkan.');
                    broadcastLiveEvent('ACTIVITY_MUTATED');
                },
                onError: () => {
                    setIsActionProcessing(false);
                    toast.error('Gagal membatalkan QR.');
                },
            }
        );
    };

    // Handle Confirm Pending Scan
    const handleConfirm = (tokenObj: ActiveToken | RecentToken) => {
        if (isActionProcessing) return;
        setIsActionProcessing(true);
        router.post(
            `/admin/qr-poin/${tokenObj.id}/confirm`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsActionProcessing(false);
                    toast.success(`Konfirmasi sukses! Poin telah diberikan kepada pelanggan.`);
                    broadcastLiveEvent('POINTS_AWARDED');
                },
                onError: () => {
                    setIsActionProcessing(false);
                    toast.error('Gagal mengonfirmasi QR.');
                },
            }
        );
    };

    // Handle Reject Pending Scan
    const handleReject = (tokenObj: ActiveToken | RecentToken) => {
        if (isActionProcessing) return;
        setIsActionProcessing(true);
        router.post(
            `/admin/qr-poin/${tokenObj.id}/reject`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsActionProcessing(false);
                    toast.info('Klaim QR Poin telah ditolak.');
                    broadcastLiveEvent('ACTIVITY_MUTATED');
                },
                onError: () => {
                    setIsActionProcessing(false);
                    toast.error('Gagal menolak klaim.');
                },
            }
        );
    };

    // ESC key listener to exit full screen
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullScreen) {
                setIsFullScreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullScreen]);

    // Copy Token Code helper
    const [copiedToken, setCopiedToken] = useState(false);
    const handleCopyToken = (t: string) => {
        navigator.clipboard.writeText(t);
        setCopiedToken(true);
        toast.success('Kode QR Poin disalin ke clipboard!');
        setTimeout(() => setCopiedToken(false), 2000);
    };

    return (
        <>
            <Head title="QR Poin - Time-based One-time QR" />

            <div className="mx-auto max-w-7xl space-y-6 p-3 sm:p-5 md:space-y-8 md:p-6">
                {/* Header Title Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-red-600 via-red-700 to-zinc-900 p-5 text-white shadow-xl shadow-red-600/15 sm:p-6 md:p-8">
                    <div className="pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 size-64 rounded-full bg-white/5 blur-2xl" />
                    <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-semibold tracking-wider text-red-100 uppercase backdrop-blur-md sm:text-xs">
                                <Sparkles className="size-3.5" />
                                Official AHASS Time-Based QR Point System
                            </div>
                            <h1 className="text-xl font-black tracking-tight sm:text-2xl md:text-3xl">
                                QR Poin Satu Kali Pakai
                            </h1>
                            <p className="max-w-2xl text-xs leading-relaxed text-red-100/80 sm:text-sm">
                                Generate kode QR berbasis waktu untuk aktivitas layanan pelanggan. Dilengkapi opsi auto-generate otomatis, konfirmasi manual kasir, dan mode display layar penuh.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="grid shrink-0 grid-cols-3 gap-2.5 rounded-2xl border border-white/15 bg-black/20 p-3 backdrop-blur-md sm:flex sm:items-center">
                                <div className="px-3 py-1 text-center">
                                    <div className="text-lg font-black text-white">
                                        {stats?.activeTokensCount ?? 0}
                                    </div>
                                    <div className="text-[10px] font-bold text-red-200 uppercase">
                                        QR Aktif
                                    </div>
                                </div>
                                <div className="hidden h-8 w-px bg-white/20 sm:block" />
                                <div className="px-3 py-1 text-center">
                                    <div className="text-lg font-black text-amber-300">
                                        {stats?.pendingConfirmationCount ?? 0}
                                    </div>
                                    <div className="text-[10px] font-bold text-red-200 uppercase">
                                        Konfirmasi
                                    </div>
                                </div>
                                <div className="hidden h-8 w-px bg-white/20 sm:block" />
                                <div className="px-3 py-1 text-center">
                                    <div className="text-lg font-black text-emerald-300">
                                        +{stats?.todayClaimedPoints ?? 0}
                                    </div>
                                    <div className="text-[10px] font-bold text-red-200 uppercase">
                                        Poin Masuk
                                    </div>
                                </div>
                            </div>

                            {activeToken && activeToken.status === 'active' && (
                                <Button
                                    type="button"
                                    onClick={() => setIsFullScreen(true)}
                                    className="h-11 cursor-pointer gap-2 rounded-2xl border border-white/20 bg-white/20 px-4 text-xs font-bold text-white shadow-lg backdrop-blur-md hover:bg-white hover:text-red-700 active:scale-95"
                                >
                                    <Maximize2 className="size-4" />
                                    Layar Penuh
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Interactive Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* LEFT PANEL: Activity Selector & Settings (7 cols) */}
                    <div className="space-y-5 lg:col-span-7">
                        <Card className="overflow-hidden rounded-3xl border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="border-b border-zinc-100 bg-zinc-50/70 px-5 py-3.5 dark:border-zinc-800 dark:bg-zinc-950/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Award className="size-4 text-red-600 dark:text-red-500" />
                                        <span className="text-xs font-bold tracking-wider text-zinc-700 uppercase dark:text-zinc-300">
                                            1. Pilih Aktivitas Layanan
                                        </span>
                                    </div>
                                    <Badge variant="outline" className="text-[10px]">
                                        {filteredActivities.length} Aktivitas
                                    </Badge>
                                </div>
                            </div>

                            <CardContent className="space-y-4 p-5">
                                {/* Search activity */}
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                                    <Input
                                        placeholder="Cari aktivitas servis, ganti oli, beli sparepart..."
                                        value={activitySearch}
                                        onChange={(e) => setActivitySearch(e.target.value)}
                                        className="h-10 rounded-xl pl-9 text-xs"
                                    />
                                    {activitySearch && (
                                        <button
                                            type="button"
                                            onClick={() => setActivitySearch('')}
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Activity Cards Grid */}
                                <div className="grid max-h-64 grid-cols-1 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
                                    {filteredActivities.map((act) => {
                                        const isSelected = selectedActivity?.id === act.id;
                                        return (
                                            <button
                                                key={act.id}
                                                type="button"
                                                onClick={() => handleSelectActivity(act)}
                                                className={`flex cursor-pointer flex-col justify-between gap-2.5 rounded-2xl border p-3.5 text-left transition-all active:scale-[0.99] ${
                                                    isSelected
                                                        ? 'border-red-600 bg-red-50/70 shadow-xs ring-1 ring-red-600/30 dark:border-red-500 dark:bg-red-950/40'
                                                        : 'border-zinc-200 bg-zinc-50/40 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-zinc-700'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                                        {act.name}
                                                    </span>
                                                    <Badge
                                                        className={`shrink-0 font-mono text-[10px] font-black ${
                                                            isSelected
                                                                ? 'bg-red-600 text-white'
                                                                : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                                                        }`}
                                                    >
                                                        +{act.points} PTS
                                                    </Badge>
                                                </div>
                                                {act.description && (
                                                    <p className="line-clamp-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                                                        {act.description}
                                                    </p>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Point Override & Duration Row */}
                                <div className="grid grid-cols-1 gap-4 border-t border-zinc-100 pt-3 sm:grid-cols-2 dark:border-zinc-800">
                                    <div>
                                        <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                            Jumlah Poin Diberikan
                                        </Label>
                                        <div className="relative mt-1">
                                            <Input
                                                type="number"
                                                min={1}
                                                max={100000}
                                                placeholder={selectedActivity ? String(selectedActivity.points) : '0'}
                                                value={customPoints}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setCustomPoints(val === '' ? '' : Math.max(1, Number(val)));
                                                }}
                                                className="h-10 rounded-xl pr-12 font-mono text-sm font-bold text-red-600 dark:text-red-400"
                                            />
                                            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-bold text-zinc-400">
                                                PTS
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                            Durasi QR Aktif
                                        </Label>
                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                            {DURATION_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setDurationMinutes(opt.value)}
                                                    className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                                                        durationMinutes === opt.value
                                                            ? 'bg-red-600 text-white shadow-xs'
                                                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Options & Toggles */}
                                <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
                                    <div className="text-[11px] font-bold text-zinc-500 uppercase dark:text-zinc-400">
                                        2. Opsi & Otomasi QR
                                    </div>

                                    {/* Toggle 1: Auto-generate */}
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <span className="block text-xs font-bold text-zinc-900 dark:text-white">
                                                Auto-Generate QR Baru
                                            </span>
                                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                                Otomatis buat QR baru untuk aktivitas yang sama setelah QR ini terpakai atau waktu habis (expired).
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={autoRegenerate}
                                            onClick={() => setAutoRegenerate(!autoRegenerate)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                                autoRegenerate ? 'bg-red-600' : 'bg-zinc-300 dark:bg-zinc-700'
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                    autoRegenerate ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    {/* Toggle 2: Manual Confirmation */}
                                    <div className="flex items-center justify-between gap-4 border-t border-zinc-200/60 pt-3 dark:border-zinc-800/60">
                                        <div>
                                            <span className="block text-xs font-bold text-zinc-900 dark:text-white">
                                                Konfirmasi Manual Kasir
                                            </span>
                                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                                Wajibkan persetujuan admin/kasir sebelum poin resmi masuk ke akun pelanggan.
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={requiresManualConfirmation}
                                            onClick={() =>
                                                setRequiresManualConfirmation(!requiresManualConfirmation)
                                            }
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                                requiresManualConfirmation ? 'bg-red-600' : 'bg-zinc-300 dark:bg-zinc-700'
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                    requiresManualConfirmation ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Generate Button */}
                                <Button
                                    type="button"
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !selectedActivity}
                                    className="h-12 w-full cursor-pointer gap-2 rounded-2xl bg-red-600 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition-all hover:bg-red-700 active:scale-[0.99]"
                                >
                                    {isGenerating ? (
                                        <>
                                            <RefreshCw className="size-4 animate-spin" />
                                            Membuat QR Poin...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="size-4" />
                                            Generate QR Poin (+{effectivePoints} PTS)
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT PANEL: Live QR Display (5 cols) */}
                    <div className="space-y-5 lg:col-span-5">
                        {activeToken && activeToken.status !== 'cancelled' && activeToken.status !== 'expired' ? (
                            <Card className="overflow-hidden rounded-3xl border-2 border-red-500/30 bg-white shadow-xl shadow-red-500/5 dark:border-red-500/20 dark:bg-zinc-900">
                                <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/50">
                                    <div className="flex items-center gap-2">
                                        <span className="flex size-2.5 rounded-full bg-emerald-500 animate-ping" />
                                        <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                            {activeToken.token}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleCopyToken(activeToken.token)}
                                            className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800"
                                            title="Salin Token"
                                        >
                                            {copiedToken ? (
                                                <Check className="size-4 text-emerald-500" />
                                            ) : (
                                                <Copy className="size-4" />
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsFullScreen(true)}
                                            className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800"
                                            title="Mode Layar Penuh"
                                        >
                                            <Maximize2 className="size-4" />
                                        </button>
                                    </div>
                                </div>

                                <CardContent className="flex flex-col items-center space-y-4 p-5 text-center">
                                    {/* Activity Header */}
                                    <div>
                                        <Badge className="bg-red-600 px-3 py-1 font-mono text-xs font-black text-white">
                                            +{activeToken.points} POIN
                                        </Badge>
                                        <h3 className="mt-1 text-base font-black text-zinc-900 dark:text-white">
                                            {activeToken.activity_name}
                                        </h3>
                                        <p className="text-[11px] text-zinc-500">
                                            Petugas: {activeToken.admin_name} (ID: #{activeToken.admin_id})
                                        </p>
                                    </div>

                                    {/* QR Code Container */}
                                    <div className="relative flex aspect-square w-full max-w-[280px] items-center justify-center rounded-3xl border-2 border-red-500/20 bg-white p-3 shadow-lg shadow-red-500/10 dark:bg-white">
                                        <QrCode
                                            ref={qrCodeRef}
                                            data={activeToken.token}
                                            width={280}
                                            height={280}
                                            className="flex h-full w-full items-center justify-center"
                                            image="/images/logo/honda_logo_red.png"
                                            dotsColor="#DC2626"
                                            dotsType="rounded"
                                            cornersSquareType="extra-rounded"
                                            cornersDotType="dot"
                                        />
                                    </div>

                                    {/* Timer Countdown Display */}
                                    <div className="w-full space-y-1.5 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="flex items-center gap-1 text-zinc-500">
                                                <Clock className="size-3.5 text-zinc-400" />
                                                Waktu Tersisa:
                                            </span>
                                            <span
                                                className={`font-mono text-sm font-black tracking-wider ${
                                                    secondsLeft < 30
                                                        ? 'text-red-600 animate-pulse'
                                                        : secondsLeft < 60
                                                        ? 'text-amber-600'
                                                        : 'text-zinc-900 dark:text-white'
                                                }`}
                                            >
                                                {formatTimer(secondsLeft)}
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                                            <div
                                                className={`h-full transition-all duration-1000 ${
                                                    secondsLeft < 30 ? 'bg-red-600' : 'bg-emerald-500'
                                                }`}
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        (secondsLeft / (activeToken.duration_minutes * 60)) * 100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Pending Confirmation Alert Box */}
                                    {activeToken.status === 'pending_confirmation' && (
                                        <div className="w-full space-y-2.5 rounded-2xl border-2 border-amber-500/40 bg-amber-50/70 p-3.5 text-left dark:border-amber-500/30 dark:bg-amber-950/40">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                                                <ShieldAlert className="size-4 animate-bounce" />
                                                <span>Pelanggan Telah Memindai QR!</span>
                                            </div>
                                            <div className="rounded-xl bg-white p-2.5 text-xs dark:bg-zinc-900">
                                                <div className="font-bold text-zinc-900 dark:text-white">
                                                    {activeToken.scanned_by_user_name}
                                                </div>
                                                <div className="font-mono text-[11px] text-zinc-500">
                                                    ID: #{activeToken.scanned_by_user_id} &bull;{' '}
                                                    {activeToken.scanned_by_user_phone || 'Tanpa No. HP'}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 pt-1">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    disabled={isActionProcessing}
                                                    onClick={() => handleConfirm(activeToken)}
                                                    className="h-9 flex-1 cursor-pointer bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                                                >
                                                    <Check className="mr-1 size-3.5" />
                                                    Setujui & Berikan Poin
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={isActionProcessing}
                                                    onClick={() => handleReject(activeToken)}
                                                    className="h-9 cursor-pointer text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                                >
                                                    Tolak
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action buttons */}
                                    <div className="flex w-full items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                qrCodeRef.current?.download(
                                                    `qr-poin-${activeToken.token}`,
                                                    'png'
                                                )
                                            }
                                            className="h-9 flex-1 rounded-xl text-xs"
                                        >
                                            <Download className="mr-1.5 size-3.5" />
                                            Unduh
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsFullScreen(true)}
                                            className="h-9 flex-1 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                                        >
                                            <Maximize2 className="mr-1.5 size-3.5" />
                                            Layar Penuh
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            disabled={isActionProcessing}
                                            onClick={() => handleCancel(activeToken)}
                                            className="h-9 rounded-xl text-xs text-zinc-500 hover:text-red-600"
                                        >
                                            Batalkan
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-950/20">
                                <div className="flex size-16 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-400 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                                    <QrCodeIcon className="size-8 text-zinc-300 dark:text-zinc-600" />
                                </div>
                                <h4 className="mt-4 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                    Belum Ada QR Poin Aktif
                                </h4>
                                <p className="mt-1 max-w-xs text-xs text-zinc-500 dark:text-zinc-400">
                                    Pilih aktivitas layanan di sebelah kiri lalu tekan tombol{' '}
                                    <strong className="text-red-600">Generate QR Poin</strong> untuk menampilkan QR code.
                                </p>
                            </Card>
                        )}
                    </div>
                </div>

                {/* BOTTOM SECTION: Today's QR Tokens History */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="size-4 text-zinc-500" />
                            <h3 className="text-sm font-black tracking-tight text-zinc-900 uppercase dark:text-white">
                                Riwayat QR Poin Hari Ini
                            </h3>
                        </div>
                        <Badge variant="outline" className="text-xs">
                            {recentTokens.length} Transaksi QR
                        </Badge>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-zinc-200 bg-zinc-50/80 font-bold text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-950/60">
                                    <tr>
                                        <th className="px-4 py-3">Token & Waktu</th>
                                        <th className="px-4 py-3">Aktivitas Layanan</th>
                                        <th className="px-4 py-3">Poin</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Pelanggan Pemindai</th>
                                        <th className="px-4 py-3">Petugas Admin</th>
                                        <th className="px-4 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                                    {recentTokens.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-zinc-400">
                                                Belum ada riwayat pembuatan QR Poin hari ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        recentTokens.map((t) => (
                                            <tr key={t.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                                        {t.token}
                                                    </span>
                                                    <span className="block text-[10px] text-zinc-400">
                                                        {t.created_at} ({t.duration_minutes}m)
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-zinc-800 dark:text-zinc-200">
                                                    {t.activity_name}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="font-mono font-black text-red-600 dark:text-red-400">
                                                        +{t.points} PTS
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {t.status === 'active' && (
                                                        <Badge className="bg-emerald-500 text-white">Aktif</Badge>
                                                    )}
                                                    {t.status === 'pending_confirmation' && (
                                                        <Badge className="bg-amber-500 text-white animate-pulse">
                                                            Menunggu Konfirmasi
                                                        </Badge>
                                                    )}
                                                    {t.status === 'claimed' && (
                                                        <Badge className="bg-blue-600 text-white">Sukses Diklaim</Badge>
                                                    )}
                                                    {t.status === 'expired' && (
                                                        <Badge variant="outline" className="text-zinc-400">
                                                            Kedaluwarsa
                                                        </Badge>
                                                    )}
                                                    {t.status === 'cancelled' && (
                                                        <Badge variant="outline" className="text-zinc-400">
                                                            Dibatalkan
                                                        </Badge>
                                                    )}
                                                    {t.status === 'rejected' && (
                                                        <Badge className="bg-red-500 text-white">Ditolak</Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {t.scanned_by_user_name !== '-' ? (
                                                        <div>
                                                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                                                {t.scanned_by_user_name}
                                                            </span>
                                                            <span className="block font-mono text-[10px] text-zinc-400">
                                                                ID: #{t.scanned_by_user_id}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-zinc-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                                                    <div>{t.admin_name}</div>
                                                    {t.admin_id && (
                                                        <span className="font-mono text-[10px] text-zinc-400">
                                                            ID: #{t.admin_id}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    {t.status === 'pending_confirmation' && (
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleConfirm(t)}
                                                                disabled={isActionProcessing}
                                                                className="h-7 cursor-pointer bg-emerald-600 px-2 text-[11px] font-bold text-white hover:bg-emerald-700"
                                                            >
                                                                Setujui
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleReject(t)}
                                                                disabled={isActionProcessing}
                                                                className="h-7 cursor-pointer px-2 text-[11px] text-red-600 hover:bg-red-50"
                                                            >
                                                                Tolak
                                                            </Button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* FULL SCREEN PRESENTATION MODAL / DISPLAY */}
            {isFullScreen && activeToken && (
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-zinc-950 p-6 text-white select-none">
                    {/* Top Bar */}
                    <div className="flex w-full max-w-4xl items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img
                                src="/images/logo/anper_sartika_logo_redbg_white_1x1_512.png"
                                alt="Honda AHASS"
                                className="size-11 rounded-xl object-contain shadow-md"
                            />
                            <div>
                                <h2 className="text-base font-black tracking-tight text-white sm:text-lg">
                                    AHASS REWARDS POINT
                                </h2>
                                <p className="text-xs text-zinc-400">
                                    Scan QR code menggunakan aplikasi Honda Rewards Anda
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsFullScreen(false)}
                            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-bold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                        >
                            <Minimize2 className="size-4" />
                            <span>Tutup Layar Penuh (ESC)</span>
                        </button>
                    </div>

                    {/* Center Card */}
                    <div className="flex flex-col items-center space-y-5 text-center">
                        <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-600/20 px-3 py-1 font-mono text-xs font-black text-red-400">
                                <Sparkles className="size-3.5" />
                                HADIAH +{activeToken.points} POIN
                            </span>
                            <h1 className="text-2xl font-black text-white sm:text-4xl">
                                {activeToken.activity_name}
                            </h1>
                        </div>

                        {/* Huge QR Code */}
                        <div className="relative flex aspect-square w-72 items-center justify-center rounded-3xl border-4 border-red-600/40 bg-white p-4 shadow-2xl shadow-red-600/20 sm:w-96">
                            <QrCode
                                ref={fullScreenQrRef}
                                data={activeToken.token}
                                width={380}
                                height={380}
                                className="flex h-full w-full items-center justify-center"
                                image="/images/logo/honda_logo_red.png"
                                dotsColor="#DC2626"
                                dotsType="rounded"
                                cornersSquareType="extra-rounded"
                                cornersDotType="dot"
                            />
                        </div>

                        {/* Live Status & Countdown */}
                        <div className="flex flex-col items-center space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs font-bold text-zinc-300">
                                    <Clock className="size-4 text-red-500" />
                                    <span>Berlaku s/d:</span>
                                    <span className="font-mono text-sm font-black text-red-400">
                                        {formatTimer(secondsLeft)}
                                    </span>
                                </span>

                                <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 font-mono text-xs font-bold text-zinc-400">
                                    {activeToken.token}
                                </span>
                            </div>

                            {/* Pending Confirmation Status in Full Screen */}
                            {activeToken.status === 'pending_confirmation' && (
                                <div className="mt-3 flex items-center gap-4 rounded-2xl border-2 border-amber-500 bg-amber-950/80 p-4 text-left shadow-xl animate-pulse">
                                    <div>
                                        <div className="text-xs font-bold text-amber-400">
                                            Pemindaian Terdeteksi!
                                        </div>
                                        <div className="text-sm font-black text-white">
                                            {activeToken.scanned_by_user_name}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            disabled={isActionProcessing}
                                            onClick={() => handleConfirm(activeToken)}
                                            className="h-9 bg-emerald-600 font-bold text-white hover:bg-emerald-700"
                                        >
                                            <Check className="mr-1 size-4" />
                                            Setujui Poin
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            disabled={isActionProcessing}
                                            onClick={() => handleReject(activeToken)}
                                            className="h-9 text-red-400 hover:bg-red-950/50"
                                        >
                                            Tolak
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Instructions */}
                    <div className="flex w-full max-w-xl items-center justify-around rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 text-xs text-zinc-400 backdrop-blur-xs">
                        <div className="flex items-center gap-2">
                            <span className="flex size-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                                1
                            </span>
                            <span>Buka Honda Rewards</span>
                        </div>
                        <ArrowRight className="size-3.5 text-zinc-600" />
                        <div className="flex items-center gap-2">
                            <span className="flex size-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                                2
                            </span>
                            <span>Tekan Tombol QR</span>
                        </div>
                        <ArrowRight className="size-3.5 text-zinc-600" />
                        <div className="flex items-center gap-2">
                            <span className="flex size-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                                3
                            </span>
                            <span>Pilih Scan Kamera</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

AdminQrPointPage.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Admin Console', href: '/admin/dashboard' },
            { title: 'Scan / Input', href: '/admin/scan' },
            { title: 'QR Poin', href: '/admin/qr-poin' },
        ]}
    >
        {page}
    </AppLayout>
);
