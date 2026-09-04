import { Head, router } from '@inertiajs/react';
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
    Flame,
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
    Sparkles,
    User,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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

type Props = {
    activities: ActivityItem[];
    recentScans: RecentScan[];
    awarded?: AwardedSession | null;
};

export default function AdminScanIndex({ activities, recentScans, awarded }: Props) {
    // 0. Mounted state to guarantee 100% SSR hydration match
    const [isMounted, setIsMounted] = useState(false);

    // 1. Selected Activity & Custom Points (deterministik awal agar cocok dengan SSR)
    const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(() => {
        return activities.length > 0 ? activities[0] : null;
    });

    const [customPoints, setCustomPoints] = useState<number | ''>(() => {
        return activities.length > 0 ? activities[0].points : 0;
    });

    const [notes, setNotes] = useState('');

    // 2. Input Mode ('scanner' | 'manual')
    const [inputMode, setInputMode] = useState<'scanner' | 'manual'>('scanner');
    const [scannerError, setScannerError] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(true);

    // 3. Manual Input Query
    const [manualIdInput, setManualIdInput] = useState('');

    // 4. Looked-up Member state
    const [isSearching, setIsSearching] = useState(false);
    const [member, setMember] = useState<MemberData | null>(null);
    const [searchError, setSearchError] = useState<string | null>(null);

    // 5. Processing state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastAwarded, setLastAwarded] = useState<AwardedSession | null>(awarded || null);

    // 6. Refs
    const isScanningRef = useRef(false);
    const memberCardRef = useRef<HTMLDivElement>(null);

    // Sync from sessionStorage ONLY after mounted on client
    useEffect(() => {
        setIsMounted(true);
        try {
            const savedId = sessionStorage.getItem('honda_scan_selected_activity_id');
            if (savedId) {
                const found = activities.find((a) => a.id === savedId);
                if (found) {
                    setSelectedActivity(found);
                    const savedPoints = sessionStorage.getItem('honda_scan_custom_points');
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
            sessionStorage.setItem('honda_scan_custom_points', String(act.points));
        } catch {
            // Ignore storage access issues
        }
    };

    // Safely get CSRF token from meta or cookie
    const getCsrfToken = (): string => {
        if (typeof document === 'undefined') return '';
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
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
                        memberCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 100);
                }
            } else {
                setMember(null);
                setSearchError(data.message || 'Member tidak ditemukan. Pastikan ID atau QR sesuai.');
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
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880; // A5
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } catch {
            // Ignore audio context failures
        }
    };

    // QR Scanner Callback with debounce and duplicate protection
    const handleQrScan = (detectedCodes: Array<{ rawValue: string }>) => {
        if (!detectedCodes || detectedCodes.length === 0) return;
        if (isScanningRef.current || isSearching || isSubmitting) return;

        const rawVal = detectedCodes[0].rawValue?.trim();
        if (!rawVal) return;

        // If member is already retrieved and matches, do not re-fetch
        if (member && (member.id === rawVal || `HND-MEMBER-${member.id}` === rawVal)) {
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
                points: customPoints !== '' ? customPoints : selectedActivity.points,
                notes: notes,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    const sessionAwarded = page.props.awarded as AwardedSession | undefined;
                    if (sessionAwarded) {
                        setLastAwarded(sessionAwarded);
                    }
                    toast.success(
                        `Sukses! Poin berhasil ditambahkan ke ${member.name}.`
                    );
                    // Reset member to allow next scan while keeping selectedActivity intact
                    setMember(null);
                    setManualIdInput('');
                    setNotes('');
                },
                onError: (errs) => {
                    toast.error(
                        Object.values(errs)[0] || 'Gagal memproses penambahan poin.'
                    );
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    // Calculate simulation points
    const pointsToAdd = customPoints !== '' ? Number(customPoints) : (selectedActivity?.points || 0);
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

    const simulatedTier = member ? getSimulatedTier(simulatedLifetime) : 'Bronze';
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

            <div className="space-y-6 md:space-y-8 p-3 sm:p-5 md:p-6 max-w-7xl mx-auto">
                {/* Header Title Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-red-600 via-red-700 to-zinc-900 p-5 sm:p-6 md:p-8 text-white shadow-xl shadow-red-600/15">
                    <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-red-100 border border-white/20">
                                <QrCode className="size-3.5" />
                                Official AHASS Point Reward System
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
                                Scan QR & Input Poin Member
                            </h1>
                            <p className="text-red-100/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
                                Berikan poin apresiasi kepada pelanggan setia Honda. Pilih jenis aktivitas layanan terlebih dahulu, lalu scan QR atau masukkan ID Member 10 digit.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 self-start md:self-auto">
                            <div className="flex flex-col items-start md:items-end px-3.5 py-2 rounded-2xl bg-black/25 backdrop-blur-md border border-white/10">
                                <span className="text-[10px] sm:text-[11px] font-medium text-red-200">Aktivitas Tersedia</span>
                                <span className="text-lg sm:text-xl font-bold font-mono">{activities.length} Jenis</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Last Awarded Success Alert if any */}
                {lastAwarded && (
                    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-3.5">
                            <div className="size-10 sm:size-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                                <CheckCircle2 className="size-5 sm:size-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-emerald-900 dark:text-emerald-300 text-sm sm:text-base">
                                        Poin Sukses Diberikan ke {lastAwarded.user_name}
                                    </span>
                                    <Badge className="bg-emerald-600 text-white font-mono text-xs">
                                        +{lastAwarded.points_added} PTS
                                    </Badge>
                                </div>
                                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                                    Aktivitas: <span className="font-semibold">{lastAwarded.activity_name}</span> | Saldo: <span className="font-bold font-mono">{lastAwarded.current_points.toLocaleString('id-ID')} Pts</span> | Tier: <span className="font-bold">{lastAwarded.tier}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {lastAwarded.tier_upgraded && (
                                <Badge className="bg-linear-to-r from-amber-500 to-yellow-400 text-zinc-950 font-bold px-2.5 py-1 text-[11px] sm:text-xs animate-pulse">
                                    🎉 NAIK TIER KE {lastAwarded.new_tier}!
                                </Badge>
                            )}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setLastAwarded(null)}
                                className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-500/20 text-xs h-8 px-3 rounded-lg"
                            >
                                Tutup
                            </Button>
                        </div>
                    </div>
                )}

                {/* Main 2-Column Workflow */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                    {/* Left Column: STEP 1 (Pilih Aktivitas) & STEP 2 (Scan/Input) */}
                    <div className="lg:col-span-7 space-y-5 sm:space-y-6">
                        {/* STEP 1: Pilih Aktivitas */}
                        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 md:p-6 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex size-7 items-center justify-center rounded-xl bg-red-600 text-xs font-bold text-white shadow-xs">
                                        1
                                    </span>
                                    <div>
                                        <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                                            Pilih Jenis Aktivitas Layanan
                                        </h2>
                                        <p className="text-xs text-zinc-500">
                                            Tentukan servis atau transaksi yang dilakukan pelanggan
                                        </p>
                                    </div>
                                </div>

                                {selectedActivity && (
                                    <Badge className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-900 text-[11px] sm:text-xs font-mono font-bold">
                                        +{customPoints !== '' ? customPoints : selectedActivity.points} PTS
                                    </Badge>
                                )}
                            </div>

                            {/* Activity Cards List */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                                {activities.map((act) => {
                                    const isSelected = selectedActivity?.id === act.id;
                                    return (
                                        <button
                                            key={act.id}
                                            type="button"
                                            onClick={() => handleSelectActivity(act)}
                                            className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 active:scale-[0.99] ${
                                                isSelected
                                                    ? 'border-red-600 bg-red-50/70 dark:bg-red-950/30 dark:border-red-500 shadow-xs ring-1 ring-red-600/30'
                                                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/40 hover:border-zinc-300 dark:hover:border-zinc-700'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="space-y-0.5 min-w-0">
                                                    <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 block truncate">
                                                        {act.name}
                                                    </span>
                                                    <p className="text-[11px] text-zinc-500 line-clamp-1">
                                                        {act.description || 'Layanan resmi AHASS'}
                                                    </p>
                                                </div>
                                                {isSelected ? (
                                                    <span className="size-5 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                        <Check className="size-3" />
                                                    </span>
                                                ) : (
                                                    <span className="size-5 rounded-full border border-zinc-300 dark:border-zinc-700 shrink-0" />
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                                                <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
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

                            {/* Optional: Points Override & Notes */}
                            {selectedActivity && (
                                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="customPoints" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                            Penyesuaian Poin (Default: {selectedActivity.points})
                                        </Label>
                                        <div className="relative mt-1">
                                            <Input
                                                id="customPoints"
                                                type="number"
                                                min={1}
                                                max={100000}
                                                value={customPoints}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? '' : Number(e.target.value);
                                                    setCustomPoints(val);
                                                    try {
                                                        if (val !== '') {
                                                            sessionStorage.setItem('honda_scan_custom_points', String(val));
                                                        }
                                                    } catch {
                                                        // Ignore storage issues
                                                    }
                                                }}
                                                className="font-mono font-bold pr-12 rounded-xl text-sm h-10"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-600">
                                                PTS
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="scanNotes" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                            Catatan / Nomor Struk AHASS (Opsional)
                                        </Label>
                                        <Input
                                            id="scanNotes"
                                            type="text"
                                            placeholder="Contoh: No. Faktur SRV-0182"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="mt-1 rounded-xl text-xs h-10"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* STEP 2: Scan QR Kamera / Input Ketik User ID */}
                        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 md:p-6 shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex size-7 items-center justify-center rounded-xl bg-red-600 text-xs font-bold text-white shadow-xs">
                                        2
                                    </span>
                                    <div>
                                        <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                                            Identifikasi Member Pelanggan
                                        </h2>
                                        <p className="text-xs text-zinc-500">
                                            Scan QR kamera dari ponsel member atau ketik 10 digit ID
                                        </p>
                                    </div>
                                </div>

                                {/* Mode Switcher Tabs (Mobile-Friendly full width) */}
                                <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 gap-1 sm:flex sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={() => setInputMode('scanner')}
                                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all h-9 sm:h-auto cursor-pointer ${
                                            inputMode === 'scanner'
                                                ? 'bg-white dark:bg-zinc-900 text-red-600 dark:text-red-400 shadow-xs'
                                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                                        }`}
                                    >
                                        <Camera className="size-3.5" />
                                        Scan Kamera
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setInputMode('manual')}
                                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all h-9 sm:h-auto cursor-pointer ${
                                            inputMode === 'manual'
                                                ? 'bg-white dark:bg-zinc-900 text-red-600 dark:text-red-400 shadow-xs'
                                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
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
                                    <div className="relative overflow-hidden rounded-2xl bg-zinc-950 aspect-square sm:aspect-4/3 max-h-72 sm:max-h-80 flex flex-col items-center justify-center border-2 border-dashed border-red-500/30 shadow-inner">
                                        <ErrorBoundary
                                            name="Kamera Scanner QR"
                                            onReset={() => {
                                                setScannerError(null);
                                                setIsCameraActive(true);
                                            }}
                                            fallback={(err, reset) => (
                                                <div className="text-center p-6 space-y-3 text-zinc-300 max-w-sm">
                                                    <CameraOff className="size-10 mx-auto text-amber-500 opacity-80" />
                                                    <div className="space-y-1">
                                                        <h4 className="font-bold text-sm text-white">
                                                            Kamera Tidak Dapat Dimuat
                                                        </h4>
                                                        <p className="text-xs text-zinc-400 leading-relaxed">
                                                            {err.message || 'Izin kamera belum diberikan atau perangkat tidak mendukung.'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center justify-center gap-2 pt-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={reset}
                                                            className="rounded-xl text-xs bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                                                        >
                                                            Coba Lagi
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => setInputMode('manual')}
                                                            className="rounded-xl text-xs bg-red-600 hover:bg-red-700 text-white font-semibold"
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
                                                        onScan={handleQrScan}
                                                        scanDelay={1200}
                                                        paused={isSearching || Boolean(member) || isSubmitting}
                                                        onError={(err) => {
                                                            console.warn('QR Scanner notice:', err);
                                                            setScannerError('Kamera tidak dapat diakses atau diblokir.');
                                                        }}
                                                        formats={['qr_code']}
                                                        styles={{
                                                            container: { width: '100%', height: '100%' },
                                                            video: { objectFit: 'cover' },
                                                        }}
                                                    />

                                                    {/* Visual Viewfinder Reticle */}
                                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                        <div className="relative size-40 sm:size-52 border-2 border-red-500/90 rounded-3xl shadow-2xl shadow-red-500/20 flex items-center justify-center">
                                                            <div className="absolute top-2 left-2 size-4 border-t-4 border-l-4 border-white rounded-tl-lg" />
                                                            <div className="absolute top-2 right-2 size-4 border-t-4 border-r-4 border-white rounded-tr-lg" />
                                                            <div className="absolute bottom-2 left-2 size-4 border-b-4 border-l-4 border-white rounded-bl-lg" />
                                                            <div className="absolute bottom-2 right-2 size-4 border-b-4 border-r-4 border-white rounded-br-lg" />

                                                            {/* Scanning Laser Line */}
                                                            <div className="w-full h-0.5 bg-red-500 shadow-md shadow-red-500 animate-bounce opacity-80" />
                                                        </div>
                                                    </div>

                                                    <div className="absolute bottom-3 inset-x-0 flex justify-center">
                                                        <div className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-[11px] text-white font-medium flex items-center gap-1.5 border border-white/15 shadow-md">
                                                            <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                                                            Arahkan ke QR Member Pelanggan
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center p-6 space-y-2 text-zinc-400">
                                                    <CameraOff className="size-10 mx-auto opacity-50" />
                                                    <p className="text-xs">Kamera dinonaktifkan sementara.</p>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setIsCameraActive(true)}
                                                        className="rounded-xl text-xs mt-2"
                                                    >
                                                        Aktifkan Kembali Kamera
                                                    </Button>
                                                </div>
                                            )}
                                        </ErrorBoundary>
                                    </div>

                                    {scannerError && (
                                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                                            <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <span>{scannerError}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setInputMode('manual')}
                                                    className="block font-bold underline mt-1 text-red-600 hover:text-red-700"
                                                >
                                                    Beralih ke Input Ketik Manual
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* TAB 2: INPUT KETIK MANUAL */
                                <form onSubmit={handleManualSearch} className="space-y-3">
                                    <div>
                                        <Label htmlFor="manualId" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                            Masukkan 10 Digit ID Member Honda
                                        </Label>
                                        <div className="flex flex-col sm:flex-row gap-2 mt-1.5">
                                            <div className="relative flex-1">
                                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                                                <Input
                                                    id="manualId"
                                                    type="text"
                                                    placeholder="Contoh: 8844766994 atau email member"
                                                    value={manualIdInput}
                                                    onChange={(e) => setManualIdInput(e.target.value)}
                                                    className="pl-10 font-mono tracking-wider rounded-xl text-sm h-11"
                                                    autoFocus
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                disabled={isSearching || !manualIdInput.trim()}
                                                className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-5 font-semibold text-xs h-11 shrink-0 cursor-pointer shadow-md shadow-red-600/20 active:scale-95 transition-all"
                                            >
                                                {isSearching ? (
                                                    <RefreshCw className="size-3.5 animate-spin mr-1.5" />
                                                ) : (
                                                    <Search className="size-3.5 mr-1.5" />
                                                )}
                                                Cari Member
                                            </Button>
                                        </div>
                                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1.5">
                                            Mendukung ID angka 10-digit (misal: <code>8844766994</code>), nomor HP, atau email terdaftar.
                                        </p>
                                    </div>
                                </form>
                            )}

                            {searchError && (
                                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-400 flex items-center justify-between gap-2">
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
                    <div className="lg:col-span-5 space-y-6">
                        <div
                            ref={memberCardRef}
                            className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 md:p-6 shadow-xs space-y-5 lg:sticky lg:top-6"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex size-7 items-center justify-center rounded-xl bg-red-600 text-xs font-bold text-white shadow-xs">
                                        3
                                    </span>
                                    <div>
                                        <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                                            Verifikasi & Konfirmasi
                                        </h2>
                                        <p className="text-xs text-zinc-500">
                                            Tinjau data member sebelum memproses poin
                                        </p>
                                    </div>
                                </div>

                                {member && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setMember(null)}
                                        className="text-xs text-zinc-400 hover:text-red-600 h-8 px-2"
                                    >
                                        Ganti Member
                                    </Button>
                                )}
                            </div>

                            {member ? (
                                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                                    {/* Member Card Profile */}
                                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base truncate">
                                                    {member.name}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                    <span className="font-mono text-xs font-black text-red-600 dark:text-red-400">
                                                        ID: {member.id}
                                                    </span>
                                                    <span className="text-zinc-400 text-xs">•</span>
                                                    <span className="text-xs text-zinc-500 truncate">
                                                        {member.email}
                                                    </span>
                                                </div>
                                            </div>

                                            <Badge
                                                className={`font-black text-[11px] tracking-wider uppercase border px-2.5 py-0.5 rounded-lg shrink-0 ${getTierBadgeStyle(
                                                    member.tier
                                                )}`}
                                            >
                                                {member.tier}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 text-xs">
                                            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                                                <Phone className="size-3.5 text-zinc-400 shrink-0" />
                                                <span className="truncate">{member.phone_number}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                                                <MapPin className="size-3.5 text-zinc-400 shrink-0" />
                                                <span className="truncate">{member.address}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Point Calculation Simulation */}
                                    <div className="p-4 rounded-2xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 space-y-3">
                                        <div className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center justify-between">
                                            <span>Simulasi Perubahan Poin</span>
                                            <span className="font-mono text-xs font-black">
                                                +{pointsToAdd} PTS
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                                            <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-red-500/15">
                                                <span className="text-[10px] sm:text-[11px] text-zinc-500 block font-medium">
                                                    Poin Aktif Member
                                                </span>
                                                <div className="flex items-baseline gap-1 sm:gap-1.5 mt-1">
                                                    <span className="text-xs sm:text-base font-bold font-mono text-zinc-500 line-through">
                                                        {member.points.toLocaleString('id-ID')}
                                                    </span>
                                                    <ArrowRight className="size-2.5 sm:size-3 text-red-500 shrink-0" />
                                                    <span className="text-sm sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                                                        {simulatedPoints.toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-red-500/15">
                                                <span className="text-[10px] sm:text-[11px] text-zinc-500 block font-medium">
                                                    Akumulasi Lifetime
                                                </span>
                                                <div className="flex items-baseline gap-1 sm:gap-1.5 mt-1">
                                                    <span className="text-xs sm:text-base font-bold font-mono text-zinc-500 line-through">
                                                        {member.lifetime_points.toLocaleString('id-ID')}
                                                    </span>
                                                    <ArrowRight className="size-2.5 sm:size-3 text-red-500 shrink-0" />
                                                    <span className="text-sm sm:text-lg font-black font-mono text-red-600 dark:text-red-400">
                                                        {simulatedLifetime.toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tier upgrade alert preview */}
                                        {isTierUpgraded && (
                                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                                                <Sparkles className="size-4 text-amber-500 shrink-0 animate-spin" />
                                                <span className="font-semibold">
                                                    Transaksi ini akan menaikkan level member dari <b>{member.tier}</b> menjadi <b>{simulatedTier}</b>!
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Submit Button */}
                                    <Button
                                        type="button"
                                        disabled={isSubmitting || !selectedActivity || pointsToAdd <= 0}
                                        onClick={handleProcessPoints}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 text-sm rounded-2xl shadow-lg shadow-red-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <RefreshCw className="size-4 animate-spin" />
                                                Memproses Transaksi...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="size-4" />
                                                Konfirmasi & Tambah +{pointsToAdd} Poin
                                            </>
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-10 sm:py-12 px-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
                                    <div className="size-12 sm:size-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                                        <QrCode className="size-6 sm:size-7" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">
                                            Belum Ada Member Terpilih
                                        </h3>
                                        <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
                                            Gunakan scanner kamera QR atau ketik 10 digit ID member pada Langkah 2 untuk menampilkan data pelanggan.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section: Riwayat Transaksi Hari Ini / Terkini (Responsive Table on Desktop & Card List on Mobile) */}
                <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 md:p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <History className="size-5 text-red-600" />
                            <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
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
                            <div className="block sm:hidden space-y-2.5">
                                {recentScans.map((scan) => (
                                    <div
                                        key={scan.id}
                                        className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 space-y-2"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                                                    {scan.user_name}
                                                </div>
                                                <div className="text-[10px] font-mono text-zinc-500">
                                                    ID: {scan.user_id} • #{scan.id}
                                                </div>
                                            </div>
                                            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-mono font-bold text-[11px] border border-emerald-200 dark:border-emerald-800 shrink-0">
                                                +{scan.points} PTS
                                            </Badge>
                                        </div>

                                        <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-700/60">
                                            <span className="font-medium truncate text-zinc-700 dark:text-zinc-300">
                                                {scan.activity_name}
                                            </span>
                                            <span className="font-mono text-[10px] shrink-0">
                                                {scan.time_ago}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* DESKTOP VIEW: Full Structured Table */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400">
                                            <th className="pb-3 font-semibold">ID Riwayat</th>
                                            <th className="pb-3 font-semibold">Member Pelanggan</th>
                                            <th className="pb-3 font-semibold">Jenis Aktivitas</th>
                                            <th className="pb-3 font-semibold text-center">Poin Diberikan</th>
                                            <th className="pb-3 font-semibold">Petugas Admin</th>
                                            <th className="pb-3 font-semibold text-right">Waktu</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                        {recentScans.map((scan) => (
                                            <tr key={scan.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                                                <td className="py-3 font-mono font-bold text-zinc-900 dark:text-zinc-200">
                                                    #{scan.id}
                                                </td>
                                                <td className="py-3">
                                                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                        {scan.user_name}
                                                    </div>
                                                    <div className="text-[11px] font-mono text-zinc-500">
                                                        ID: {scan.user_id}
                                                    </div>
                                                </td>
                                                <td className="py-3 text-zinc-700 dark:text-zinc-300 font-medium">
                                                    {scan.activity_name}
                                                </td>
                                                <td className="py-3 text-center">
                                                    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-mono font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                                                        +{scan.points} PTS
                                                    </Badge>
                                                </td>
                                                <td className="py-3 text-zinc-600 dark:text-zinc-400">
                                                    {scan.admin_name}
                                                </td>
                                                <td className="py-3 text-right text-zinc-500 font-mono text-[11px]">
                                                    {scan.created_at}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 text-zinc-500 text-xs">
                            Belum ada riwayat scan poin yang tercatat. Lakukan transaksi pertama di atas!
                        </div>
                    )}
                </div>
            </div>

            {/* FLOATING MOBILE STICKY ACTION BAR: Pops up when member is selected on phone screens */}
            {member && (
                <div className="fixed bottom-4 inset-x-3 sm:inset-x-6 z-30 lg:hidden animate-in fade-in slide-in-from-bottom-3 duration-300">
                    <div className="rounded-2xl bg-zinc-950/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/10 p-3 shadow-2xl shadow-black/50 flex items-center justify-between gap-3 text-white">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold truncate text-white">{member.name}</span>
                                <Badge className="bg-red-600 text-white font-mono text-[10px] px-1.5 py-0 border-0">
                                    +{pointsToAdd} PTS
                                </Badge>
                            </div>
                            <p className="text-[10px] text-zinc-400 truncate">
                                {selectedActivity?.name}
                            </p>
                        </div>
                        <Button
                            type="button"
                            onClick={handleProcessPoints}
                            disabled={isSubmitting}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 h-10 rounded-xl shrink-0 shadow-lg shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
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
