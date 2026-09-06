<?php

use App\Models\Activity;
use App\Models\ActivityHistory;
use App\Models\PointExchange;
use App\Models\Reward;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('regular user cannot access admin dashboard', function () {
    $user = User::factory()->create(['role' => 'user']);

    $response = $this
        ->actingAs($user)
        ->get(route('admin.dashboard'));

    $response->assertRedirect(route('dashboard'));
});

test('admin can visit admin dashboard and receives real database data', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $member = User::factory()->create(['role' => 'user', 'points' => 200, 'lifetime_points' => 500]);

    $activity = Activity::create([
        'id' => '1029384752',
        'name' => 'Servis Berkala AHASS',
        'points' => 100,
        'description' => 'Servis berkala rutin',
        'is_active' => true,
    ]);

    ActivityHistory::create([
        'id' => '3019283741',
        'activity_id' => $activity->id,
        'activity_name' => $activity->name,
        'points' => 100,
        'user_id' => $member->id,
        'user_name' => $member->name,
        'user_email' => $member->email,
        'admin_id' => $admin->id,
    ]);

    $reward = Reward::create([
        'id' => '2039485712',
        'name' => 'Voucher Oli SPX',
        'description' => 'Diskon oli resmi',
        'points_cost' => 150,
        'stock' => 10,
        'is_active' => true,
    ]);

    PointExchange::create([
        'id' => '4019283742',
        'reward_id' => $reward->id,
        'reward_name' => $reward->name,
        'points_cost' => 150,
        'user_id' => $member->id,
        'user_name' => $member->name,
        'user_email' => $member->email,
        'status' => 'hold',
    ]);

    $response = $this
        ->actingAs($admin)
        ->get(route('admin.dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/dashboard')
        ->has('stats')
        ->where('stats.totalMembers', 1)
        ->where('stats.totalAdmins', 1)
        ->where('stats.pendingHoldClaims', 1)
        ->where('stats.totalScansAwarded', 1)
        ->has('recentMembers', 2)
        ->has('recentClaims', 1)
        ->has('recentScans', 1)
        ->has('rewards', 1)
        ->has('topActivities', 1)
        ->where('topActivities.0.name', 'Servis Berkala AHASS')
    );
});
