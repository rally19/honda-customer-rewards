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
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);

    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [tempRole, setTempRole] = useState(filters.role || 'all');
    const [tempStatus, setTempStatus] = useState(filters.status || 'all');

    const activeFilterCount = (selectedRole !== 'all' ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0);

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
    const applyFilters = (newSearch?: string, newRole?: string, newStatus?: string) => {
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
            }
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

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header Banner */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 bg-gradient-to-r from-red-600 via-red-700 to-zinc-950 text-white p-6 md:p-8 rounded-3xl shadow-xl shadow-red-950/20 relative overflow-hidden">
                    <div className="absolute -right-8 -bottom-10 opacity-15 pointer-events-none select-none">
                        <img src="/images/logo/honda_logo_white.png" alt="Honda" className="w-84 md:w-96 h-auto" />
                    </div>

                    <div className="relative z-10 space-y-2 max-w-2xl">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-xs">
                                <Users className="size-3.5" />
                                Modul CRUD Pengguna & Role Guard
                            </span>
                            <span className="text-xs text-red-200/90 font-mono">Honda Admin v2.5</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white">
                            Manajemen Akun Pengguna
                        </h1>
                        <p className="text-xs md:text-sm text-red-100/90 leading-relaxed">
                            Kelola pendaftaran anggota, ubah peran akun (User / Administrator), perbarui kontak & alamat, atur kata sandi, dan validasi status email pelanggan.
                        </p>
                    </div>

                    <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
                        <Link
                            href="/admin/dashboard"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
                        >
                            <ArrowLeft className="size-4" />
                            Kembali ke Dashboard
                        </Link>
                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            className="bg-white text-red-700 hover:bg-red-50 text-xs md:text-sm font-bold gap-2 h-10 px-4 rounded-xl shadow-md cursor-pointer"
                        >
                            <UserPlus className="size-4 text-red-600" />
                            Tambah Pengguna Baru
                        </Button>
                    </div>
                </div>

                {/* KPI Metrics Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Stat 1: Total Users */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-2xl shadow-xs">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                Total Pengguna
                            </span>
                            <div className="size-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
                                <Users className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.totalUsers.toLocaleString('id-ID')}
                            </div>
                            <span className="text-xs text-zinc-500 mt-1 block">Akun terdaftar di database</span>
                        </div>
                    </div>

                    {/* Stat 2: Total Admins */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-2xl shadow-xs">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                Administrator
                            </span>
                            <div className="size-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                                <ShieldCheck className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.totalAdmins.toLocaleString('id-ID')}
                            </div>
                            <span className="text-xs text-rose-600 font-semibold mt-1 block">Hak akses admin penuh</span>
                        </div>
                    </div>

                    {/* Stat 3: Total Regular Users */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-2xl shadow-xs">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                Member Pelanggan
                            </span>
                            <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                                <UserCheck className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.totalRegularUsers.toLocaleString('id-ID')}
                            </div>
                            <span className="text-xs text-blue-600 font-semibold mt-1 block">Akun pengguna rewards</span>
                        </div>
                    </div>

                    {/* Stat 4: Email Verification */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 rounded-2xl shadow-xs">
                        <div className="flex items-center justify-between text-zinc-500">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                Terverifikasi Email
                            </span>
                            <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stats.verifiedRate}%
                            </div>
                            <span className="text-xs text-emerald-600 font-semibold mt-1 block">
                                {stats.totalVerified} dari {stats.totalUsers} akun
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Table Container */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs overflow-hidden">
                    {/* Filter & Search Bar */}
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Search */}
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                            <Input
                                type="text"
                                placeholder="Cari nama, email, telepon, ID..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    applyFilters(e.target.value, selectedRole, selectedStatus);
                                }}
                                className="pl-9 h-9.5 text-xs rounded-xl focus-visible:ring-red-500"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        applyFilters('', selectedRole, selectedStatus);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
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
                                className={`text-xs h-9.5 gap-2 rounded-xl transition-all cursor-pointer ${
                                    activeFilterCount > 0
                                        ? 'border-red-300 dark:border-red-900 bg-red-50/70 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold'
                                        : 'text-zinc-700 dark:text-zinc-300'
                                }`}
                            >
                                <Filter className="size-3.5 text-red-600" />
                                <span>Filter</span>
                                {activeFilterCount > 0 && (
                                    <span className="size-5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    const csv = users.data
                                        .map((u) => `"${u.id}","${u.name}","${u.email}","${u.phone_number}","${u.address}","${u.role}","${u.tier || 'Bronze'}","${u.points ?? 0}","${u.lifetime_points ?? 0}","${u.is_verified ? 'Verified' : 'Pending'}"`)
                                        .join('\n');
                                    const header = '"ID Member","Nama Lengkap","Email","No. Telepon","Alamat","Role","Level Member","Saldo Poin","Poin Akumulasi","Status Email"\n';
                                    handleCopy(header + csv, 'Data Pengguna (CSV)');
                                }}
                                className="text-xs h-9.5 gap-1.5 rounded-xl cursor-pointer"
                            >
                                <Download className="size-3.5" />
                                Ekspor CSV
                            </Button>
                        </div>
                    </div>

                    {/* Active Filter Chips */}
                    {activeFilterCount > 0 && (
                        <div className="px-6 py-2.5 bg-zinc-50/70 dark:bg-zinc-950/40 border-b border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-zinc-400 text-[11px] font-medium">Filter Aktif:</span>

                            {selectedRole !== 'all' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-semibold text-[11px]">
                                    Role: {selectedRole === 'admin' ? 'Admin' : 'Member'}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedRole('all');
                                            applyFilters(searchQuery, 'all', selectedStatus);
                                        }}
                                        className="hover:text-red-900 cursor-pointer"
                                        title="Hapus filter role"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </span>
                            )}

                            {selectedStatus !== 'all' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                                    Status: {selectedStatus === 'verified' ? 'Terverifikasi' : 'Belum Verifikasi'}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedStatus('all');
                                            applyFilters(searchQuery, selectedRole, 'all');
                                        }}
                                        className="hover:text-emerald-900 cursor-pointer"
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
                                className="text-[11px] text-zinc-500 hover:text-red-600 underline ml-1 cursor-pointer"
                            >
                                Reset Semua
                            </button>
                        </div>
                    )}

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-50 dark:bg-zinc-950/60 text-zinc-500 font-bold border-b border-zinc-200 dark:border-zinc-800">
                                <tr>
                                    <th className="py-3.5 px-4">ID Member</th>
                                    <th className="py-3.5 px-4">Nama Lengkap & Email</th>
                                    <th className="py-3.5 px-4">Kontak & WhatsApp</th>
                                    <th className="py-3.5 px-4">Alamat Domisili</th>
                                    <th className="py-3.5 px-4">Role Akun</th>
                                    <th className="py-3.5 px-4">Level & Poin</th>
                                    <th className="py-3.5 px-4">Verifikasi Email</th>
                                    <th className="py-3.5 px-4">Terdaftar</th>
                                    <th className="py-3.5 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-zinc-400">
                                            Tidak ada data pengguna yang sesuai dengan filter pencarian.
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user) => {
                                        const isSelf = user.id === currentAdminId;

                                        return (
                                            <tr
                                                key={user.id}
                                                className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                                            >
                                                <td className="py-3.5 px-4 font-mono font-bold text-red-600 dark:text-red-400">
                                                    #{user.id}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                                        <span>{user.name}</span>
                                                        {isSelf && (
                                                            <Badge variant="outline" className="text-[9px] py-0 px-1 text-red-600 border-red-300">
                                                                Anda
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                                                        <Mail className="size-3 text-zinc-400" />
                                                        <span>{user.email}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
                                                            {user.phone_number}
                                                        </span>
                                                        {user.phone_number && user.phone_number !== '-' && (
                                                            <a
                                                                href={`https://wa.me/${user.phone_number.replace(/^0/, '62')}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                                                                title="Chat via WhatsApp"
                                                            >
                                                                <MessageCircle className="size-3.5" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 max-w-xs text-zinc-600 dark:text-zinc-400 truncate">
                                                    <span title={user.address}>{user.address}</span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <Badge
                                                        variant={user.role === 'admin' ? 'destructive' : 'secondary'}
                                                        className="capitalize font-bold text-[10px]"
                                                    >
                                                        {user.role === 'admin' ? 'Administrator' : 'Member'}
                                                    </Badge>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="space-y-1">
                                                        <Badge
                                                            className={`text-[9px] font-extrabold px-2 py-0.5 border ${
                                                                user.tier === 'Diamond'
                                                                    ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700'
                                                                    : user.tier === 'Platinum'
                                                                      ? 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-700'
                                                                      : user.tier === 'Gold'
                                                                        ? 'bg-yellow-100 text-yellow-800 border-yellow-400 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-700'
                                                                        : user.tier === 'Silver'
                                                                          ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
                                                                          : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
                                                            }`}
                                                        >
                                                            {user.tier || 'Bronze'} Member
                                                        </Badge>
                                                        <div className="text-[10px] text-zinc-500 font-mono whitespace-nowrap">
                                                            <span>Saldo: <strong className="text-zinc-800 dark:text-zinc-200">{(user.points ?? 0).toLocaleString('id-ID')}</strong></span>
                                                            <span className="mx-1">•</span>
                                                            <span>Akumulasi: <strong className="text-amber-600 dark:text-amber-400">{(user.lifetime_points ?? 0).toLocaleString('id-ID')}</strong></span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {user.is_verified ? (
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
                                                    {user.created_at}
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => openEditModal(user)}
                                                            className="h-8 px-2 text-xs text-zinc-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer"
                                                            title="Edit Pengguna"
                                                        >
                                                            <Edit3 className="size-3.5 mr-1" />
                                                            Edit
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            disabled={isSelf}
                                                            onClick={() => setDeletingUser(user)}
                                                            className="h-8 px-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title={isSelf ? 'Tidak dapat menghapus akun sendiri' : 'Hapus Pengguna'}
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
                        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                            <span className="text-zinc-500">
                                Menampilkan halaman <strong>{users.current_page}</strong> dari <strong>{users.last_page}</strong> ({users.total} total)
                            </span>

                            <div className="flex items-center gap-1">
                                {users.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        preserveScroll
                                        className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                                            link.active
                                                ? 'bg-red-600 text-white font-bold'
                                                : link.url
                                                  ? 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                                                  : 'text-zinc-300 dark:text-zinc-600 pointer-events-none'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: TAMBAH PENGGUNA BARU */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent className="sm:max-w-lg rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                            <div className="size-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
                                <UserPlus className="size-4" />
                            </div>
                            Tambah Pengguna Baru
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Daftarkan akun member loyalitas atau administrator baru ke sistem Honda Rewards
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateUser} className="space-y-4 py-2 text-xs">
                        <div>
                            <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                Nama Lengkap
                            </label>
                            <Input
                                value={createForm.data.name}
                                onChange={(e) => createForm.setData('name', e.target.value)}
                                placeholder="Contoh: Budi Santoso"
                                required
                                className="text-xs h-9.5 rounded-xl"
                            />
                            {createForm.errors.name && (
                                <p className="text-red-600 text-[11px] mt-1">{createForm.errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                Alamat Email
                            </label>
                            <Input
                                type="email"
                                value={createForm.data.email}
                                onChange={(e) => createForm.setData('email', e.target.value)}
                                placeholder="budi@contoh.com"
                                required
                                className="text-xs h-9.5 rounded-xl"
                            />
                            {createForm.errors.email && (
                                <p className="text-red-600 text-[11px] mt-1">{createForm.errors.email}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                    Nomor Telepon / WhatsApp
                                </label>
                                <Input
                                    value={createForm.data.phone_number}
                                    onChange={(e) => createForm.setData('phone_number', e.target.value)}
                                    placeholder="081234567890"
                                    className="text-xs h-9.5 rounded-xl font-mono"
                                />
                            </div>

                            <div>
                                <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                    Role Pengguna
                                </label>
                                <select
                                    value={createForm.data.role}
                                    onChange={(e) => createForm.setData('role', e.target.value)}
                                    className="w-full h-9.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs focus:ring-2 focus:ring-red-500 outline-none"
                                >
                                    <option value="user">Member (User)</option>
                                    <option value="admin">Administrator (Admin)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                Alamat Lengkap
                            </label>
                            <Input
                                value={createForm.data.address}
                                onChange={(e) => createForm.setData('address', e.target.value)}
                                placeholder="Jl. Sudirman No. 45, Jakarta Pusat"
                                className="text-xs h-9.5 rounded-xl"
                            />
                        </div>

                        <div>
                            <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                Kata Sandi Awal
                            </label>
                            <PasswordInput
                                value={createForm.data.password}
                                onChange={(e) => createForm.setData('password', e.target.value)}
                                placeholder="Minimal 8 karakter"
                                required
                                className="text-xs h-9.5 rounded-xl"
                            />
                            {createForm.errors.password && (
                                <p className="text-red-600 text-[11px] mt-1">{createForm.errors.password}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="create_verified"
                                checked={createForm.data.is_verified}
                                onChange={(e) => createForm.setData('is_verified', e.target.checked)}
                                className="rounded border-zinc-300 text-red-600 focus:ring-red-500 size-4"
                            />
                            <label htmlFor="create_verified" className="text-zinc-700 dark:text-zinc-300 text-xs cursor-pointer select-none">
                                Tandai alamat email langsung berstatus <strong>Terverifikasi</strong>
                            </label>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateModalOpen(false)}
                                className="text-xs h-9.5 rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={createForm.processing}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9.5 px-5 rounded-xl"
                            >
                                {createForm.processing ? 'Menyimpan...' : 'Daftarkan Pengguna'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL: EDIT PENGGUNA */}
            <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
                <DialogContent className="sm:max-w-lg rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                            <div className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                                <Edit3 className="size-4" />
                            </div>
                            Edit Data Pengguna
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Perbarui informasi profil, hak akses role, kata sandi, atau verifikasi akun #{editingUser?.id}
                        </DialogDescription>
                    </DialogHeader>

                    {editingUser && (
                        <form onSubmit={handleUpdateUser} className="space-y-4 py-2 text-xs">
                            <div>
                                <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                    Nama Lengkap
                                </label>
                                <Input
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    required
                                    className="text-xs h-9.5 rounded-xl"
                                />
                                {editForm.errors.name && (
                                    <p className="text-red-600 text-[11px] mt-1">{editForm.errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                    Alamat Email
                                </label>
                                <Input
                                    type="email"
                                    value={editForm.data.email}
                                    onChange={(e) => editForm.setData('email', e.target.value)}
                                    required
                                    className="text-xs h-9.5 rounded-xl"
                                />
                                {editForm.errors.email && (
                                    <p className="text-red-600 text-[11px] mt-1">{editForm.errors.email}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                        Nomor Telepon / WhatsApp
                                    </label>
                                    <Input
                                        value={editForm.data.phone_number}
                                        onChange={(e) => editForm.setData('phone_number', e.target.value)}
                                        placeholder="081234567890"
                                        className="text-xs h-9.5 rounded-xl font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                        Role Akun
                                    </label>
                                    <select
                                        value={editForm.data.role}
                                        onChange={(e) => editForm.setData('role', e.target.value)}
                                        className="w-full h-9.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs focus:ring-2 focus:ring-red-500 outline-none"
                                    >
                                        <option value="user">Member (User)</option>
                                        <option value="admin">Administrator (Admin)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="font-bold block mb-1 text-zinc-800 dark:text-zinc-200">
                                    Alamat Lengkap
                                </label>
                                <Input
                                    value={editForm.data.address}
                                    onChange={(e) => editForm.setData('address', e.target.value)}
                                    className="text-xs h-9.5 rounded-xl"
                                />
                            </div>

                            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                                <label className="font-bold block text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                    <KeyRound className="size-3.5 text-zinc-500" />
                                    Ubah Kata Sandi (Opsional)
                                </label>
                                <PasswordInput
                                    value={editForm.data.password}
                                    onChange={(e) => editForm.setData('password', e.target.value)}
                                    placeholder="Biarkan kosong jika tidak ingin mengubah sandi"
                                    className="text-xs h-9 rounded-xl"
                                />
                                <span className="text-[10px] text-zinc-400 block">
                                    Minimal 8 karakter jika ingin mengatur ulang kata sandi pengguna.
                                </span>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="edit_verified"
                                    checked={editForm.data.is_verified}
                                    onChange={(e) => editForm.setData('is_verified', e.target.checked)}
                                    className="rounded border-zinc-300 text-red-600 focus:ring-red-500 size-4"
                                />
                                <label htmlFor="edit_verified" className="text-zinc-700 dark:text-zinc-300 text-xs cursor-pointer select-none">
                                    Status Email <strong>Terverifikasi</strong> (centang untuk memverifikasi)
                                </label>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingUser(null)}
                                    className="text-xs h-9.5 rounded-xl"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9.5 px-5 rounded-xl"
                                >
                                    {editForm.processing ? 'Menyimpan...' : 'Perbarui Data'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* MODAL: KONFIRMASI HAPUS PENGGUNA */}
            <Dialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
                <DialogContent className="sm:max-w-md rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600">
                            <AlertCircle className="size-5" />
                            Konfirmasi Hapus Pengguna
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Tindakan ini permanen dan tidak dapat dibatalkan
                        </DialogDescription>
                    </DialogHeader>

                    {deletingUser && (
                        <div className="py-2 text-xs text-zinc-600 dark:text-zinc-300 space-y-3">
                            <p>
                                Apakah Anda yakin ingin menghapus akun pengguna berikut dari database?
                            </p>
                            <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl space-y-1">
                                <div className="font-bold text-zinc-900 dark:text-white text-sm">
                                    {deletingUser.name}
                                </div>
                                <div className="text-[11px] text-zinc-500 font-mono">
                                    ID: #{deletingUser.id} &bull; {deletingUser.email}
                                </div>
                                <Badge variant={deletingUser.role === 'admin' ? 'destructive' : 'secondary'} className="text-[9px] uppercase font-bold mt-1">
                                    {deletingUser.role}
                                </Badge>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeletingUser(null)}
                            className="text-xs h-9 rounded-xl"
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteUser}
                            className="text-xs h-9 rounded-xl font-bold bg-rose-600 hover:bg-rose-700"
                        >
                            Ya, Hapus Pengguna Ini
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL: FILTER PENGGUNA */}
            <Dialog open={filterModalOpen} onOpenChange={setFilterModalOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                            <div className="size-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
                                <Filter className="size-4" />
                            </div>
                            Filter Data Pengguna
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Saring data pengguna berdasarkan tipe role akun dan status verifikasi email
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-2 text-xs">
                        {/* Pilihan Role */}
                        <div className="space-y-2">
                            <label className="font-bold text-zinc-800 dark:text-zinc-200 block">
                                Role Akun
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTempRole('all')}
                                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                                        tempRole === 'all'
                                            ? 'border-red-600 bg-red-50/70 dark:bg-red-950/50 text-red-600 font-bold shadow-xs'
                                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300'
                                    }`}
                                >
                                    Semua Role
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTempRole('user')}
                                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                                        tempRole === 'user'
                                            ? 'border-red-600 bg-red-50/70 dark:bg-red-950/50 text-red-600 font-bold shadow-xs'
                                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300'
                                    }`}
                                >
                                    Member
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTempRole('admin')}
                                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                                        tempRole === 'admin'
                                            ? 'border-red-600 bg-red-50/70 dark:bg-red-950/50 text-red-600 font-bold shadow-xs'
                                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300'
                                    }`}
                                >
                                    Admin
                                </button>
                            </div>
                        </div>

                        {/* Pilihan Status Verifikasi */}
                        <div className="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                            <label className="font-bold text-zinc-800 dark:text-zinc-200 block">
                                Status Verifikasi Email
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTempStatus('all')}
                                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                                        tempStatus === 'all'
                                            ? 'border-red-600 bg-red-50/70 dark:bg-red-950/50 text-red-600 font-bold shadow-xs'
                                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300'
                                    }`}
                                >
                                    Status: Semua
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTempStatus('verified')}
                                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                                        tempStatus === 'verified'
                                            ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-600 font-bold shadow-xs'
                                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300'
                                    }`}
                                >
                                    Terverifikasi
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTempStatus('unverified')}
                                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                                        tempStatus === 'unverified'
                                            ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/50 text-amber-600 font-bold shadow-xs'
                                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300'
                                    }`}
                                >
                                    Belum Verifikasi
                                </button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-3">
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
                                toast.success('Filter telah direset ke default.');
                            }}
                            className="text-xs h-9.5 rounded-xl"
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
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9.5 px-5 rounded-xl"
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
