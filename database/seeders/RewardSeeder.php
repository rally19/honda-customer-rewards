<?php

namespace Database\Seeders;

use App\Models\Reward;
use Illuminate\Database\Seeder;

class RewardSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rewards = [
            [
                'id' => '2039485701',
                'name' => 'Jaket Touring Eksklusif Honda Riding Gear',
                'description' => 'Jaket touring windproof resmi Honda dengan protector siku dan bahu standar keselamatan berkendara.',
                'image_url' => '/images/pictures/merchandise_resmi_honda_img.jpg',
                'points_cost' => 450,
                'stock' => 25,
                'start_period' => now()->subDays(5)->toDateString(),
                'end_period' => now()->addMonths(3)->toDateString(),
                'is_active' => true,
            ],
            [
                'id' => '2039485702',
                'name' => 'Paket Pelumas AHM Oil MPX 1 Liter & Treatment',
                'description' => 'Pelumas resmi mesin motor matic / bebek Honda dengan formulasi Engine Protection Technology.',
                'image_url' => '/images/pictures/oli_honda_img.jpg',
                'points_cost' => 150,
                'stock' => 50,
                'start_period' => now()->subDays(5)->toDateString(),
                'end_period' => now()->addMonths(6)->toDateString(),
                'is_active' => true,
            ],
            [
                'id' => '2039485703',
                'name' => 'Voucher Diskon Aksesori Resmi Honda Rp 50.000',
                'description' => 'Potongan harga langsung untuk pembelian Honda Genuine Accessories (HGA) di seluruh dealer resmi.',
                'image_url' => '/images/pictures/potongan_pembelian_aksesori_img.jpg',
                'points_cost' => 100,
                'stock' => 40,
                'start_period' => now()->subDays(5)->toDateString(),
                'end_period' => now()->addMonths(2)->toDateString(),
                'is_active' => true,
            ],
            [
                'id' => '2039485704',
                'name' => 'Voucher Servis Lengkap Gratis AHASS',
                'description' => 'Voucher gratis biaya jasa servis berkala paket lengkap di seluruh bengkel resmi AHASS terdaftar.',
                'image_url' => '/images/pictures/voucher_service_img.jpg',
                'points_cost' => 200,
                'stock' => 30,
                'start_period' => now()->subDays(5)->toDateString(),
                'end_period' => now()->addMonths(3)->toDateString(),
                'is_active' => true,
            ],
            [
                'id' => '2039485705',
                'name' => 'Voucher Potongan DP Motor Honda Rp 500.000',
                'description' => 'Potongan tambahan uang muka kredit pembelian unit baru sepeda motor Honda di dealer resmi.',
                'image_url' => '/images/pictures/voucher_pembelian_motor_img.jpg',
                'points_cost' => 1000,
                'stock' => 10,
                'start_period' => now()->subDays(5)->toDateString(),
                'end_period' => now()->addMonths(4)->toDateString(),
                'is_active' => true,
            ],
            [
                'id' => '2039485706',
                'name' => 'Tiket Undian Grand Prize Eksklusif Honda',
                'description' => 'Kupon partisipasi undian reward akhir tahun dengan hadiah utama 1 unit motor Honda EM1 e: listrik.',
                'image_url' => '/images/pictures/kesempatan_mengikuti_undian_hadiah_khusus_img.jpg',
                'points_cost' => 50,
                'stock' => 100,
                'start_period' => now()->subDays(5)->toDateString(),
                'end_period' => now()->addMonths(1)->toDateString(),
                'is_active' => true,
            ],
        ];

        foreach ($rewards as $data) {
            Reward::updateOrCreate(['id' => $data['id']], $data);
        }
    }
}
