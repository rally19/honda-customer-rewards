<?php

namespace Database\Factories;

use App\Models\Reward;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Reward>
 */
class RewardFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $rewards = [
            [
                'name' => 'Voucher servis',
                'description' => 'Voucher gratis atau potongan biaya jasa servis berkala paket lengkap di seluruh bengkel resmi AHASS.',
                'image_url' => '/images/pictures/voucher_service_img.jpg',
                'points_cost' => 150,
                'stock' => 30,
            ],
            [
                'name' => 'Oli Honda gratis',
                'description' => 'Gratis 1 botol pelumas resmi mesin motor Honda AHM Oil MPX / SPX berstandar pabrikan.',
                'image_url' => '/images/pictures/oli_honda_img.jpg',
                'points_cost' => 200,
                'stock' => 50,
            ],
            [
                'name' => 'Potongan pembelian aksesori',
                'description' => 'Potongan harga langsung untuk pembelian Honda Genuine Accessories (HGA) resmi di seluruh dealer.',
                'image_url' => '/images/pictures/potongan_pembelian_aksesori_img.jpg',
                'points_cost' => 100,
                'stock' => 40,
            ],
            [
                'name' => 'Merchandise resmi Honda',
                'description' => 'Apparel dan merchandise eksklusif resmi Honda seperti jaket riding touring, t-shirt, dan aksesori gaya berkendara.',
                'image_url' => '/images/pictures/merchandise_resmi_honda_img.jpg',
                'points_cost' => 350,
                'stock' => 25,
            ],
            [
                'name' => 'Voucher pembelian motor',
                'description' => 'Voucher potongan tambahan uang muka (DP) atau cashback pembelian unit baru sepeda motor Honda di dealer resmi.',
                'image_url' => '/images/pictures/voucher_pembelian_motor_img.jpg',
                'points_cost' => 800,
                'stock' => 10,
            ],
            [
                'name' => 'Kesempatan mengikuti undian hadiah khusus',
                'description' => 'Kupon partisipasi undian reward akhir tahun dengan kesempatan memenangkan hadiah grand prize khusus Honda.',
                'image_url' => '/images/pictures/kesempatan_mengikuti_undian_hadiah_khusus_img.jpg',
                'points_cost' => 50,
                'stock' => 100,
            ],
        ];

        $chosen = fake()->randomElement($rewards);

        return [
            'name' => $chosen['name'],
            'description' => $chosen['description'],
            'image_url' => $chosen['image_url'],
            'points_cost' => $chosen['points_cost'],
            'stock' => $chosen['stock'],
            'start_period' => now()->subDays(5)->toDateString(),
            'end_period' => now()->addMonths(6)->toDateString(),
            'is_active' => true,
        ];
    }
}
