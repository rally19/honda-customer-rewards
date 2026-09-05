<?php

use App\Models\ActivityHistory;
use App\Models\PointExchange;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated customer can visit the dashboard', function () {
    $user = User::factory()->create([
        'role' => 'user',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('customer/dashboard')
        ->has('loyalty')
        ->where('loyalty.memberId', (string) $user->id)
        ->has('loyalty.vouchers')
        ->has('loyalty.transactions')
        ->has('loyalty.tierRoadmap', 5),
    );
});

test('customer tier is determined by accumulated lifetime points not active points', function () {
    $user = User::factory()->create([
        'role' => 'user',
        'points' => 100, // Active balance low due to rewards redeemed
        'lifetime_points' => 1600, // Lifetime accumulation qualifies for Gold (1500+)
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('customer/dashboard')
        ->where('loyalty.tier', 'Gold Member')
        ->where('loyalty.tierLevel', 'Gold')
        ->where('loyalty.points', 100)
        ->where('loyalty.lifetimePoints', 1600)
        ->where('loyalty.pointsToNextTier', 1900) // 3500 - 1600 = 1900 to Platinum
        ->where('loyalty.nextTier', 'Platinum Member')
        ->has('loyalty.tierRoadmap', 5),
    );
});

test('diamond tier member progression shows maximum tier reached', function () {
    $user = User::factory()->create([
        'role' => 'user',
        'points' => 8000,
        'lifetime_points' => 8000,
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('customer/dashboard')
        ->where('loyalty.tier', 'Diamond Member')
        ->where('loyalty.tierLevel', 'Diamond')
        ->where('loyalty.nextTier', 'Maksimal')
        ->where('loyalty.pointsToNextTier', 0)
        ->where('loyalty.tierProgress', 100),
    );
});

test('admin can visit admin dashboard', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this
        ->actingAs($admin)
        ->get(route('admin.dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/dashboard'),
    );
});

test('non-admin user is redirected away from admin dashboard', function () {
    $user = User::factory()->create([
        'role' => 'user',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('admin.dashboard'));

    $response->assertRedirect(route('dashboard'));
});

test('new user receives default welcome notification on topbar', function () {
    $user = User::factory()->create([
        'role' => 'user',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('customer/dashboard')
        ->has('notifications', 1)
        ->where('notifications.0.type', 'welcome')
        ->where('notifications.0.title', '🎉 Selamat Datang di Rewards!')
        ->where('notifications.0.description', 'ID MEMBER Anda telah aktif. Tunjukkan ID saat servis di AHASS atau kepada staff untuk kumpulkan poin.')
    );
});

test('user with 1 to 4 activities or rewards retains welcome notification', function () {
    $user = User::factory()->create([
        'role' => 'user',
    ]);

    ActivityHistory::create([
        'id' => '1000000001',
        'activity_name' => 'Ganti Oli Mesin',
        'points' => 100,
        'user_id' => $user->id,
        'user_name' => $user->name,
        'user_email' => $user->email,
    ]);

    PointExchange::create([
        'id' => '2000000001',
        'reward_name' => 'Voucher Diskon Servis',
        'points_cost' => 50,
        'user_id' => $user->id,
        'user_name' => $user->name,
        'user_email' => $user->email,
        'status' => 'hold',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('customer/dashboard')
        ->has('notifications', 3) // 2 events + 1 welcome
        ->where('notifications.2.type', 'welcome')
        ->where('notifications.2.title', '🎉 Selamat Datang di Rewards!')
    );
});

test('user with 5 or more events receives only the 5 latest events', function () {
    $user = User::factory()->create([
        'role' => 'user',
    ]);

    for ($i = 1; $i <= 6; $i++) {
        ActivityHistory::create([
            'id' => (string) (1000000010 + $i),
            'activity_name' => "Aktivitas Ke-{$i}",
            'points' => 50 * $i,
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_email' => $user->email,
            'created_at' => now()->addMinutes($i),
        ]);
    }

    $response = $this
        ->actingAs($user)
        ->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('customer/dashboard')
        ->has('notifications', 5)
        ->where('notifications.0.type', 'activity')
        ->where('notifications.4.type', 'activity')
    );
});
