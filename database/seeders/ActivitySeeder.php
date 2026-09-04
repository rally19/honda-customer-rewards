<?php

namespace Database\Seeders;

use App\Models\Activity;
use Illuminate\Database\Seeder;

class ActivitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $activities = [
            [
                'id' => '1029384751',
                'name' => 'Servis Berkala & Tune Up AHASS',
                'points' => 150,
                'description' => 'Servis rutin berkala motor Honda sesuai standar buku servis resmi AHASS.',
                'is_active' => true,
            ],
            [
                'id' => '1029384752',
                'name' => 'Ganti Oli Mesin Honda AHM MPX / SPX',
                'points' => 50,
                'description' => 'Penggantian oli resmi mesin Honda pelumas asli AHM Oil.',
                'is_active' => true,
            ],
            [
                'id' => '1029384753',
                'name' => 'Pembersihan Injektor & Ruang Bakar (Injector Cleaner)',
                'points' => 80,
                'description' => 'Treatment perawatan sistem injeksi PGM-FI dan throttle body.',
                'is_active' => true,
            ],
            [
                'id' => '1029384754',
                'name' => 'Pembelian Sparepart Asli Honda Genuine Parts (HGP)',
                'points' => 100,
                'description' => 'Pembelian suku cadang orisinil resmi motor Honda bergaransi.',
                'is_active' => true,
            ],
            [
                'id' => '1029384755',
                'name' => 'Penggantian Ban Tubeless / Kampas Rem Asli',
                'points' => 120,
                'description' => 'Penggantian ban motor tubeless standar pabrikan atau brake pad resmi.',
                'is_active' => true,
            ],
            [
                'id' => '1029384756',
                'name' => 'General Safety Check & Uji Emisi Kendaraan',
                'points' => 40,
                'description' => 'Pemeriksaan keselamatan 12 titik dan uji emisi berkala di bengkel AHASS.',
                'is_active' => true,
            ],
        ];

        foreach ($activities as $data) {
            Activity::updateOrCreate(['id' => $data['id']], $data);
        }
    }
}
