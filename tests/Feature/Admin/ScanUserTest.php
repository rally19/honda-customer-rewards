<?php

use App\Enums\MemberTier;
use App\Enums\UserRole;
use App\Models\PointExchange;
use App\Models\Reward;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('non-admin user cannot access admin scan-user or lookup endpoint', function () {
    $user = User::factory()->create([
        'role' => UserRole::User->value,
    ]);

    $this->actingAs($user)
        ->get(route('admin.scan-user.index'))
        ->assertRedirect(route('dashboard'));

    $this->actingAs($user)
        ->postJson(route('admin.scan-user.lookup'), [
            'identifier' => '8844766994',
        ])
        ->assertForbidden();
});

test('admin can view scan-user page with stats and recent claims', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $member = User::factory()->create([
        'role' => UserRole::User->value,
    ]);

    $reward = Reward::create([
        'name' => 'Voucher Servis AHASS',
        'points_cost' => 150,
        'stock' => 10,
        'is_active' => true,
    ]);

    PointExchange::create([
        'reward_id' => $reward->id,
        'reward_name' => $reward->name,
        'points_cost' => $reward->points_cost,
        'user_id' => $member->id,
        'user_name' => $member->name,
        'user_email' => $member->email,
        'status' => 'hold',
    ]);

    $response = $this
        ->actingAs($admin)
        ->get(route('admin.scan-user.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/scan-user/index')
        ->has('recentClaims')
        ->has('stats')
        ->where('stats.holdClaims', 1)
    );
});

test('admin can pre-load member and claims via user_id query parameter', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $member = User::factory()->create([
        'name' => 'Budi Santoso',
        'email' => 'budi.santoso@example.com',
        'role' => UserRole::User->value,
        'points' => 350,
        'lifetime_points' => 350,
        'tier' => MemberTier::Bronze,
    ]);

    $reward = Reward::create([
        'name' => 'Oli Honda Gratis',
        'points_cost' => 200,
        'stock' => 5,
        'is_active' => true,
    ]);

    PointExchange::create([
        'reward_id' => $reward->id,
        'reward_name' => $reward->name,
        'points_cost' => $reward->points_cost,
        'user_id' => $member->id,
        'user_name' => $member->name,
        'user_email' => $member->email,
        'status' => 'hold',
    ]);

    $response = $this
        ->actingAs($admin)
        ->get(route('admin.scan-user.index', ['user_id' => $member->id]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/scan-user/index')
        ->where('initialMember.name', 'Budi Santoso')
        ->where('initialMember.id', (string) $member->id)
        ->has('initialClaims', 1)
        ->has('initialMemberStats')
        ->where('initialMemberStats.holdClaims', 1)
    );
});

test('admin can lookup member by raw 10-digit ID and QR prefix format', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $member = User::factory()->create([
        'name' => 'Citra Lestari',
        'email' => 'citra.lestari@example.com',
        'role' => UserRole::User->value,
        'points' => 500,
        'lifetime_points' => 500,
        'tier' => MemberTier::Silver,
    ]);

    // Lookup with raw ID
    $response1 = $this
        ->actingAs($admin)
        ->postJson(route('admin.scan-user.lookup'), [
            'identifier' => (string) $member->id,
        ]);

    $response1->assertOk()
        ->assertJson([
            'found' => true,
            'member' => [
                'id' => (string) $member->id,
                'name' => 'Citra Lestari',
                'email' => 'citra.lestari@example.com',
                'tier' => 'Silver',
            ],
        ]);

    // Lookup with QR prefix HND-MEMBER-
    $response2 = $this
        ->actingAs($admin)
        ->postJson(route('admin.scan-user.lookup'), [
            'identifier' => 'HND-MEMBER-'.$member->id,
        ]);

    $response2->assertOk()
        ->assertJson([
            'found' => true,
            'member' => [
                'id' => (string) $member->id,
                'name' => 'Citra Lestari',
            ],
        ]);
});

test('admin can lookup member by email or phone number', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $member = User::factory()->create([
        'name' => 'Doni Firmansyah',
        'email' => 'doni.firmansyah@example.com',
        'phone_number' => '081234567890',
        'role' => UserRole::User->value,
    ]);

    // Lookup by email
    $resEmail = $this
        ->actingAs($admin)
        ->postJson(route('admin.scan-user.lookup'), [
            'identifier' => 'doni.firmansyah@example.com',
        ]);

    $resEmail->assertOk()
        ->assertJsonPath('member.name', 'Doni Firmansyah');

    // Lookup by phone number
    $resPhone = $this
        ->actingAs($admin)
        ->postJson(route('admin.scan-user.lookup'), [
            'identifier' => '081234567890',
        ]);

    $resPhone->assertOk()
        ->assertJsonPath('member.name', 'Doni Firmansyah');
});

test('lookup non-existent member returns 404', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $response = $this
        ->actingAs($admin)
        ->postJson(route('admin.scan-user.lookup'), [
            'identifier' => '9999999999',
        ]);

    $response->assertNotFound()
        ->assertJson([
            'found' => false,
        ]);
});

test('lookup member returns specific reward claims and personal statistics', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $member = User::factory()->create([
        'role' => UserRole::User->value,
        'points' => 1000,
        'lifetime_points' => 1000,
    ]);

    $reward1 = Reward::create([
        'name' => 'Voucher Servis AHASS 50rb',
        'points_cost' => 150,
        'stock' => 10,
        'is_active' => true,
    ]);

    $reward2 = Reward::create([
        'name' => 'Oli Honda MPX Gratis',
        'points_cost' => 200,
        'stock' => 5,
        'is_active' => true,
    ]);

    // 1 Claimed, 1 Hold
    PointExchange::create([
        'reward_id' => $reward1->id,
        'reward_name' => $reward1->name,
        'points_cost' => $reward1->points_cost,
        'user_id' => $member->id,
        'user_name' => $member->name,
        'user_email' => $member->email,
        'status' => 'claimed',
        'admin_id' => $admin->id,
    ]);

    PointExchange::create([
        'reward_id' => $reward2->id,
        'reward_name' => $reward2->name,
        'points_cost' => $reward2->points_cost,
        'user_id' => $member->id,
        'user_name' => $member->name,
        'user_email' => $member->email,
        'status' => 'hold',
    ]);

    $response = $this
        ->actingAs($admin)
        ->postJson(route('admin.scan-user.lookup'), [
            'identifier' => (string) $member->id,
        ]);

    $response->assertOk()
        ->assertJsonCount(2, 'claims')
        ->assertJsonPath('stats.totalClaims', 2)
        ->assertJsonPath('stats.holdClaims', 1)
        ->assertJsonPath('stats.claimedCount', 1)
        ->assertJsonPath('stats.totalPointsSpent', 150);
});
