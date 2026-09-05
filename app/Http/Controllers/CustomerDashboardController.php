<?php

namespace App\Http\Controllers;

use App\Enums\MemberTier;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $tier = MemberTier::calculate((int) $user->lifetime_points);

        $realHistories = $user->activityHistories()
            ->with(['admin:id,name'])
            ->latest('created_at')
            ->take(3)
            ->get()
            ->map(fn ($h) => [
                'id' => (string) $h->id,
                'title' => $h->activity_name,
                'dealer' => $h->admin?->name ? 'AHASS (Petugas: '.$h->admin->name.')' : 'Bengkel AHASS Resmi',
                'points' => (int) $h->points,
                'type' => 'credit',
                'date' => $h->created_at?->format('d M Y, H:i') ?? '-',
            ])->toArray();

        $dummyFallbackTransactions = [
            [
                'id' => 'tx-welcome',
                'title' => 'Bonus Selamat Datang Member Honda',
                'dealer' => 'Sistem Honda Customer Rewards',
                'points' => 50,
                'type' => 'credit',
                'date' => $user->created_at?->format('d M Y, H:i') ?? 'Baru saja',
            ],
        ];

        $transactions = ! empty($realHistories) ? $realHistories : $dummyFallbackTransactions;

        $loyaltyData = [
            'memberId' => (string) $user->id,
            'tier' => $tier->value.' Member',
            'tierBadge' => strtoupper($tier->value),
            'tierLevel' => $tier->value,
            'nextTier' => $tier->nextTier() ? $tier->nextTier()->value.' Member' : 'Maksimal',
            'points' => (int) $user->points,
            'lifetimePoints' => (int) $user->lifetime_points,
            'pointsToNextTier' => $tier->pointsToNextTier((int) $user->lifetime_points),
            'tierProgress' => $tier->progress((int) $user->lifetime_points),
            'tierRoadmap' => MemberTier::roadmap((int) $user->lifetime_points),
            'vouchers' => [
                [
                    'id' => 'v1',
                    'title' => 'Gratis 1 Botol Oli Mesin AHM MPX',
                    'code' => 'HND-MPX-8491',
                    'category' => 'Oli & Servis',
                    'expiresAt' => '31 Des 2026',
                    'image' => '/images/pictures/oli_honda_img.jpg',
                    'status' => 'Tersedia',
                ],
                [
                    'id' => 'v2',
                    'title' => 'Diskon Biaya Jasa Servis 25%',
                    'code' => 'HND-SRV-2049',
                    'category' => 'Servis AHASS',
                    'expiresAt' => '15 Nov 2026',
                    'image' => '/images/pictures/voucher_service_img.jpg',
                    'status' => 'Tersedia',
                ],
                [
                    'id' => 'v3',
                    'title' => 'Potongan Aksesori Resmi Rp 50.000',
                    'code' => 'HND-ACC-5920',
                    'category' => 'Aksesori',
                    'expiresAt' => '20 Okt 2026',
                    'image' => '/images/pictures/potongan_pembelian_aksesori_img.jpg',
                    'status' => 'Tersedia',
                ],
            ],
            'transactions' => $transactions,
            'raffleTickets' => [
                ['number' => 'UND-84920-A', 'period' => 'Undian Spesial Hari Pelanggan 2026'],
                ['number' => 'UND-84921-B', 'period' => 'Undian Spesial Hari Pelanggan 2026'],
            ],
        ];

        return Inertia::render('customer/dashboard', [
            'loyalty' => $loyaltyData,
        ]);
    }
}
