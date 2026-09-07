import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    Download,
    Edit3,
    Filter,
    KeyRound,
    Lock,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    Plus,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    UserCheck,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';
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
import PasswordInput from '@/components/password-input';
import AppLayout from '@/layouts/app-layout';
import type { User as AuthUser } from '@/types';

type UserItem = {
    id: string;
    name: string;
    email: string;
    phone_number: string;
    address: string;
    role: 'user' | 'admin' | string;
    is_verified: boolean;
    points?: number;
    lifetime_points?: number;
    tier?: string;
    created_at: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedUsers = {
    data: UserItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
};

type Props = {
    users: PaginatedUsers;
    filters: {
        search: string;
        role: string;
        status: string;
    };
    stats: {
        totalUsers: number;
        totalAdmins: number;
        totalRegularUsers: number;
        totalVerified: number;
        verifiedRate: number;
    };
};

export default function AdminUsersIndex({ users, filters, stats }: Props) {
    const { auth } = usePage<{ auth: { user: AuthUser } }>().props;
    const currentAdminId = String(auth?.user?.id);

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedRole, setSelectedRole] = useState(filters.role || 'all');
    const [selectedStatus, setSelectedStatus] = useState(
        filters.status || 'all',
    );

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);

    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [tempRole, setTempRole] = useState(filters.role || 'all');
    const [tempStatus, setTempStatus] = useState(filters.status || 'all');

    const activeFilterCount =
        (selectedRole !== 'all' ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0);

    // Create User Form
    const createForm = useForm({
        name: '',
        email: '',
        phone_number: '',
        address: '',
        role: 'user',
        password: '',
        is_verified: true,
    });

    // Edit User Form
    const editForm = useForm({
        name: '',
        email: '',
        phone_number: '',
        address: '',
        role: 'user',
        password: '',
        is_verified: false,
    });

    // Handle filter submit
    const applyFilters = (
        newSearch?: string,
        newRole?: string,
        newStatus?: string,
    ) => {
        router.get(
            '/admin/users',
            {
                search: newSearch !== undefined ? newSearch : searchQuery,
                role: newRole !== undefined ? newRole : selectedRole,
                status: newStatus !== undefined ? newStatus : selectedStatus,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    // Open edit modal
    const openEditModal = (user: UserItem) => {
        setEditingUser(user);
        editForm.setData({
            name: user.name,
            email: user.email,
            phone_number: user.phone_number !== '-' ? user.phone_number : '',
            address: user.address !== '-' ? user.address : '',
            role: user.role,
            password: '',
            is_verified: user.is_verified,
        });
    };

    // Submit Create
    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/admin/users', {
            onSuccess: () => {
                setCreateModalOpen(false);
                createForm.reset();
                toast.success('Pengguna baru berhasil ditambahkan.');
            },
            onError: (errs) => {
                const firstError = Object.values(errs)[0];
                toast.error(firstError || 'Gagal menambahkan pengguna.');
            },
        });
    };

    // Submit Edit
    const handleUpdateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        editForm.put(`/admin/users/${editingUser.id}`, {
            onSuccess: () => {
                setEditingUser(null);
                toast.success('Data pengguna berhasil diperbarui.');
            },
            onError: (errs) => {
                const firstError = Object.values(errs)[0];
                toast.error(firstError || 'Gagal memperbarui pengguna.');
            },
        });
    };

    // Submit Delete
    const handleDeleteUser = () => {
        if (!deletingUser) return;
        router.delete(`/admin/users/${deletingUser.id}`, {
            onSuccess: () => {
                setDeletingUser(null);
                toast.success('Pengguna berhasil dihapus.');
            },
            onError: (errs) => {
                const firstError = Object.values(errs)[0];
                toast.error(firstError || 'Gagal menghapus pengguna.');
            },
        });
    };

    // Copy to clipboard helper
    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} berhasil disalin ke clipboard.`);
    };

    return (
        <>
            <Head title="Manajemen Pengguna - Honda Loyalty Admin" />

            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-8">
                {/* Header Banner */}
                <div className="relative flex flex-col gap-5 overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-red-700 to-zinc-950 p-6 text-white shadow-xl shadow-red-950/20 md:p-8 lg:flex-row lg:items-center lg:justify-between">
                    <div className="pointer-events-none absolute right-0 -bottom-11 opacity-15 select-none">
                        <img
                            src="/images/logo/honda_logo_white.png"
                            alt="Honda"
                            className="h-auto w-84 md:w-96"
                        />
                    </div>

                    <div className="relative z-10 max-w-2xl space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-bold text-white shadow-xs backdrop-blur-md">
                                <Users className="size-3.5" />
                                Modul CRUD Pengguna & Role Guard
                            </span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl lg:text-4xl">
                            Manajemen Akun Pengguna
                        </h1>
                        <p className="text-xs leading-relaxed text-red-100/90 md:text-sm">
                            Kelola pendaftaran anggota, ubah peran akun (User /
                            Administrator), perbarui kontak & alamat, atur kata
                            sandi, dan validasi status email pelanggan.
                        </p>
                    </div>

                    <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-3">
                        <Link
                            href="/admin/dashboard"
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-white/20 md:text-sm"
                        >
                            <ArrowLeft className="size-4" />
                            Kembali ke Dashboard
                        </Link>
                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            className="h-10 cursor-pointer gap-2 rounded-xl bg-white px-4 text-xs font-bold text-red-700 shadow-md hover:bg-red-50 md:text-sm"
                        >
                            <UserPlus className="size-4 text-red-600" />
                            Tambah Pengguna Baru
                        </Button>
                    </div>
                </div>

                {/* KPI Metrics Strip */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Stat 1: Total Users */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold tracking-wider text-zinc-600 uppercase dark:text-zinc-300">
                                Total Pengguna
                            </span>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60">
                                <Users className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.totalUsers.toLocaleString('id-ID')}
                            </div>
                            <span className="mt-1 block text-xs text-zinc-500">
                                Akun terdaftar di database
                            </span>
                        </div>
                    </div>

                    {/* Stat 2: Total Admins */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold tracking-wider text-zinc-600 uppercase dark:text-zinc-300">
                                Administrator
                            </span>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60">
                                <ShieldCheck className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.totalAdmins.toLocaleString('id-ID')}
                            </div>
                            <span className="mt-1 block text-xs font-semibold text-rose-600">
                                Hak akses admin penuh
                            </span>
                        </div>
                    </div>

                    {/* Stat 3: Total Regular Users */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold tracking-wider text-zinc-600 uppercase dark:text-zinc-300">
                                Member Pelanggan
                            </span>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60">
                                <UserCheck className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.totalRegularUsers.toLocaleString(
                                    'id-ID',
                                )}
                            </div>
                            <span className="mt-1 block text-xs font-semibold text-blue-600">
                                Akun pengguna rewards
                            </span>
                        </div>
                    </div>

                    {/* Stat 4: Email Verification */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold tracking-wider text-zinc-600 uppercase dark:text-zinc-300">
                                Terverifikasi Email
                            </span>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60">
                                <CheckCircle2 className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.verifiedRate}%
                            </div>
                            <span className="mt-1 block text-xs font-semibold text-emerald-600">
                                {stats.totalVerified} dari {stats.totalUsers}{' '}
                                akun
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Table Container */}
                <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    {/* Filter & Search Bar */}
                    <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 p-6 md:flex-row md:items-center dark:border-zinc-800">
                        {/* Search */}
                        <div className="relative w-full md:w-80">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                            <Input
                                type="text"
                                placeholder="Cari nama, email, telepon, ID..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    applyFilters(
                                        e.target.value,
                                        selectedRole,
                                        selectedStatus,
                                    );
                                }}
                                className="h-9.5 rounded-xl pl-9 text-xs focus-visible:ring-red-500"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        applyFilters(
                                            '',
                                            selectedRole,
                                            selectedStatus,
                                        );
                                    }}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Actions: Filter Modal Trigger & Export */}
                        <div className="flex items-center gap-2.5">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setTempRole(selectedRole);
                                    setTempStatus(selectedStatus);
                                    setFilterModalOpen(true);
                                }}
                                className={`h-9.5 cursor-pointer gap-2 rounded-xl text-xs transition-all ${
                                    activeFilterCount > 0
                                        ? 'border-red-300 bg-red-50/70 font-bold text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400'
                                        : 'text-zinc-700 dark:text-zinc-300'
                                }`}
                            >
                                <Filter className="size-3.5 text-red-600" />
                                <span>Filter</span>
                                {activeFilterCount > 0 && (
                                    <span className="flex size-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    const csv = users.data
                                        .map(
                                            (u) =>
                                                `"${u.id}","${u.name}","${u.email}","${u.phone_number}","${u.address}","${u.role}","${u.tier || 'Bronze'}","${u.points ?? 0}","${u.lifetime_points ?? 0}","${u.is_verified ? 'Verified' : 'Pending'}"`,
                                        )
                                        .join('\n');
                                    const header =
                                        '"ID Member","Nama Lengkap","Email","No. Telepon","Alamat","Role","Level Member","Saldo Poin","Poin Akumulasi","Status Email"\n';
                                    handleCopy(
                                        header + csv,
                                        'Data Pengguna (CSV)',
                                    );
                                }}
                                className="h-9.5 cursor-pointer gap-1.5 rounded-xl text-xs"
                            >
                                <Download className="size-3.5" />
                                Ekspor CSV
                            </Button>
                        </div>
                    </div>

                    {/* Active Filter Chips */}
                    {activeFilterCount > 0 && (
                        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200/80 bg-zinc-50/70 px-6 py-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
                            <span className="text-[11px] font-medium text-zinc-400">
                                Filter Aktif:
                            </span>

                            {selectedRole !== 'all' && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-300">
                                    Role:{' '}
                                    {selectedRole === 'admin'
                                        ? 'Admin'
                                        : 'Member'}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedRole('all');
                                            applyFilters(
                                                searchQuery,
                                                'all',
                                                selectedStatus,
                                            );
                                        }}
                                        className="cursor-pointer hover:text-red-900"
                                        title="Hapus filter role"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </span>
                            )}

                            {selectedStatus !== 'all' && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    Status:{' '}
                                    {selectedStatus === 'verified'
                                        ? 'Terverifikasi'
                                        : 'Belum Verifikasi'}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedStatus('all');
                                            applyFilters(
                                                searchQuery,
                                                selectedRole,
                                                'all',
                                            );
                                        }}
                                        className="cursor-pointer hover:text-emerald-900"
                                        title="Hapus filter status"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </span>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedRole('all');
                                    setSelectedStatus('all');
                                    applyFilters(searchQuery, 'all', 'all');
                                }}
                                className="ml-1 cursor-pointer text-[11px] text-zinc-500 underline hover:text-red-600"
                            >
                                Reset Semua
                            </button>
                        </div>
                    )}

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-zinc-200 bg-zinc-50 font-bold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60">
                                <tr>
                                    <th className="px-4 py-3.5">ID Member</th>
                                    <th className="px-4 py-3.5">
                                        Nama Lengkap & Email
                                    </th>
                                    <th className="px-4 py-3.5">
                                        Kontak & WhatsApp
                                    </th>
                                    <th className="px-4 py-3.5">
                                        Alamat Domisili
                                    </th>
                                    <th className="px-4 py-3.5">Role Akun</th>
                                    <th className="px-4 py-3.5">
                                        Level & Poin
                                    </th>
                                    <th className="px-4 py-3.5">
                                        Verifikasi Email
                                    </th>
                                    <th className="px-4 py-3.5">Terdaftar</th>
                                    <th className="px-4 py-3.5 text-right">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="py-12 text-center text-zinc-400"
                                        >
                                            Tidak ada data pengguna yang sesuai
                                            dengan filter pencarian.
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user) => {
                                        const isSelf =
                                            user.id === currentAdminId;

                                        return (
                                            <tr
                                                key={user.id}
                                                className="transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40"
                                            >
                                                <td className="px-4 py-3.5 font-mono font-bold text-red-600 dark:text-red-400">
                                                    #{user.id}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100">
                                                        <span>{user.name}</span>
                                                        {isSelf && (
                                                            <Badge
                                                                variant="outline"
                                                                className="border-red-300 px-1 py-0 text-[9px] text-red-600"
                                                            >
                                                                Anda
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-500">
                                                        <Mail className="size-3 text-zinc-400" />
                                                        <span>
                                                            {user.email}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
                                                            {user.phone_number}
                                                        </span>
                                                        {user.phone_number &&
                                                            user.phone_number !==
                                                                '-' && (
                                                                <a
                                                                    href={`https://wa.me/${user.phone_number.replace(/^0/, '62')}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                                                                    title="Chat via WhatsApp"
                                                                >
                                                                    <MessageCircle className="size-3.5" />
                                                                </a>
                                                            )}
                                                    </div>
                                                </td>
                                                <td className="max-w-xs truncate px-4 py-3.5 text-zinc-600 dark:text-zinc-400">
                                                    <span title={user.address}>
                                                        {user.address}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <Badge
                                                        variant={
                                                            user.role ===
                                                            'admin'
                                                                ? 'destructive'
                                                                : 'secondary'
                                                        }
                                                        className="text-[10px] font-bold capitalize"
                                                    >
                                                        {user.role === 'admin'
                                                            ? 'Administrator'
                                                            : 'Member'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="space-y-1">
                                                        <Badge
                                                            className={`border px-2 py-0.5 text-[9px] font-extrabold ${
                                                                user.tier ===
                                                                'Diamond'
                                                                    ? 'border-purple-300 bg-purple-100 text-purple-700 dark:border-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                                                    : user.tier ===
                                                                        'Platinum'
                                                                      ? 'border-cyan-300 bg-cyan-100 text-cyan-700 dark:border-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300'
                                                                      : user.tier ===
                                                                          'Gold'
                                                                        ? 'border-yellow-400 bg-yellow-100 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300'
                                                                        : user.tier ===
                                                                            'Silver'
                                                                          ? 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                                                          : 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                            }`}
                                                        >
                                                            {user.tier ||
                                                                'Bronze'}{' '}
                                                            Member
                                                        </Badge>
                                                        <div className="font-mono text-[10px] whitespace-nowrap text-zinc-500">
                                                            <span>
                                                                Saldo:{' '}
                                                                <strong className="text-zinc-800 dark:text-zinc-200">
                                                                    {(
                                                                        user.points ??
                                                                        0
                                                                    ).toLocaleString(
                                                                        'id-ID',
                                                                    )}
                                                                </strong>
                                                            </span>
                                                            <span className="mx-1">
                                                                •
                                                            </span>
                                                            <span>
                                                                Akumulasi:{' '}
                                                                <strong className="text-amber-600 dark:text-amber-400">
                                                                    {(
                                                                        user.lifetime_points ??
                                                                        0
                                                                    ).toLocaleString(
                                                                        'id-ID',
                                                                    )}
                                                                </strong>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {user.is_verified ? (
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
                                                    {user.created_at}
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    user,
                                                                )
                                                            }
                                                            className="h-8 cursor-pointer rounded-lg px-2 text-xs text-zinc-600 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                                                            title="Edit Pengguna"
                                                        >
                                                            <Edit3 className="mr-1 size-3.5" />
                                                            Edit
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            disabled={isSelf}
                                                            onClick={() =>
                                                                setDeletingUser(
                                                                    user,
                                                                )
                                                            }
                                                            className="h-8 cursor-pointer rounded-lg px-2 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-950/40"
                                                            title={
                                                                isSelf
                                                                    ? 'Tidak dapat menghapus akun sendiri'
                                                                    : 'Hapus Pengguna'
                                                            }
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {users.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-zinc-200 p-4 text-xs dark:border-zinc-800">
                            <span className="text-zinc-500">
                                Menampilkan halaman{' '}
                                <strong>{users.current_page}</strong> dari{' '}
                                <strong>{users.last_page}</strong> (
                                {users.total} total)
                            </span>

                            <div className="flex items-center gap-1">
                                {users.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        preserveScroll
                                        className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                                            link.active
                                                ? 'bg-red-600 font-bold text-white'
                                                : link.url
                                                  ? 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                                                  : 'pointer-events-none text-zinc-300 dark:text-zinc-600'
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: TAMBAH PENGGUNA BARU */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent className="rounded-3xl p-6 sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60">
                                <UserPlus className="size-4" />
                            </div>
                            Tambah Pengguna Baru
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Daftarkan akun member loyalitas atau administrator
                            baru ke sistem Honda Rewards
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={handleCreateUser}
                        className="space-y-4 py-2 text-xs"
                    >
                        <div>
                            <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                Nama Lengkap
                            </label>
                            <Input
                                value={createForm.data.name}
                                onChange={(e) =>
                                    createForm.setData('name', e.target.value)
                                }
                                placeholder="Contoh: Budi Santoso"
                                required
                                className="h-9.5 rounded-xl text-xs"
                            />
                            {createForm.errors.name && (
                                <p className="mt-1 text-[11px] text-red-600">
                                    {createForm.errors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                Alamat Email
                            </label>
                            <Input
                                type="email"
                                value={createForm.data.email}
                                onChange={(e) =>
                                    createForm.setData('email', e.target.value)
                                }
                                placeholder="budi@contoh.com"
                                required
                                className="h-9.5 rounded-xl text-xs"
                            />
                            {createForm.errors.email && (
                                <p className="mt-1 text-[11px] text-red-600">
                                    {createForm.errors.email}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                    Nomor Telepon / WhatsApp
                                </label>
                                <Input
                                    value={createForm.data.phone_number}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'phone_number',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="081234567890"
                                    className="h-9.5 rounded-xl font-mono text-xs"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                    Role Pengguna
                                </label>
                                <select
                                    value={createForm.data.role}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'role',
                                            e.target.value,
                                        )
                                    }
                                    className="h-9.5 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs outline-none focus:ring-2 focus:ring-red-500 dark:border-zinc-800 dark:bg-zinc-900"
                                >
                                    <option value="user">Member (User)</option>
                                    <option value="admin">
                                        Administrator (Admin)
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                Alamat Lengkap
                            </label>
                            <Input
                                value={createForm.data.address}
                                onChange={(e) =>
                                    createForm.setData(
                                        'address',
                                        e.target.value,
                                    )
                                }
                                placeholder="Jl. Sudirman No. 45, Jakarta Pusat"
                                className="h-9.5 rounded-xl text-xs"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                Kata Sandi Awal
                            </label>
                            <PasswordInput
                                value={createForm.data.password}
                                onChange={(e) =>
                                    createForm.setData(
                                        'password',
                                        e.target.value,
                                    )
                                }
                                placeholder="Minimal 8 karakter"
                                required
                                className="h-9.5 rounded-xl text-xs"
                            />
                            {createForm.errors.password && (
                                <p className="mt-1 text-[11px] text-red-600">
                                    {createForm.errors.password}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="create_verified"
                                checked={createForm.data.is_verified}
                                onChange={(e) =>
                                    createForm.setData(
                                        'is_verified',
                                        e.target.checked,
                                    )
                                }
                                className="size-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
                            />
                            <label
                                htmlFor="create_verified"
                                className="cursor-pointer text-xs text-zinc-700 select-none dark:text-zinc-300"
                            >
                                Tandai alamat email langsung berstatus{' '}
                                <strong>Terverifikasi</strong>
                            </label>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateModalOpen(false)}
                                className="h-9.5 rounded-xl text-xs"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={createForm.processing}
                                className="h-9.5 rounded-xl bg-red-600 px-5 text-xs font-bold text-white hover:bg-red-700"
                            >
                                {createForm.processing
                                    ? 'Menyimpan...'
                                    : 'Daftarkan Pengguna'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL: EDIT PENGGUNA */}
            <Dialog
                open={!!editingUser}
                onOpenChange={() => setEditingUser(null)}
            >
                <DialogContent className="rounded-3xl p-6 sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60">
                                <Edit3 className="size-4" />
                            </div>
                            Edit Data Pengguna
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Perbarui informasi profil, hak akses role, kata
                            sandi, atau verifikasi akun #{editingUser?.id}
                        </DialogDescription>
                    </DialogHeader>

                    {editingUser && (
                        <form
                            onSubmit={handleUpdateUser}
                            className="space-y-4 py-2 text-xs"
                        >
                            <div>
                                <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                    Nama Lengkap
                                </label>
                                <Input
                                    value={editForm.data.name}
                                    onChange={(e) =>
                                        editForm.setData('name', e.target.value)
                                    }
                                    required
                                    className="h-9.5 rounded-xl text-xs"
                                />
                                {editForm.errors.name && (
                                    <p className="mt-1 text-[11px] text-red-600">
                                        {editForm.errors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                    Alamat Email
                                </label>
                                <Input
                                    type="email"
                                    value={editForm.data.email}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'email',
                                            e.target.value,
                                        )
                                    }
                                    required
                                    className="h-9.5 rounded-xl text-xs"
                                />
                                {editForm.errors.email && (
                                    <p className="mt-1 text-[11px] text-red-600">
                                        {editForm.errors.email}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                        Nomor Telepon / WhatsApp
                                    </label>
                                    <Input
                                        value={editForm.data.phone_number}
                                        onChange={(e) =>
                                            editForm.setData(
                                                'phone_number',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="081234567890"
                                        className="h-9.5 rounded-xl font-mono text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                        Role Akun
                                    </label>
                                    <select
                                        value={editForm.data.role}
                                        onChange={(e) =>
                                            editForm.setData(
                                                'role',
                                                e.target.value,
                                            )
                                        }
                                        className="h-9.5 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs outline-none focus:ring-2 focus:ring-red-500 dark:border-zinc-800 dark:bg-zinc-900"
                                    >
                                        <option value="user">
                                            Member (User)
                                        </option>
                                        <option value="admin">
                                            Administrator (Admin)
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block font-bold text-zinc-800 dark:text-zinc-200">
                                    Alamat Lengkap
                                </label>
                                <Input
                                    value={editForm.data.address}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'address',
                                            e.target.value,
                                        )
                                    }
                                    className="h-9.5 rounded-xl text-xs"
                                />
                            </div>

                            <div className="space-y-2 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
                                <label className="block flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
                                    <KeyRound className="size-3.5 text-zinc-500" />
                                    Ubah Kata Sandi (Opsional)
                                </label>
                                <PasswordInput
                                    value={editForm.data.password}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Biarkan kosong jika tidak ingin mengubah sandi"
                                    className="h-9 rounded-xl text-xs"
                                />
                                <span className="block text-[10px] text-zinc-400">
                                    Minimal 8 karakter jika ingin mengatur ulang
                                    kata sandi pengguna.
                                </span>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="edit_verified"
                                    checked={editForm.data.is_verified}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'is_verified',
                                            e.target.checked,
                                        )
                                    }
                                    className="size-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
                                />
                                <label
                                    htmlFor="edit_verified"
                                    className="cursor-pointer text-xs text-zinc-700 select-none dark:text-zinc-300"
                                >
                                    Status Email <strong>Terverifikasi</strong>{' '}
                                    (centang untuk memverifikasi)
                                </label>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingUser(null)}
                                    className="h-9.5 rounded-xl text-xs"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="h-9.5 rounded-xl bg-red-600 px-5 text-xs font-bold text-white hover:bg-red-700"
                                >
                                    {editForm.processing
                                        ? 'Menyimpan...'
                                        : 'Perbarui Data'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* MODAL: KONFIRMASI HAPUS PENGGUNA */}
            <Dialog
                open={!!deletingUser}
                onOpenChange={() => setDeletingUser(null)}
            >
                <DialogContent className="rounded-3xl p-6 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-rose-600">
                            <AlertCircle className="size-5" />
                            Konfirmasi Hapus Pengguna
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Tindakan ini permanen dan tidak dapat dibatalkan
                        </DialogDescription>
                    </DialogHeader>

                    {deletingUser && (
                        <div className="space-y-3 py-2 text-xs text-zinc-600 dark:text-zinc-300">
                            <p>
                                Apakah Anda yakin ingin menghapus akun pengguna
                                berikut dari database?
                            </p>
                            <div className="space-y-1 rounded-2xl border border-rose-200 bg-rose-50/50 p-3.5 dark:border-rose-900/40 dark:bg-rose-950/20">
                                <div className="text-sm font-bold text-zinc-900 dark:text-white">
                                    {deletingUser.name}
                                </div>
                                <div className="font-mono text-[11px] text-zinc-500">
                                    ID: #{deletingUser.id} &bull;{' '}
                                    {deletingUser.email}
                                </div>
                                <Badge
                                    variant={
                                        deletingUser.role === 'admin'
                                            ? 'destructive'
                                            : 'secondary'
                                    }
                                    className="mt-1 text-[9px] font-bold uppercase"
                                >
                                    {deletingUser.role}
                                </Badge>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeletingUser(null)}
                            className="h-9 rounded-xl text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteUser}
                            className="h-9 rounded-xl bg-rose-600 text-xs font-bold hover:bg-rose-700"
                        >
                            Ya, Hapus Pengguna Ini
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL: FILTER PENGGUNA */}
            <Dialog open={filterModalOpen} onOpenChange={setFilterModalOpen}>
                <DialogContent className="rounded-3xl p-6 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60">
                                <Filter className="size-4" />
                            </div>
                            Filter Data Pengguna
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Saring data pengguna berdasarkan tipe role akun dan
                            status verifikasi email
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-2 text-xs">
                        {/* Pilihan Role */}
                        <div className="space-y-2">
                            <label className="block font-bold text-zinc-800 dark:text-zinc-200">
                                Role Akun
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTempRole('all')}
                                    className={`cursor-pointer rounded-2xl border p-3 text-center transition-all ${
                                        tempRole === 'all'
                                            ? 'border-red-600 bg-red-50/70 font-bold text-red-600 shadow-xs dark:bg-red-950/50'
                                            : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-300'
                                    }`}
                                >
                                    Semua Role
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTempRole('user')}
                                    className={`cursor-pointer rounded-2xl border p-3 text-center transition-all ${
                                        tempRole === 'user'
                                            ? 'border-red-600 bg-red-50/70 font-bold text-red-600 shadow-xs dark:bg-red-950/50'
                                            : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-300'
                                    }`}
                                >
                                    Member
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTempRole('admin')}
                                    className={`cursor-pointer rounded-2xl border p-3 text-center transition-all ${
                                        tempRole === 'admin'
                                            ? 'border-red-600 bg-red-50/70 font-bold text-red-600 shadow-xs dark:bg-red-950/50'
                                            : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-300'
                                    }`}
                                >
                                    Admin
                                </button>
                            </div>
                        </div>

                        {/* Pilihan Status Verifikasi */}
                        <div className="space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                            <label className="block font-bold text-zinc-800 dark:text-zinc-200">
                                Status Verifikasi Email
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTempStatus('all')}
                                    className={`cursor-pointer rounded-2xl border p-3 text-center transition-all ${
                                        tempStatus === 'all'
                                            ? 'border-red-600 bg-red-50/70 font-bold text-red-600 shadow-xs dark:bg-red-950/50'
                                            : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-300'
                                    }`}
                                >
                                    Status: Semua
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTempStatus('verified')}
                                    className={`cursor-pointer rounded-2xl border p-3 text-center transition-all ${
                                        tempStatus === 'verified'
                                            ? 'border-emerald-600 bg-emerald-50/70 font-bold text-emerald-600 shadow-xs dark:bg-emerald-950/50'
                                            : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-300'
                                    }`}
                                >
                                    Terverifikasi
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTempStatus('unverified')}
                                    className={`cursor-pointer rounded-2xl border p-3 text-center transition-all ${
                                        tempStatus === 'unverified'
                                            ? 'border-amber-600 bg-amber-50/70 font-bold text-amber-600 shadow-xs dark:bg-amber-950/50'
                                            : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-300'
                                    }`}
                                >
                                    Belum Verifikasi
                                </button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 pt-3 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setTempRole('all');
                                setTempStatus('all');
                                setSelectedRole('all');
                                setSelectedStatus('all');
                                applyFilters(searchQuery, 'all', 'all');
                                setFilterModalOpen(false);
                                toast.success(
                                    'Filter telah direset ke default.',
                                );
                            }}
                            className="h-9.5 rounded-xl text-xs"
                        >
                            Reset Filter
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                setSelectedRole(tempRole);
                                setSelectedStatus(tempStatus);
                                applyFilters(searchQuery, tempRole, tempStatus);
                                setFilterModalOpen(false);
                                toast.success('Filter berhasil diterapkan.');
                            }}
                            className="h-9.5 rounded-xl bg-red-600 px-5 text-xs font-bold text-white hover:bg-red-700"
                        >
                            Terapkan Filter
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

AdminUsersIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            {
                title: 'Admin Console',
                href: '/admin/dashboard',
            },
            {
                title: 'Manajemen User',
                href: '/admin/users',
            },
        ]}
    >
        {page}
    </AppLayout>
);
