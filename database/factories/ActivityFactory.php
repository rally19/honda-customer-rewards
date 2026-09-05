<?php

namespace Database\Factories;

use App\Models\Activity;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Activity>
 */
class ActivityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $activities = [
            [
                'name' => 'Servis berkala di AHASS',
                'points' => 150,
                'description' => 'Servis berkala rutin motor Honda sesuai standar AHASS dengan teknisi bersertifikasi.',
            ],
            [
                'name' => 'Pembelian suku cadang atau aksesori Honda',
                'points' => 100,
                'description' => 'Pembelian suku cadang asli Honda Genuine Parts (HGP) atau Honda Genuine Accessories (HGA).',
            ],
            [
                'name' => 'Pembelian motor Honda',
                'points' => 500,
                'description' => 'Pembelian unit baru sepeda motor Honda di dealer resmi berhak mendapatkan poin loyalty.',
            ],
            [
                'name' => 'Mengikuti event dealer',
                'points' => 75,
                'description' => 'Kehadiran dan partisipasi aktif dalam kegiatan gathering, pameran, atau showroom event dealer Honda.',
            ],
            [
                'name' => 'Mengikuti test ride',
                'points' => 50,
                'description' => 'Mencoba sensasi berkendara lini motor terbaru Honda dalam program test ride resmi dealer.',
            ],
            [
                'name' => 'Mengajak teman atau keluarga membeli motor Honda (program referral)',
                'points' => 300,
                'description' => 'Mengajak teman atau kerabat melakukan pembelian sepeda motor Honda melalui program referral.',
            ],
            [
                'name' => 'Memberikan ulasan atau penilaian layanan dealer saat servis atau pembelian motor',
                'points' => 40,
                'description' => 'Memberikan ulasan atau penilaian kepuasan layanan dealer/AHASS saat servis atau pembelian motor.',
            ],
        ];

        $chosen = fake()->randomElement($activities);

        return [
            'name' => $chosen['name'],
            'points' => $chosen['points'],
            'description' => $chosen['description'],
            'is_active' => true,
        ];
    }
}
