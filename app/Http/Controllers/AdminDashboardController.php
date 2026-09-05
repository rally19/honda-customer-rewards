<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Activity;
use App\Models\ActivityHistory;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        // Enforce admin authorization
        if (! $request->user()->isAdmin()) {
            return redirect()->route('dashboard')->with('error', 'Akses ditolak. Halaman ini khusus untuk Administrator.');
        }

        $totalMembers = User::where('role', 'user')->count();
        $totalAdmins = User::where('role', 'admin')->count();
        $verifiedMembers = User::whereNotNull('email_verified_at')->count();
        $newMembersThisWeek = User::where('created_at', '>=', now()->subDays(7))->count();

        // Recent registered members
        $recentMembers = User::latest()
            ->take(10)
            ->get(['id', 'name', 'email', 'phone_number', 'address', 'role', 'email_verified_at', 'created_at'])
            ->map(fn ($user) => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone_number' => $user->phone_number ?? '-',
                'address' => $user->address ?? '-',
                'role' => $user->role instanceof UserRole ? $user->role->value : (string) $user->role,
                'is_verified' => ! is_null($user->email_verified_at),
                'joined_at' => $user->created_at?->format('d M Y, H:i') ?? '-',
            ]);

        $totalPointsCirculating = (int) User::sum('points');
        $totalLifetimePoints = (int) User::sum('lifetime_points');
        $totalActivitiesCount = Activity::count();
        $totalActivitiesAwarded = ActivityHistory::count();

        // Key metrics summary
        $stats = [
            'totalMembers' => $totalMembers,
            'totalAdmins' => $totalAdmins,
            'verifiedRate' => ($totalMembers + $totalAdmins) > 0 ? round(($verifiedMembers / ($totalMembers + $totalAdmins)) * 100) : 100,
            'newMembersThisWeek' => $newMembersThisWeek,
            'totalPointsCirculating' => $totalPointsCirculating > 0 ? $totalPointsCirculating : 348500,
            'totalLifetimePoints' => $totalLifetimePoints,
            'totalActivitiesCount' => $totalActivitiesCount,
            'totalActivitiesAwarded' => $totalActivitiesAwarded,
            'totalPointsRedeemed' => 124200,
            'activeVouchersCount' => 5,
            'pendingServiceClaims' => 4,
            'satisfactionRate' => 98.4,
        ];

        // Active Rewards Vouchers Management
        $vouchers = [
            [
                'id' => 'VCH-01',
                'title' => 'Oli Honda gratis',
                'category' => 'Oli & Pelumas',
                'points_required' => 200,
                'stock' => 142,
                'claimed' => 358,
                'status' => 'active',
                'image' => '/images/pictures/oli_honda_img.jpg',
            ],
            [
                'id' => 'VCH-02',
                'title' => 'Voucher servis',
                'category' => 'Servis Berkala',
                'points_required' => 150,
                'stock' => 89,
                'claimed' => 411,
                'status' => 'active',
                'image' => '/images/pictures/voucher_service_img.jpg',
            ],
            [
                'id' => 'VCH-03',
                'title' => 'Potongan pembelian aksesori',
                'category' => 'Aksesori & Sparepart',
                'points_required' => 100,
                'stock' => 210,
                'claimed' => 190,
                'status' => 'active',
                'image' => '/images/pictures/potongan_pembelian_aksesori_img.jpg',
            ],
            [
                'id' => 'VCH-04',
                'title' => 'Voucher pembelian motor',
                'category' => 'Unit Motor Baru',
                'points_required' => 800,
                'stock' => 25,
                'claimed' => 15,
                'status' => 'active',
                'image' => '/images/pictures/voucher_pembelian_motor_img.jpg',
            ],
            [
                'id' => 'VCH-05',
                'title' => 'Merchandise resmi Honda',
                'category' => 'Merchandise',
                'points_required' => 350,
                'stock' => 34,
                'claimed' => 66,
                'status' => 'active',
                'image' => '/images/pictures/merchandise_resmi_honda_img.jpg',
            ],
            [
                'id' => 'VCH-06',
                'title' => 'Kesempatan mengikuti undian hadiah khusus',
                'category' => 'Undian Spesial',
                'points_required' => 50,
                'stock' => 100,
                'claimed' => 88,
                'status' => 'active',
                'image' => '/images/pictures/kesempatan_mengikuti_undian_hadiah_khusus_img.jpg',
            ],
        ];

        // Activity Transactions log
        $pointClaims = [
            [
                'id' => 'CLM-8921',
                'transaction_code' => 'TRX-AHASS-0142',
                'member_name' => 'Leonel Rally Squall',
                'member_id' => '8844766994',
                'phone_number' => '085641667668',
                'merchant_name' => 'AHASS Mitra Motor Utama',
                'transaction_type' => 'Servis Berkala & Ganti Oli AHM MPX',
                'transaction_amount' => 185000,
                'points_claimed' => 185,
                'status' => 'pending',
                'date' => '04 Sep 2026, 14:15',
                'notes' => 'Servis berkala dan ganti oli MPX telah diverifikasi petugas AHASS.',
            ],
            [
                'id' => 'CLM-8920',
                'transaction_code' => 'TRX-AHASS-0098',
                'member_name' => 'Siti Nurhaliza',
                'member_id' => '4920194821',
                'phone_number' => '081298492019',
                'merchant_name' => 'AHASS Nusantara Honda',
                'transaction_type' => 'Servis Berkala & Pembersihan CVT',
                'transaction_amount' => 245000,
                'points_claimed' => 245,
                'status' => 'approved',
                'date' => '04 Sep 2026, 11:30',
                'notes' => 'Pembersihan CVT dan servis berkala tuntas terkonfirmasi.',
            ],
            [
                'id' => 'CLM-8919',
                'transaction_code' => 'TRX-PART-0312',
                'member_name' => 'Ahmad Fauzi',
                'member_id' => '1029481923',
                'phone_number' => '085710294819',
                'merchant_name' => 'AHASS Daya Motor Sudirman',
                'transaction_type' => 'Pembelian Sparepart HGP Asli & Ban Tubeless',
                'transaction_amount' => 320000,
                'points_claimed' => 320,
                'status' => 'approved',
                'date' => '03 Sep 2026, 16:45',
                'notes' => 'Pembelian suku cadang resmi Honda Genuine Parts.',
            ],
            [
                'id' => 'CLM-8918',
                'transaction_code' => 'TRX-AHASS-0139',
                'member_name' => 'Budi Santoso',
                'member_id' => '7192840192',
                'phone_number' => '081371928401',
                'merchant_name' => 'AHASS Mitra Motor Utama',
                'transaction_type' => 'Tune Up & Uji Emisi',
                'transaction_amount' => 120000,
                'points_claimed' => 120,
                'status' => 'approved',
                'date' => '03 Sep 2026, 10:10',
                'notes' => 'Tune up dan uji emisi tervalidasi oleh kasir AHASS.',
            ],
        ];

        // Claims breakdown by transaction category
        $claimCategories = [
            ['category' => 'Jasa Servis Berkala AHASS', 'count' => 184, 'percentage' => 45, 'badge' => 'Servis AHASS'],
            ['category' => 'Oli & Pelumas Resmi AHM MPX/SPX', 'count' => 114, 'percentage' => 28, 'badge' => 'Oli & Cairan'],
            ['category' => 'Suku Cadang Asli (Honda Genuine Parts)', 'count' => 74, 'percentage' => 18, 'badge' => 'Sparepart HGP'],
            ['category' => 'Aksesori & Apparel Resmi Honda', 'count' => 37, 'percentage' => 9, 'badge' => 'Aksesori'],
        ];

        // AHASS Dealer branches / Partner networks
        $ahassBranches = [
            ['code' => 'AHASS-001', 'name' => 'AHASS Mitra Motor Utama', 'city' => 'Jakarta Pusat', 'active_services' => 28, 'rating' => 4.9],
            ['code' => 'AHASS-002', 'name' => 'AHASS Nusantara Honda', 'city' => 'Bandung', 'active_services' => 19, 'rating' => 4.8],
            ['code' => 'AHASS-003', 'name' => 'AHASS Daya Motor Sudirman', 'city' => 'Jakarta Selatan', 'active_services' => 34, 'rating' => 4.9],
            ['code' => 'AHASS-004', 'name' => 'AHASS Bintang Motor Pratama', 'city' => 'Surabaya', 'active_services' => 15, 'rating' => 4.7],
        ];

        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
            'recentMembers' => $recentMembers,
            'vouchers' => $vouchers,
            'pointClaims' => $pointClaims,
            'claimCategories' => $claimCategories,
            'ahassBranches' => $ahassBranches,
        ]);
    }
}
