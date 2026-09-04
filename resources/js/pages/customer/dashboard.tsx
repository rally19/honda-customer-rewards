import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import {
    ArrowDownRight,
    ArrowUpRight,
    Award,
    Calendar,
    Check,
    CheckCircle2,
    ChevronRight,
    Clock,
    Coins,
    Copy,
    Eye,
    EyeOff,
    FileText,
    Flame,
    Gift,
    HelpCircle,
    Info,
    MessageSquare,
    Plus,
    QrCode,
    Receipt,
    Share2,
    Shield,
    ShoppingBag,
    Sparkles,
    Tag,
    Ticket,
    Wrench,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import CustomerLayout from '@/layouts/customer-layout';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type ClaimItem = {
    id: string;
    receipt_number: string;
    merchant: string;
    category: string;
    amount: number;
    points: number;
    status: 'pending' | 'approved' | 'rejected';
    date: string;
};

type Props = {
    loyalty: {
        memberId: string;
        tier: string;
        tierBadge: string;
        nextTier: string;
        points: number;
        lifetimePoints?: number;
        pointsToNextTier: number;
        tierProgress: number;
        claims?: ClaimItem[];
        vouchers: Array<{
            id: string;
            title: string;
            code: string;
            category: string;
            expiresAt: string;
            image: string;
            status: string;
        }>;
        transactions: Array<{
            id: string;
            title: string;
            dealer: string;
            points: number;
            type: 'credit' | 'debit';
            date: string;
        }>;
        raffleTickets: Array<{
            number: string;
            period: string;
        }>;
    };
};

export default function CustomerDashboard({ loyalty }: Props) {
    const [showPoints, setShowPoints] = useState(true);
    const [copiedId, setCopiedId] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState<(typeof loyalty.vouchers)[0] | null>(null);
    const [claimModalOpen, setClaimModalOpen] = useState(false);
    const [claimsList, setClaimsList] = useState<ClaimItem[]>(loyalty.claims || []);

    const formattedId = loyalty.memberId
        .padStart(10, '0')
        .replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');

    const handleCopyId = () => {
        navigator.clipboard.writeText(loyalty.memberId);
        setCopiedId(true);
        toast.success('ID Member berhasil disalin ke clipboard');
        setTimeout(() => setCopiedId(false), 2000);
    };

    const handleClaimSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const receiptNumber = (form.elements.namedItem('receipt_number') as HTMLInputElement).value;
        const merchant = (form.elements.namedItem('merchant') as HTMLInputElement).value;
        const category = (form.elements.namedItem('category') as HTMLInputElement).value;
        const amount = Number((form.elements.namedItem('amount') as HTMLInputElement).value);
        const notes = (form.elements.namedItem('notes') as HTMLInputElement).value;

        const calculatedPoints = Math.floor(amount / 1000);

        const newClaim: ClaimItem = {
            id: `CLM-${Math.floor(1000 + Math.random() * 9000)}`,
            receipt_number: receiptNumber,
            merchant,
            category,
            amount,
            points: calculatedPoints,
            status: 'pending',
            date: 'Hari ini',
        };

        setClaimsList([newClaim, ...claimsList]);
        setClaimModalOpen(false);
        toast.success(
            `Klaim struk ${receiptNumber} berhasil diajukan! Estimasi +${calculatedPoints} Poin akan diverifikasi oleh Admin.`
        );
    };

    return (
        <CustomerLayout activeTab="home">
            <Head title="Member Rewards E-Wallet - Honda Loyalty" />

            <div className="space-y-6 max-w-4xl mx-auto w-full">
                {/* ========================================================================= */}
                {/* 1. DIGITAL REWARDS MEMBER CARD (HERO SECTION)                             */}
                {/* ========================================================================= */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-red-700 to-zinc-950 p-6 sm:p-8 text-white shadow-xl shadow-red-950/20 border border-red-500/30">
                    {/* Watermark Logo Honda Wing */}
                    <div className="pointer-events-none absolute -right-12 -bottom-16 opacity-15 select-none">
                        <img
                            src="/images/logo/honda_logo_white.png"
                            alt="Honda"
                            className="w-72 sm:w-84 h-auto"
                        />
                    </div>

                    <div className="relative z-10 flex flex-col justify-between space-y-6">
                        {/* Card Top: Logo & Tier */}
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono tracking-widest text-zinc-300 uppercase">
                                        Honda Loyalty E-Wallet
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-base sm:text-lg font-black tracking-wider text-red-200">
                                        #{formattedId}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCopyId}
                                        className="rounded-md bg-white/10 p-1 text-zinc-300 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
                                        title="Salin ID Member"
                                    >
                                        {copiedId ? (
                                            <Check className="size-3.5 text-emerald-400" />
                                        ) : (
                                            <Copy className="size-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Tier Badge */}
                            <div className="flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md px-3.5 py-1 border border-white/15 text-xs font-bold text-red-200">
                                <Award className="size-3.5 text-amber-400" />
                                <span>{loyalty.tier}</span>
                            </div>
                        </div>

                        {/* Card Center: Saldo Poin (Digital Balance) */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-zinc-300">
                                <span>Saldo Poin Anda</span>
                                <button
                                    type="button"
                                    onClick={() => setShowPoints(!showPoints)}
                                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                    title={showPoints ? 'Sembunyikan Saldo' : 'Tampilkan Saldo'}
                                >
                                    {showPoints ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                </button>
                            </div>

                            <div className="flex items-baseline gap-2 flex-wrap">
                                <div className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans">
                                    {showPoints ? loyalty.points.toLocaleString('id-ID') : '••••••'}
                                </div>
                                <span className="text-sm font-bold text-red-400 uppercase">POIN</span>
                                {loyalty.lifetimePoints !== undefined && (
                                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10 ml-auto">
                                        Akumulasi: {loyalty.lifetimePoints.toLocaleString('id-ID')} Pts
                                    </span>
                                )}
                            </div>

                            {/* Tier Progress Bar */}
                            <div className="pt-2 max-w-sm">
                                <div className="flex justify-between text-[11px] text-zinc-300 mb-1">
                                    <span>Menuju {loyalty.nextTier}</span>
                                    <span>{loyalty.pointsToNextTier} Poin lagi</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-black/40 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-red-500 to-amber-400 transition-all duration-500"
                                        style={{ width: `${loyalty.tierProgress}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Card Bottom: 4 Quick Actions */}
                        <div className="grid grid-cols-4 gap-2 border-t border-white/10 pt-4 text-center">
                            <button
                                type="button"
                                onClick={() => setClaimModalOpen(true)}
                                className="group flex flex-col items-center gap-1.5 rounded-xl p-2 hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 text-white group-hover:scale-105 transition-transform">
                                    <Receipt className="size-4.5" />
                                </div>
                                <span className="text-[11px] font-medium text-zinc-200">Klaim Poin</span>
                            </button>

                            <a
                                href="#riwayat"
                                className="group flex flex-col items-center gap-1.5 rounded-xl p-2 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 text-white group-hover:scale-105 transition-transform">
                                    <Clock className="size-4.5" />
                                </div>
                                <span className="text-[11px] font-medium text-zinc-200">Riwayat</span>
                            </a>

                            <a
                                href="#voucher"
                                className="group flex flex-col items-center gap-1.5 rounded-xl p-2 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 text-white group-hover:scale-105 transition-transform">
                                    <Tag className="size-4.5" />
                                </div>
                                <span className="text-[11px] font-medium text-zinc-200">Voucher</span>
                            </a>

                            <a
                                href="#undian"
                                className="group flex flex-col items-center gap-1.5 rounded-xl p-2 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 text-white group-hover:scale-105 transition-transform">
                                    <Ticket className="size-4.5" />
                                </div>
                                <span className="text-[11px] font-medium text-zinc-200">Undian</span>
                            </a>
                        </div>
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 2. PUSAT KLAIM POIN STRUK RESMI HONDA (STANDALONE CLAIM HUB)              */}
                {/* ========================================================================= */}
                <section className="rounded-3xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 shrink-0">
                                <Receipt className="size-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                                        Klaim Poin Struk Resmi Honda & AHASS
                                    </h3>
                                    <Badge variant="outline" className="text-[10px] py-0 text-red-600 border-red-300">
                                        Mandiri
                                    </Badge>
                                </div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    Punya struk pembelian atau servis di jaringan resmi? Masukkan nomor struk Anda untuk mendapatkan poin reward.
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={() => setClaimModalOpen(true)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold gap-1.5 h-9.5 px-4 rounded-xl shrink-0 cursor-pointer shadow-sm shadow-red-600/20"
                        >
                            <Plus className="size-4" />
                            Ajukan Klaim Poin
                        </Button>
                    </div>

                    {/* Claims List Status Tracker */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold">
                            <span>Status Pengajuan Struk Terkini</span>
                            <span>Rasio: 1 Poin per Rp 1.000</span>
                        </div>

                        {claimsList.length === 0 ? (
                            <div className="p-6 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                                Belum ada pengajuan klaim struk transaksi. Klik "Ajukan Klaim Poin" untuk memulai!
                            </div>
                        ) : (
                            claimsList.map((claim) => (
                                <div
                                    key={claim.id}
                                    className="p-3.5 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                                {claim.receipt_number}
                                            </span>
                                            <Badge
                                                className={
                                                    claim.status === 'approved'
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border-none text-[10px] font-bold'
                                                        : claim.status === 'rejected'
                                                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400 border-none text-[10px] font-bold'
                                                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border-none text-[10px] font-bold'
                                                }
                                            >
                                                {claim.status === 'approved'
                                                    ? 'Disetujui (+Poin Masuk)'
                                                    : claim.status === 'rejected'
                                                      ? 'Klaim Ditolak'
                                                      : 'Menunggu Verifikasi Admin'}
                                            </Badge>
                                        </div>
                                        <div className="text-[11px] text-zinc-500">
                                            {claim.merchant} &bull; {claim.category} &bull; Rp {claim.amount.toLocaleString('id-ID')}
                                        </div>
                                    </div>

                                    <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1 shrink-0">
                                        <span className="font-black text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md">
                                            +{claim.points} PTS
                                        </span>
                                        <span className="text-[10px] text-zinc-400">{claim.date}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 3. MENU CEPAT LAYANAN & KUMPUL POIN (QUICK ACTIONS GRID)                  */}
                {/* ========================================================================= */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                            Aktivitas & Perolehan Poin
                        </h3>
                        <span className="text-xs text-zinc-500">Pilihan Reward</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        {/* Klaim Struk AHASS */}
                        <div
                            onClick={() => setClaimModalOpen(true)}
                            className="flex flex-col items-center text-center gap-1.5 p-3.5 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:border-red-400 transition-all cursor-pointer group shadow-xs"
                        >
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 group-hover:scale-105 transition-transform">
                                <Receipt className="size-5" />
                            </div>
                            <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">
                                Klaim Struk AHASS
                            </span>
                            <span className="text-[9px] font-bold text-red-600 dark:text-red-400">
                                +1 Poin / Rp 1.000
                            </span>
                        </div>

                        {/* Beli Suku Cadang & Oli */}
                        <div
                            onClick={() => setClaimModalOpen(true)}
                            className="flex flex-col items-center text-center gap-1.5 p-3.5 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:border-red-400 transition-all cursor-pointer group shadow-xs"
                        >
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 group-hover:scale-105 transition-transform">
                                <ShoppingBag className="size-5" />
                            </div>
                            <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">
                                Part & Oli AHM
                            </span>
                            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                                +1 Poin / Rp 1.000
                            </span>
                        </div>

                        {/* Tukar Voucher Hadiah */}
                        <a
                            href="#voucher"
                            className="flex flex-col items-center text-center gap-1.5 p-3.5 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:border-red-400 transition-all cursor-pointer group shadow-xs"
                        >
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 group-hover:scale-105 transition-transform">
                                <Gift className="size-5" />
                            </div>
                            <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">
                                Tukar Voucher
                            </span>
                            <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">
                                Hadiah & Diskon
                            </span>
                        </a>

                        {/* Referral Teman */}
                        <div
                            onClick={() => {
                                handleCopyId();
                                toast.success('Bagikan ID Member Anda untuk mendapatkan bonus referral!');
                            }}
                            className="flex flex-col items-center text-center gap-1.5 p-3.5 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:border-red-400 transition-all cursor-pointer group shadow-xs"
                        >
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 group-hover:scale-105 transition-transform">
                                <Share2 className="size-5" />
                            </div>
                            <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">
                                Ajak Teman
                            </span>
                            <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400">
                                +200 Poin
                            </span>
                        </div>
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 4. DOMPET VOUCHER SAYA (SAVED REWARDS READY TO USE)                       */}
                {/* ========================================================================= */}
                <section id="voucher" className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Tag className="size-4 text-red-600" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                                Voucher Saya
                            </h3>
                            <span className="rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 px-2 py-0.5 text-[10px] font-bold">
                                {loyalty.vouchers.length} Siap Pakai
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {loyalty.vouchers.map((v) => (
                            <div
                                key={v.id}
                                onClick={() => setSelectedVoucher(v)}
                                className="group flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 hover:border-red-400 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                                            {v.category}
                                        </span>
                                        <span className="rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                                            {v.status}
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-2">
                                        {v.title}
                                    </h4>
                                </div>

                                <div className="mt-4 pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                                    <span className="font-mono text-zinc-500 font-medium">
                                        {v.code}
                                    </span>
                                    <span className="text-red-600 dark:text-red-400 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center">
                                        Gunakan <ChevronRight className="size-3" />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 5. TIKET UNDIAN AKTIF (RAFFLE TICKETS)                                     */}
                {/* ========================================================================= */}
                <section id="undian" className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 p-4 dark:border-amber-900/40 dark:bg-gradient-to-r dark:from-amber-950/30 dark:to-orange-950/20">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500 text-white font-bold shadow-xs">
                                <Ticket className="size-5" />
                            </div>
                            <div>
                                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                                    Anda Memiliki {loyalty.raffleTickets.length} Tiket Undian Aktif
                                </h4>
                                <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                                    {loyalty.raffleTickets[0]?.period}
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-white/80 dark:bg-black/30 px-2 py-1 rounded-md border border-amber-300 dark:border-amber-800">
                                {loyalty.raffleTickets.map((t) => t.number).join(', ')}
                            </span>
                        </div>
                    </div>
                </section>

                {/* ========================================================================= */}
                {/* 6. MUTASI RIWAYAT POIN TERBARU (ACTIVITY STATEMENT)                       */}
                {/* ========================================================================= */}
                <section id="riwayat" className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <Receipt className="size-4 text-red-600" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                                Riwayat Poin Terakhir
                            </h3>
                        </div>
                        <span className="text-xs text-zinc-500">Mutasi Transaksi</span>
                    </div>

                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                        {loyalty.transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between py-3.5">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`flex size-9 items-center justify-center rounded-xl ${
                                            tx.type === 'credit'
                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                                                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                                        }`}
                                    >
                                        {tx.type === 'credit' ? (
                                            <ArrowUpRight className="size-4.5" />
                                        ) : (
                                            <ArrowDownRight className="size-4.5" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white">
                                            {tx.title}
                                        </h4>
                                        <p className="text-[11px] text-zinc-400">
                                            {tx.dealer} &bull; {tx.date}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span
                                        className={`text-sm font-bold font-mono ${
                                            tx.type === 'credit'
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-rose-600 dark:text-rose-400'
                                        }`}
                                    >
                                        {tx.points > 0 ? `+${tx.points}` : tx.points} Poin
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* ========================================================================= */}
            {/* MODAL PENGAJUAN KLAIM POIN STRUK                                          */}
            {/* ========================================================================= */}
            <Dialog open={claimModalOpen} onOpenChange={setClaimModalOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                            <div className="size-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
                                <Receipt className="size-4" />
                            </div>
                            Klaim Poin Struk Transaksi Resmi
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500">
                            Masukkan data dari nota atau struk pembelian di dealer resmi atau bengkel AHASS
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleClaimSubmit} className="space-y-3.5 py-2 text-xs">
                        <div>
                            <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                Nomor Struk / Nota Transaksi
                            </label>
                            <Input
                                name="receipt_number"
                                placeholder="Contoh: INV/AHASS-001/0142"
                                required
                                className="text-xs h-9 rounded-xl font-mono"
                            />
                        </div>

                        <div>
                            <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                Tempat Transaksi / Nama Bengkel AHASS
                            </label>
                            <Input
                                name="merchant"
                                placeholder="Contoh: AHASS Mitra Motor Utama"
                                required
                                className="text-xs h-9 rounded-xl"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                    Kategori Transaksi
                                </label>
                                <select
                                    name="category"
                                    className="w-full h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs focus:ring-2 focus:ring-red-500 outline-none"
                                >
                                    <option value="Servis & Oli AHASS">Servis & Oli AHASS</option>
                                    <option value="Suku Cadang HGP">Suku Cadang HGP</option>
                                    <option value="Aksesori & Apparel">Aksesori & Apparel</option>
                                    <option value="Pembelian Unit Motor">Pembelian Unit Motor</option>
                                </select>
                            </div>
                            <div>
                                <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                    Total Nilai (Rp)
                                </label>
                                <Input
                                    name="amount"
                                    type="number"
                                    min="1000"
                                    step="1000"
                                    placeholder="185000"
                                    required
                                    className="text-xs h-9 rounded-xl"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                Catatan / Keterangan Pembelian
                            </label>
                            <Input
                                name="notes"
                                placeholder="Contoh: Servis berkala 10.000 KM dan ganti oli MPX"
                                className="text-xs h-9 rounded-xl"
                            />
                        </div>

                        <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-100 dark:border-red-900/40 text-[11px] text-red-800 dark:text-red-300">
                            <strong>Ketentuan Poin:</strong> Setiap Rp 1.000 nilai transaksi resmi menghasilkan 1 Poin reward. Poin akan masuk ke saldo setelah diverifikasi oleh Admin.
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="submit"
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-10 rounded-xl cursor-pointer shadow-md shadow-red-600/20"
                            >
                                Kirim Pengajuan Klaim Poin
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* MODAL DETAIL VOUCHER & KODE KLAIM                                          */}
            {/* ========================================================================= */}
            <Dialog open={!!selectedVoucher} onOpenChange={(open) => !open && setSelectedVoucher(null)}>
                <DialogContent className="sm:max-w-md rounded-3xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                    {selectedVoucher && (
                        <>
                            <DialogHeader className="text-center space-y-1 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                                <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-600">
                                    {selectedVoucher.category}
                                </span>
                                <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white">
                                    {selectedVoucher.title}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-zinc-500">
                                    Berlaku hingga {selectedVoucher.expiresAt} di seluruh jaringan AHASS resmi
                                </DialogDescription>
                            </DialogHeader>

                            <div className="my-4 flex flex-col items-center text-center space-y-4">
                                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                                    <img
                                        src={selectedVoucher.image}
                                        alt={selectedVoucher.title}
                                        className="h-full w-full object-cover object-center"
                                    />
                                </div>

                                <div className="w-full rounded-2xl border-2 border-dashed border-red-300 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 p-4">
                                    <span className="text-xs text-zinc-500 block mb-1">Kode Voucher Anda</span>
                                    <span className="font-mono text-xl font-extrabold text-red-600 tracking-wider">
                                        {selectedVoucher.code}
                                    </span>
                                </div>

                                <p className="text-xs text-zinc-500">
                                    Tunjukkan kode voucher ini bersama ID MEMBER Anda kepada kasir dealer saat melakukan pembayaran.
                                </p>
                            </div>

                            <Button
                                type="button"
                                onClick={() => setSelectedVoucher(null)}
                                className="w-full rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs"
                            >
                                Tutup & Simpan
                            </Button>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </CustomerLayout>
    );
}
