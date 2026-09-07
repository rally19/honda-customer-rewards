import { Head, Link, router } from '@inertiajs/react';
import { Scanner } from '@yudiel/react-qr-scanner';
import {
    AlertCircle,
    ArrowRight,
    Award,
    Camera,
    CameraOff,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    Flame,
    Gift,
    History,
    Keyboard,
    MapPin,
    Phone,
    Plus,
    QrCode,
    RefreshCw,
    RotateCcw,
    Search,
    Shield,
    ShieldCheck,
    Sparkles,
    SwitchCamera,
    User,
    UserCheck,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/error-boundary';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';

type ActivityItem = {
    id: string;
    name: string;
    points: number;
    description: string;
};

type RecentScan = {
    id: string;
    activity_name: string;
    points: number;
    user_id: string;
    user_name: string;
    user_tier: string;
    admin_name: string;
    time_ago: string;
    created_at: string;
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
    email_verified?: boolean;
    created_at?: string;
};

type AwardedSession = {
    history_id: string;
    user_id: string;
    user_name: string;
    activity_name: string;
    points_added: number;
    current_points: number;
    lifetime_points: number;
    tier: string;
    tier_upgraded: boolean;
    old_tier: string;
    new_tier: string;
};

type ScanStats = {
    activeActivities: number;
    todayPointsAwarded: number;
    todayScansCount: number;
    totalScans: number;
};

type Props = {
    activities: ActivityItem[];
    recentScans: RecentScan[];
    awarded?: AwardedSession | null;
    stats?: ScanStats;
    initialMember?: MemberData | null;
};

export default function AdminScanIndex({
    activities,
    recentScans,
    awarded,
    stats,
    initialMember = null,
}: Props) {
    // 0. Mounted state to guarantee 100% SSR hydration match
    const [isMounted, setIsMounted] = useState(false);

    // 1. Selected Activity & Custom Points (deterministik awal agar cocok dengan SSR)
    const [selectedActivity, setSelectedActivity] =
        useState<ActivityItem | null>(() => {
            return activities.length > 0 ? activities[0] : null;
        });

    const [customPoints, setCustomPoints] = useState<number | ''>(() => {
        return activities.length > 0 ? activities[0].points : 0;
    });

    const [notes, setNotes] = useState('');
    const [activitySearch, setActivitySearch] = useState('');

    // Filter activities by name, description, points, or ID
    const filteredActivities = useMemo(() => {
        if (!activitySearch.trim()) return activities;
        const q = activitySearch.toLowerCase().trim();
        return activities.filter((act) => {
            const nameMatch = act.name.toLowerCase().includes(q);
            const descMatch = act.description
                ? act.description.toLowerCase().includes(q)
                : false;
            const idMatch = act.id.toLowerCase().includes(q);
            const pointsMatch = act.points.toString().includes(q);
            return nameMatch || descMatch || idMatch || pointsMatch;
        });
    }, [activities, activitySearch]);

    // 2. Input Mode ('scanner' | 'manual')
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

    // 3. Manual Input Query
    const [manualIdInput, setManualIdInput] = useState('');

    // 4. Looked-up Member state
    const [isSearching, setIsSearching] = useState(false);
    const [member, setMember] = useState<MemberData | null>(
        initialMember || null,
    );
    const [searchError, setSearchError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState(false);

    // 5. Processing state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastAwarded, setLastAwarded] = useState<AwardedSession | null>(
        awarded || null,
    );

    // 6. Refs
    const isScanningRef = useRef(false);
    const memberCardRef = useRef<HTMLDivElement>(null);

    // Sync from sessionStorage ONLY after mounted on client
    useEffect(() => {
        setIsMounted(true);
        try {
            const savedId = sessionStorage.getItem(
                'honda_scan_selected_activity_id',
            );
            if (savedId) {
                const found = activities.find((a) => a.id === savedId);
                if (found) {
                    setSelectedActivity(found);
                    const savedPoints = sessionStorage.getItem(
                        'honda_scan_custom_points',
                    );
                    if (savedPoints !== null && savedPoints !== '') {
                        const n = Number(savedPoints);
                        if (!isNaN(n) && n > 0) {
                            setCustomPoints(n);
                        } else {
                            setCustomPoints(found.points);
                        }
                    } else {
                        setCustomPoints(found.points);
                    }
                }
            }
        } catch {
            // Ignore storage access issues
        }
    }, [activities]);

    // Update custom points when activity changes & persist to sessionStorage
    const handleSelectActivity = (act: ActivityItem) => {
        setSelectedActivity(act);
        setCustomPoints(act.points);
        try {
            sessionStorage.setItem('honda_scan_selected_activity_id', act.id);
            sessionStorage.setItem(
                'honda_scan_custom_points',
                String(act.points),
            );
        } catch {
            // Ignore storage access issues
        }
    };

    // Safely get CSRF token from meta or cookie
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
            const res = await fetch('/admin/scan/lookup', {
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
                toast.success(`Member ditemukan: ${data.member.name}`);
                playBeepSound();

                // Smooth scroll to member confirmation on mobile
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setTimeout(() => {
                        memberCardRef.current?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'nearest',
                        });
                    }, 100);
                }
            } else {
                setMember(null);
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

    // Beep audio effect on scan & haptic vibration
    const playBeepSound = () => {
        try {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(100);
            }
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
        } catch {
            // Ignore audio context failures
        }
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

    // QR Scanner Callback with debounce and duplicate protection
    const handleQrScan = (detectedCodes: Array<{ rawValue: string }>) => {
        if (!detectedCodes || detectedCodes.length === 0) return;
        if (isScanningRef.current || isSearching || isSubmitting) return;

        const rawVal = detectedCodes[0].rawValue?.trim();
        if (!rawVal) return;

        // If member is already retrieved and matches, do not re-fetch
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

    // Manual Submit Search
    const handleManualSearch = (e: React.FormEvent) => {
        e.preventDefault();
        lookupMember(manualIdInput);
    };

    // Process Award Points
    const handleProcessPoints = () => {
        if (!member || !selectedActivity) return;

        setIsSubmitting(true);

        router.post(
            '/admin/scan',
            {
                user_id: member.id,
                activity_id: selectedActivity.id,
                points:
                    customPoints !== ''
                        ? customPoints
                        : selectedActivity.points,
                notes: notes,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    const sessionAwarded = page.props.awarded as
                        | AwardedSession
                        | undefined;
                    if (sessionAwarded) {
                        setLastAwarded(sessionAwarded);
                    }
                    toast.success(
                        `Sukses! Poin berhasil ditambahkan ke ${member.name}.`,
                    );
                    // Reset member to allow next scan while keeping selectedActivity intact
                    setMember(null);
                    setManualIdInput('');
                    setNotes('');
                },
                onError: (errs) => {
                    toast.error(
                        Object.values(errs)[0] ||
                            'Gagal memproses penambahan poin.',
                    );
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    // Calculate simulation points
    const pointsToAdd =
        customPoints !== ''
            ? Number(customPoints)
            : selectedActivity?.points || 0;
    const simulatedPoints = member ? member.points + pointsToAdd : 0;
    const simulatedLifetime = member ? member.lifetime_points + pointsToAdd : 0;

    // Simulated new tier calculation
    const getSimulatedTier = (lifetime: number) => {
        if (lifetime >= 7000) return 'Diamond';
        if (lifetime >= 3500) return 'Platinum';
        if (lifetime >= 1500) return 'Gold';
        if (lifetime >= 500) return 'Silver';
        return 'Bronze';
    };

    const simulatedTier = member
        ? getSimulatedTier(simulatedLifetime)
        : 'Bronze';
    const isTierUpgraded = member && simulatedTier !== member.tier;

    // Tier badge color helper
    const getTierBadgeStyle = (tierName: string) => {
        switch (tierName) {
            case 'Diamond':
                return 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700';
            case 'Platinum':
                return 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700';
            case 'Gold':
                return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700';
            case 'Silver':
                return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600';
            default:
                return 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700';
        }
    };

    return (
        <>
            <Head title="Scan & Input Poin Pelanggan - Admin Honda Rewards" />

            <div className="mx-auto max-w-7xl space-y-6 p-3 sm:p-5 md:space-y-8 md:p-6">
                {/* Header Title Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-red-600 via-red-700 to-zinc-900 p-5 text-white shadow-xl shadow-red-600/15 sm:p-6 md:p-8">
                    <div className="pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 size-64 rounded-full bg-white/5 blur-2xl" />
                    <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-semibold tracking-wider text-red-100 uppercase backdrop-blur-md sm:text-xs">
                                <QrCode className="size-3.5" />
                                Official AHASS Point Reward System
                            </div>
                            <h1 className="text-xl font-black tracking-tight sm:text-2xl md:text-3xl">
                                Scan QR & Input Poin Member
                            </h1>
                            <p className="max-w-2xl text-xs leading-relaxed text-red-100/80 sm:text-sm">
                                Berikan poin apresiasi kepada pelanggan setia
                                Honda. Pilih jenis aktivitas layanan terlebih
                                dahulu, lalu scan QR atau masukkan ID Member 10
                                digit.
                            </p>
                        </div>

                        <div className="grid shrink-0 grid-cols-3 gap-2.5 rounded-2xl border border-white/15 bg-black/20 p-3 backdrop-blur-md sm:flex sm:items-center">
                            <div className="px-3 py-1 text-center">
                                <div className="text-lg font-black text-white">
                                    {stats?.activeActivities ??
                                        activities.length}
                                </div>
                                <div className="text-[10px] font-bold text-red-200 uppercase">
                                    Aktivitas
                                </div>
                            </div>
                            <div className="hidden h-8 w-px bg-white/20 sm:block" />
                            <div className="px-3 py-1 text-center">
                                <div className="text-lg font-black text-emerald-300">
                                    +
                                    {(
                                        stats?.todayPointsAwarded ?? 0
                                    ).toLocaleString('id-ID')}
                                </div>
                                <div className="text-[10px] font-bold text-red-200 uppercase">
                                    Poin Hari Ini
                                </div>
                            </div>
                            <div className="hidden h-8 w-px bg-white/20 sm:block" />
                            <div className="px-3 py-1 text-center">
                                <div className="text-lg font-black text-amber-300">
                                    {stats?.todayScansCount ?? 0}
                                </div>
                                <div className="text-[10px] font-bold text-red-200 uppercase">
                                    Scan Hari Ini
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Last Awarded Success Alert if any */}
                {lastAwarded && (
                    <div className="animate-smooth-down relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:flex-row sm:items-center md:p-5">
                        <div className="flex items-center gap-3.5">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 sm:size-11">
                                <CheckCircle2 className="size-5 sm:size-6" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-bold text-emerald-900 sm:text-base dark:text-emerald-300">
                                        Poin Sukses Diberikan ke{' '}
                                        {lastAwarded.user_name}
                                    </span>
                                    <Badge className="bg-emerald-600 font-mono text-xs text-white">
                                        +{lastAwarded.points_added} PTS
                                    </Badge>
                                </div>
                                <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                                    Aktivitas:{' '}
                                    <span className="font-semibold">
                                        {lastAwarded.activity_name}
                                    </span>{' '}
                                    | Saldo:{' '}
                                    <span className="font-mono font-bold">
                                        {lastAwarded.current_points.toLocaleString(
                                            'id-ID',
                                        )}{' '}
                                        Pts
                                    </span>{' '}
                                    | Tier:{' '}
                                    <span className="font-bold">
                                        {lastAwarded.tier}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            {lastAwarded.tier_upgraded && (
                                <Badge className="animate-pulse bg-linear-to-r from-amber-500 to-yellow-400 px-2.5 py-1 text-[11px] font-bold text-zinc-950 sm:text-xs">
                                    🎉 NAIK TIER KE {lastAwarded.new_tier}!
                                </Badge>
                            )}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setLastAwarded(null)}
                                className="h-8 rounded-lg px-3 text-xs text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-800"
                            >
                                Tutup
                            </Button>
                        </div>
                    </div>
                )}

                {/* Main 2-Column Workflow */}
                <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-12">
                    {/* Left Column: STEP 1 (Pilih Aktivitas) & STEP 2 (Scan/Input) */}
                    <div className="space-y-5 sm:space-y-6 lg:col-span-7">
                        {/* STEP 1: Pilih Aktivitas */}
                        <div className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-4 shadow-xs sm:p-5 md:p-6 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex size-7 items-center justify-center rounded-xl bg-red-600 text-xs font-bold text-white shadow-xs">
                                        1
                                    </span>
                                    <div>
                                        <h2 className="text-sm font-bold text-zinc-900 sm:text-base dark:text-zinc-100">
                                            Pilih Jenis Aktivitas Layanan
                                        </h2>
                                        <p className="text-xs text-zinc-500">
                                            Tentukan servis atau transaksi yang
                                            dilakukan pelanggan
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {activitySearch.trim() && (
                                        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                            {filteredActivities.length}{' '}
                                            ditemukan
                                        </span>
                                    )}
                                    {selectedActivity && (
                                        <Badge className="border-red-200 bg-red-50 font-mono text-[11px] font-bold text-red-700 sm:text-xs dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                                            +
                                            {customPoints !== ''
                                                ? customPoints
                                                : selectedActivity.points}{' '}
                                            PTS
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Activity Search Input */}
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                                <Input
                                    type="text"
                                    placeholder="Cari aktivitas layanan (nama, deskripsi, poin, atau ID)..."
                                    value={activitySearch}
                                    onChange={(e) =>
                                        setActivitySearch(e.target.value)
                                    }
                                    className="rounded-xl border-zinc-200 bg-zinc-50/70 pr-8 pl-9 text-xs focus-visible:ring-red-500 sm:text-sm dark:border-zinc-700/80 dark:bg-zinc-800/50"
                                />
                                {activitySearch && (
                                    <button
                                        type="button"
                                        onClick={() => setActivitySearch('')}
                                        className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded-md p-1 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
                                        title="Hapus pencarian"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Activity Cards List */}
                            {filteredActivities.length > 0 ? (
                                <div className="grid max-h-72 grid-cols-1 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
                                    {filteredActivities.map((act) => {
                                        const isSelected =
                                            selectedActivity?.id === act.id;
                                        return (
                                            <button
                                                key={act.id}
                                                type="button"
                                                onClick={() =>
                                                    handleSelectActivity(act)
                                                }
                                                className={`flex cursor-pointer flex-col justify-between gap-2.5 rounded-2xl border p-3 text-left transition-all active:scale-[0.99] sm:p-3.5 ${
                                                    isSelected
                                                        ? 'border-red-600 bg-red-50/70 shadow-xs ring-1 ring-red-600/30 dark:border-red-500 dark:bg-red-950/30'
                                                        : 'border-zinc-200 bg-zinc-50/40 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-800/40 dark:hover:border-zinc-700'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 space-y-0.5">
                                                        <span className="block truncate text-xs font-bold text-zinc-900 sm:text-sm dark:text-zinc-100">
                                                            {act.name}
                                                        </span>
                                                        <p className="line-clamp-1 text-[11px] text-zinc-500">
                                                            {act.description ||
                                                                'Layanan resmi AHASS'}
                                                        </p>
                                                    </div>
                                                    {isSelected ? (
                                                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-xs">
                                                            <Check className="size-3" />
                                                        </span>
                                                    ) : (
                                                        <span className="size-5 shrink-0 rounded-full border border-zinc-300 dark:border-zinc-700" />
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between border-t border-zinc-100 pt-1 dark:border-zinc-800/80">
                                                    <span className="font-mono text-[10px] text-zinc-600 dark:text-zinc-400">
                                                        ID: {act.id}
                                                    </span>
                                                    <span className="font-mono text-xs font-black text-red-600 dark:text-red-400">
                                                        +{act.points} PTS
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-2 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-7 text-center dark:border-zinc-800 dark:bg-zinc-800/30">
                                    <p className="text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
                                        Tidak ada aktivitas yang cocok dengan
                                        &ldquo;
                                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                            {activitySearch}
                                        </span>
                                        &rdquo;
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setActivitySearch('')}
                                        className="h-7 cursor-pointer border-zinc-200 px-3 text-xs text-red-600 hover:bg-red-50 dark:border-zinc-700 dark:text-red-400 dark:hover:bg-red-950/30"
                                    >
                                        Reset Pencarian
                                    </Button>
                                </div>
                            )}

                            {/* Optional: Points Override & Notes */}
                            {selectedActivity && (
                                <div className="grid grid-cols-1 gap-3 border-t border-zinc-100 pt-2 sm:grid-cols-2 dark:border-zinc-800">
                                    <div>
                                        <Label
                                            htmlFor="customPoints"
                                            className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                                        >
                                            Penyesuaian Poin (Default:{' '}
                                            {selectedActivity.points})
                                        </Label>
                                        <div className="relative mt-1">
                                            <Input
                                                id="customPoints"
                                                type="number"
                                                min={1}
                                                max={100000}
                                                value={customPoints}
                                                onChange={(e) => {
                                                    const val =
                                                        e.target.value === ''
                                                            ? ''
                                                            : Number(
                                                                  e.target
                                                                      .value,
                                                              );
                                                    setCustomPoints(val);
                                                    try {
                                                        if (val !== '') {
                                                            sessionStorage.setItem(
                                                                'honda_scan_custom_points',
                                                                String(val),
                                                            );
                                                        }
                                                    } catch {
                                                        // Ignore storage issues
                                                    }
                                                }}
                                                className="h-10 rounded-xl pr-12 font-mono text-sm font-bold"
                                            />
                                            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-bold text-zinc-600">
                                                PTS
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="scanNotes"
                                            className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                                        >
                                            Catatan Transaksi Poin (Opsional)
                                        </Label>
                                        <Input
                                            id="scanNotes"
                                            type="text"
                                            placeholder="Contoh: Servis berkala kelipatan 10.000 KM"
                                            value={notes}
                                            onChange={(e) =>
                                                setNotes(e.target.value)
                                            }
                                            className="mt-1 h-10 rounded-xl text-xs"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* STEP 2: Scan QR Kamera / Input Ketik User ID */}
                        <div className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-4 shadow-xs sm:p-5 md:p-6 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex size-7 items-center justify-center rounded-xl bg-red-600 text-xs font-bold text-white shadow-xs">
                                        2
                                    </span>
                                    <div>
                                        <h2 className="text-sm font-bold text-zinc-900 sm:text-base dark:text-zinc-100">
                                            Identifikasi Member Pelanggan
                                        </h2>
                                        <p className="text-xs text-zinc-500">
                                            Scan QR kamera dari ponsel member
                                            atau ketik 10 digit ID
                                        </p>
                                    </div>
                                </div>

                                {/* Mode Switcher Tabs (Mobile-Friendly full width) */}
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

                            {/* TAB 1: SCANNER KAMERA (@yudiel/react-qr-scanner) dengan ErrorBoundary */}
                            {inputMode === 'scanner' ? (
                                <div className="space-y-3">
                                    <div className="relative mx-auto flex aspect-square w-full max-w-xl flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-red-500/30 bg-zinc-950 shadow-inner sm:aspect-[4/3] sm:rounded-3xl">
                                        <ErrorBoundary
                                            name="Kamera Scanner QR"
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
                                                        <p className="text-xs leading-relaxed text-zinc-400">
                                                            {err.message ||
                                                                'Izin kamera belum diberikan atau perangkat tidak mendukung.'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center justify-center gap-2 pt-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={reset}
                                                            className="rounded-xl border-zinc-700 bg-zinc-800 text-xs text-white hover:bg-zinc-700"
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
                                                            className="rounded-xl bg-red-600 text-xs font-semibold text-white hover:bg-red-700"
                                                        >
                                                            Ketik ID Manual
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        >
                                            {isMounted && isCameraActive ? (
                                                <>
                                                    <Scanner
                                                        key={facingMode}
                                                        onScan={handleQrScan}
                                                        scanDelay={1200}
                                                        paused={
                                                            isSearching ||
                                                            Boolean(member) ||
                                                            isSubmitting
                                                        }
                                                        constraints={{
                                                            facingMode,
                                                        }}
                                                        onError={(err) => {
                                                            console.warn(
                                                                'QR Scanner notice:',
                                                                err,
                                                            );
                                                            setScannerError(
                                                                'Kamera tidak dapat diakses atau diblokir.',
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

                                                    {/* Visual Viewfinder Reticle */}
                                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                        <div className="relative flex size-48 items-center justify-center rounded-3xl border-2 border-red-500/90 shadow-2xl shadow-red-500/20 sm:size-60 md:size-64">
                                                            <div className="absolute top-2 left-2 size-5 rounded-tl-lg border-t-4 border-l-4 border-white" />
                                                            <div className="absolute top-2 right-2 size-5 rounded-tr-lg border-t-4 border-r-4 border-white" />
                                                            <div className="absolute bottom-2 left-2 size-5 rounded-bl-lg border-b-4 border-l-4 border-white" />
                                                            <div className="absolute right-2 bottom-2 size-5 rounded-br-lg border-r-4 border-b-4 border-white" />

                                                            {/* Scanning Laser Line */}
                                                            <div className="h-0.5 w-full animate-bounce bg-red-500 opacity-80 shadow-md shadow-red-500" />
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
                                                </>
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
                                            Masukkan 10 Digit ID Member Honda
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
                                        <p className="mt-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                                            Mendukung ID angka 10-digit (misal:{' '}
                                            <code>8844766994</code>), nomor HP,
                                            atau email terdaftar.
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
                    </div>

                    {/* Right Column: STEP 3 (Member Confirmation & Point Awarding) */}
                    <div className="space-y-6 lg:col-span-5">
                        <div
                            ref={memberCardRef}
                            className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-4 shadow-xs sm:p-5 md:p-6 lg:sticky lg:top-6 dark:border-zinc-800 dark:bg-zinc-900"
                        >
                            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex size-7 items-center justify-center rounded-xl bg-red-600 text-xs font-bold text-white shadow-xs">
                                        3
                                    </span>
                                    <div>
                                        <h2 className="text-sm font-bold text-zinc-900 sm:text-base dark:text-zinc-100">
                                            Verifikasi & Konfirmasi
                                        </h2>
                                        <p className="text-xs text-zinc-500">
                                            Tinjau data member sebelum memproses
                                            poin
                                        </p>
                                    </div>
                                </div>

                                {member && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setMember(null)}
                                        className="h-8 px-2 text-xs text-zinc-400 hover:text-red-600"
                                    >
                                        Ganti Member
                                    </Button>
                                )}
                            </div>

                            {member ? (
                                <div className="animate-smooth-in space-y-5">
                                    {/* Member Card Profile */}
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
                                                            className={`shrink-0 rounded-lg border px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase ${getTierBadgeStyle(
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
                                            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                                                <Phone className="size-3.5 shrink-0 text-zinc-400" />
                                                <span className="truncate">
                                                    {member.phone_number}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                                                <MapPin className="size-3.5 shrink-0 text-zinc-400" />
                                                <span className="truncate">
                                                    {member.address}
                                                </span>
                                            </div>
                                            {member.email_verified !==
                                                undefined && (
                                                <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                                                    <ShieldCheck
                                                        className={`size-3.5 shrink-0 ${member.email_verified ? 'text-emerald-500' : 'text-amber-500'}`}
                                                    />
                                                    <span>
                                                        {member.email_verified
                                                            ? 'Email Terverifikasi'
                                                            : 'Email Belum Diverifikasi'}
                                                    </span>
                                                </div>
                                            )}
                                            {member.created_at && (
                                                <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                                                    <UserCheck className="size-3.5 shrink-0 text-zinc-400" />
                                                    <span>
                                                        Terdaftar:{' '}
                                                        {member.created_at}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Cross-Link: Shortcut to Scan User / Kelola Klaim Reward */}
                                        <div className="flex items-center justify-between gap-2 border-t border-zinc-200/60 pt-2.5 dark:border-zinc-700/60">
                                            <span className="text-[11px] text-zinc-500">
                                                Perlu cek serah terima reward?
                                            </span>
                                            <Link
                                                href={`/admin/scan-user?user_id=${member.id}`}
                                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-200/80 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-900/60"
                                            >
                                                <Gift className="size-3.5" />
                                                Lihat Klaim Reward
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Point Calculation Simulation */}
                                    <div className="space-y-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 dark:bg-red-500/10">
                                        <div className="flex items-center justify-between text-xs font-bold tracking-wider text-red-700 uppercase dark:text-red-400">
                                            <span>Simulasi Perubahan Poin</span>
                                            <span className="font-mono text-xs font-black">
                                                +{pointsToAdd} PTS
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2.5 pt-1 sm:gap-3">
                                            <div className="rounded-xl border border-red-500/15 bg-white p-3 dark:bg-zinc-900">
                                                <span className="block text-[10px] font-medium text-zinc-500 sm:text-[11px]">
                                                    Poin Aktif Member
                                                </span>
                                                <div className="mt-1 flex items-baseline gap-1 sm:gap-1.5">
                                                    <span className="font-mono text-xs font-bold text-zinc-500 line-through sm:text-base">
                                                        {member.points.toLocaleString(
                                                            'id-ID',
                                                        )}
                                                    </span>
                                                    <ArrowRight className="size-2.5 shrink-0 text-red-500 sm:size-3" />
                                                    <span className="font-mono text-sm font-black text-emerald-600 sm:text-lg dark:text-emerald-400">
                                                        {simulatedPoints.toLocaleString(
                                                            'id-ID',
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-red-500/15 bg-white p-3 dark:bg-zinc-900">
                                                <span className="block text-[10px] font-medium text-zinc-500 sm:text-[11px]">
                                                    Akumulasi Lifetime
                                                </span>
                                                <div className="mt-1 flex items-baseline gap-1 sm:gap-1.5">
                                                    <span className="font-mono text-xs font-bold text-zinc-500 line-through sm:text-base">
                                                        {member.lifetime_points.toLocaleString(
                                                            'id-ID',
                                                        )}
                                                    </span>
                                                    <ArrowRight className="size-2.5 shrink-0 text-red-500 sm:size-3" />
                                                    <span className="font-mono text-sm font-black text-red-600 sm:text-lg dark:text-red-400">
                                                        {simulatedLifetime.toLocaleString(
                                                            'id-ID',
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tier upgrade alert preview */}
                                        {isTierUpgraded && (
                                            <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
                                                <Sparkles className="size-4 shrink-0 animate-spin text-amber-500" />
                                                <span className="font-semibold">
                                                    Transaksi ini akan menaikkan
                                                    level member dari{' '}
                                                    <b>{member.tier}</b> menjadi{' '}
                                                    <b>{simulatedTier}</b>!
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Submit Button */}
                                    <Button
                                        type="button"
                                        disabled={
                                            isSubmitting ||
                                            !selectedActivity ||
                                            pointsToAdd <= 0
                                        }
                                        onClick={handleProcessPoints}
                                        className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-red-600 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition-all hover:bg-red-700 active:scale-[0.98]"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <RefreshCw className="size-4 animate-spin" />
                                                Memproses Transaksi...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="size-4" />
                                                Konfirmasi & Tambah +
                                                {pointsToAdd} Poin
                                            </>
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3 rounded-2xl border-2 border-dashed border-zinc-200 px-4 py-10 text-center sm:py-12 dark:border-zinc-800">
                                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 sm:size-14 dark:bg-zinc-800">
                                        <QrCode className="size-6 sm:size-7" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                            Belum Ada Member Terpilih
                                        </h3>
                                        <p className="mx-auto max-w-xs text-xs leading-relaxed text-zinc-500">
                                            Gunakan scanner kamera QR atau ketik
                                            10 digit ID member pada Langkah 2
                                            untuk menampilkan data pelanggan.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section: Riwayat Transaksi Hari Ini / Terkini (Responsive Table on Desktop & Card List on Mobile) */}
                <div className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-4 shadow-xs sm:p-5 md:p-6 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <History className="size-5 text-red-600" />
                            <h2 className="text-sm font-bold text-zinc-900 sm:text-base dark:text-zinc-100">
                                Riwayat Scan & Penambahan Poin Terbaru
                            </h2>
                        </div>
                        <span className="text-xs text-zinc-500">
                            {recentScans.length} Transaksi Terakhir
                        </span>
                    </div>

                    {recentScans.length > 0 ? (
                        <>
                            {/* MOBILE VIEW: Compact Card List (No horizontal scroll) */}
                            <div className="block space-y-2.5 sm:hidden">
                                {recentScans.map((scan) => (
                                    <div
                                        key={scan.id}
                                        className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="truncate text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                                    {scan.user_name}
                                                </div>
                                                <div className="font-mono text-[10px] text-zinc-500">
                                                    ID: {scan.user_id} • #
                                                    {scan.id}
                                                </div>
                                            </div>
                                            <Badge className="shrink-0 border border-emerald-200 bg-emerald-50 font-mono text-[11px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                +{scan.points} PTS
                                            </Badge>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-zinc-200/60 pt-1.5 text-[11px] text-zinc-500 dark:border-zinc-700/60">
                                            <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">
                                                {scan.activity_name}
                                            </span>
                                            <span className="shrink-0 font-mono text-[10px]">
                                                {scan.time_ago}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-end gap-2 border-t border-zinc-200/40 pt-1.5 dark:border-zinc-700/40">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    lookupMember(scan.user_id)
                                                }
                                                className="h-6 cursor-pointer rounded-lg px-2.5 text-[11px] font-bold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                                            >
                                                Pilih Member
                                            </button>
                                            <Link
                                                href={`/admin/scan-user?user_id=${scan.user_id}`}
                                                className="inline-flex h-6 cursor-pointer items-center rounded-lg px-2.5 text-[11px] font-medium text-zinc-600 transition-colors hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-700/60"
                                            >
                                                <Gift className="mr-1 size-3" />
                                                Lihat Klaim
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* DESKTOP VIEW: Full Structured Table */}
                            <div className="hidden overflow-x-auto sm:block">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-zinc-100 text-zinc-400 dark:border-zinc-800">
                                            <th className="pb-3 font-semibold">
                                                ID Riwayat
                                            </th>
                                            <th className="pb-3 font-semibold">
                                                Member Pelanggan
                                            </th>
                                            <th className="pb-3 font-semibold">
                                                Jenis Aktivitas
                                            </th>
                                            <th className="pb-3 text-center font-semibold">
                                                Poin Diberikan
                                            </th>
                                            <th className="pb-3 font-semibold">
                                                Petugas Admin
                                            </th>
                                            <th className="pb-3 font-semibold">
                                                Waktu
                                            </th>
                                            <th className="pb-3 text-right font-semibold">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                        {recentScans.map((scan) => (
                                            <tr
                                                key={scan.id}
                                                className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                                            >
                                                <td className="py-3 font-mono font-bold text-zinc-900 dark:text-zinc-200">
                                                    #{scan.id}
                                                </td>
                                                <td className="py-3">
                                                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                        {scan.user_name}
                                                    </div>
                                                    <div className="font-mono text-[11px] text-zinc-500">
                                                        ID: {scan.user_id}
                                                    </div>
                                                </td>
                                                <td className="py-3 font-medium text-zinc-700 dark:text-zinc-300">
                                                    {scan.activity_name}
                                                </td>
                                                <td className="py-3 text-center">
                                                    <Badge className="border border-emerald-200 bg-emerald-50 font-mono text-xs font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                        +{scan.points} PTS
                                                    </Badge>
                                                </td>
                                                <td className="py-3 text-zinc-600 dark:text-zinc-400">
                                                    {scan.admin_name}
                                                </td>
                                                <td className="py-3 font-mono text-[11px] text-zinc-500">
                                                    {scan.created_at}
                                                </td>
                                                <td className="py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                lookupMember(
                                                                    scan.user_id,
                                                                )
                                                            }
                                                            className="h-7 cursor-pointer rounded-lg px-2.5 text-[11px] font-bold text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                                                            title="Pilih Member ini untuk Tambah Poin"
                                                        >
                                                            Pilih
                                                        </Button>
                                                        <Link
                                                            href={`/admin/scan-user?user_id=${scan.user_id}`}
                                                            className="inline-flex h-7 cursor-pointer items-center rounded-lg px-2.5 text-[11px] font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                                                            title="Buka Data & Klaim Reward Member"
                                                        >
                                                            <Gift className="mr-1 size-3" />
                                                            Klaim
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="py-8 text-center text-xs text-zinc-500">
                            Belum ada riwayat scan poin yang tercatat. Lakukan
                            transaksi pertama di atas!
                        </div>
                    )}
                </div>
            </div>

            {/* FLOATING MOBILE STICKY ACTION BAR: Pops up when member is selected on phone screens */}
            {member && (
                <div className="fixed inset-x-3 bottom-4 z-30 sm:inset-x-6 lg:hidden">
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-950/95 p-3 text-white shadow-2xl shadow-black/50 backdrop-blur-xl dark:bg-zinc-900/95">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                                <span className="truncate text-xs font-bold text-white">
                                    {member.name}
                                </span>
                                <Badge className="border-0 bg-red-600 px-1.5 py-0 font-mono text-[10px] text-white">
                                    +{pointsToAdd} PTS
                                </Badge>
                            </div>
                            <p className="truncate text-[10px] text-zinc-400">
                                {selectedActivity?.name}
                            </p>
                        </div>
                        <Button
                            type="button"
                            onClick={handleProcessPoints}
                            disabled={isSubmitting}
                            className="h-10 shrink-0 cursor-pointer rounded-xl bg-red-600 px-4 text-xs font-bold text-white shadow-lg shadow-red-600/30 transition-all hover:bg-red-700 active:scale-95"
                        >
                            {isSubmitting ? (
                                <RefreshCw className="size-4 animate-spin" />
                            ) : (
                                <>
                                    <Zap className="size-3.5" />
                                    Konfirmasi
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}

AdminScanIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Admin Console', href: '/admin/dashboard' },
            { title: 'Scan / Input Poin Member', href: '/admin/scan' },
        ]}
    >
        {page}
    </AppLayout>
);
