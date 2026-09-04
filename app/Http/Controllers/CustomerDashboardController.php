<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        // Dummy / template data untuk dashboard pelanggan
        $loyaltyData = [
            'memberId' => (string) $user->id,
            'tier' => 'Red Member',
            'tierBadge' => 'RED',
            'nextTier' => 'Gold Member',
            'points' => 1250,
            'pointsToNextTier' => 750,
            'tierProgress' => 62, // persentase
            'claims' => [
                [
                    'id' => 'CLM-8921',
                    'receipt_number' => 'INV/AHASS-001/0142',
                    'merchant' => 'AHASS Mitra Motor Utama',
                    'category' => 'Servis & Oli Mesin',
                    'amount' => 185000,
                    'points' => 185,
                    'status' => 'pending',
                    'date' => '04 Sep 2026',
                ],
                [
                    'id' => 'CLM-8812',
                    'receipt_number' => 'STR-ANPER-8821',
                    'merchant' => 'Dealer Honda Anper',
                    'category' => 'Beli Sparepart & Aksesori',
                    'amount' => 120000,
                    'points' => 120,
                    'status' => 'approved',
                    'date' => '28 Agu 2026',
                ],
            ],
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
            'transactions' => [
                [
                    'id' => 'tx1',
                    'title' => 'Servis Berkala & Tune Up AHASS',
                    'dealer' => 'AHASS Mitra Motor Utama',
                    'points' => 150,
                    'type' => 'credit',
                    'date' => '02 Sep 2026',
                ],
                [
                    'id' => 'tx2',
                    'title' => 'Beli Ban Tubeless & Oli SPX2',
                    'dealer' => 'Dealer Honda Anper',
                    'points' => 60,
                    'type' => 'credit',
                    'date' => '28 Agu 2026',
                ],
                [
                    'id' => 'tx3',
                    'title' => 'Penukaran Voucher Diskon Servis AHASS',
                    'dealer' => 'Aplikasi Customer Rewards',
                    'points' => -150,
                    'type' => 'debit',
                    'date' => '14 Agu 2026',
                ],
                [
                    'id' => 'tx4',
                    'title' => 'Bonus Selamat Datang Member Baru',
                    'dealer' => 'Sistem Reward Digital',
                    'points' => 50,
                    'type' => 'credit',
                    'date' => '01 Agu 2026',
                ],
            ],
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
