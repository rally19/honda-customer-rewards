<?php

use App\Enums\MemberTier;
use App\Enums\UserRole;
use App\Models\Activity;
use App\Models\ActivityHistory;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page when accessing history', function () {
    $response = $this->get(route('customer.history'));
    $response->assertRedirect(route('login'));
});

test('authenticated customer can visit history page with their activity histories and stats', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $user = User::factory()->create([
        'role' => UserRole::User->value,
        'points' => 350,
        'lifetime_points' => 550,
        'tier' => MemberTier::Silver,
    ]);

    $activity = Activity::create([
        'name' => 'Servis Tune Up AHASS Berkala',
        'points' => 150,
        'description' => 'Servis berkala resmi',
        'is_active' => true,
    ]);

    ActivityHistory::create([
        'activity_id' => $activity->id,
        'activity_name' => $activity->name,
        'points' => 150,
        'user_id' => $user->id,
        'user_name' => $user->name,
        'user_email' => $user->email,
        'admin_id' => $admin->id,
        'notes' => 'Servis 10.000 KM',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('customer.history'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('customer/history')
        ->has('histories.data', 1)
        ->where('histories.data.0.title', 'Servis Tune Up AHASS Berkala')
        ->where('histories.data.0.points', 150)
        ->where('stats.currentPoints', 350)
        ->where('stats.totalActivities', 1)
        ->where('stats.tierBadge', 'SILVER')
        ->has('filters')
        ->where('memberId', (string) $user->id)
    );
});

test('customer history search filter works correctly', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $user = User::factory()->create([
        'role' => UserRole::User->value,
    ]);

    ActivityHistory::create([
        'activity_name' => 'Ganti Oli Mesin AHM MPX',
        'points' => 50,
        'user_id' => $user->id,
        'user_name' => $user->name,
        'user_email' => $user->email,
        'admin_id' => $admin->id,
    ]);

    ActivityHistory::create([
        'activity_name' => 'Beli Busi Honda Racing',
        'points' => 25,
        'user_id' => $user->id,
        'user_name' => $user->name,
        'user_email' => $user->email,
        'admin_id' => $admin->id,
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('customer.history', ['search' => 'Oli Mesin']));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('customer/history')
        ->has('histories.data', 1)
        ->where('histories.data.0.title', 'Ganti Oli Mesin AHM MPX')
    );
});

test('customer only sees their own activity histories and not other users', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $user1 = User::factory()->create(['role' => UserRole::User->value]);
    $user2 = User::factory()->create(['role' => UserRole::User->value]);

    ActivityHistory::create([
        'activity_name' => 'Servis Motor User 1',
        'points' => 100,
        'user_id' => $user1->id,
        'user_name' => $user1->name,
        'user_email' => $user1->email,
        'admin_id' => $admin->id,
    ]);

    ActivityHistory::create([
        'activity_name' => 'Servis Motor User 2',
        'points' => 200,
        'user_id' => $user2->id,
        'user_name' => $user2->name,
        'user_email' => $user2->email,
        'admin_id' => $admin->id,
    ]);

    $response = $this
        ->actingAs($user1)
        ->get(route('customer.history'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('customer/history')
        ->has('histories.data', 1)
        ->where('histories.data.0.title', 'Servis Motor User 1')
    );
});

test('customer can access activities page and see list of earning activities', function () {
    $user = User::factory()->create(['role' => UserRole::User->value]);

    Activity::create([
        'name' => 'Ganti Oli AHM MPX',
        'points' => 50,
        'description' => 'Penggantian oli resmi',
        'is_active' => true,
    ]);

    Activity::create([
        'name' => 'Servis Lengkap AHASS',
        'points' => 150,
        'description' => 'Servis berkala resmi',
        'is_active' => true,
    ]);

    Activity::create([
        'name' => 'Aktivitas Nonaktif',
        'points' => 10,
        'description' => 'Tidak aktif',
        'is_active' => false,
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('customer.activities'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('customer/history')
        ->has('earningActivities')
        ->where('earningActivities.0.points', 150)
        ->where('earningActivities.0.name', 'Servis Lengkap AHASS')
    );
});
