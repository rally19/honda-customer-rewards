<?php

use App\Enums\MemberTier;
use App\Enums\UserRole;
use App\Models\Activity;
use App\Models\ActivityHistory;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('non-admin user cannot access admin scan or activities', function () {
    $user = User::factory()->create([
        'role' => UserRole::User->value,
    ]);

    $this->actingAs($user)
        ->get(route('admin.scan.index'))
        ->assertRedirect(route('dashboard'));

    $this->actingAs($user)
        ->get(route('admin.activities.index'))
        ->assertRedirect(route('dashboard'));
});

test('admin can view scan page with active activities', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $activity = Activity::create([
        'name' => 'Servis Tune Up AHASS',
        'points' => 150,
        'description' => 'Servis berkala resmi',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($admin)
        ->get(route('admin.scan.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/scan/index')
        ->has('activities')
        ->has('recentScans')
    );
});

test('admin can lookup member by 10-digit ID and QR format', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $member = User::factory()->create([
        'name' => 'Budi Santoso',
        'email' => 'budi.santoso@example.com',
        'points' => 100,
        'lifetime_points' => 100,
        'tier' => MemberTier::Bronze,
    ]);

    // Test lookup by exact ID
    $res1 = $this
        ->actingAs($admin)
        ->postJson(route('admin.scan.lookup'), [
            'identifier' => (string) $member->id,
        ]);

    $res1->assertOk()
        ->assertJson([
            'found' => true,
            'member' => [
                'id' => (string) $member->id,
                'name' => 'Budi Santoso',
                'points' => 100,
                'tier' => 'Bronze',
            ],
        ]);

    // Test lookup by QR format with prefix HND-MEMBER-
    $res2 = $this
        ->actingAs($admin)
        ->postJson(route('admin.scan.lookup'), [
            'identifier' => "HND-MEMBER-{$member->id}",
        ]);

    $res2->assertOk()
        ->assertJson([
            'found' => true,
            'member' => [
                'id' => (string) $member->id,
                'name' => 'Budi Santoso',
            ],
        ]);
});

test('admin can award points to member and history is created with 10-digit ID', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $member = User::factory()->create([
        'name' => 'Ahmad Pelanggan',
        'points' => 50,
        'lifetime_points' => 50,
        'tier' => MemberTier::Bronze,
    ]);

    $activity = Activity::create([
        'name' => 'Ganti Oli Mesin MPX',
        'points' => 50,
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($admin)
        ->post(route('admin.scan.store'), [
            'user_id' => $member->id,
            'activity_id' => $activity->id,
            'points' => 50,
            'notes' => 'Struk AHASS-001',
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $member->refresh();
    expect($member->points)->toBe(100)
        ->and($member->lifetime_points)->toBe(100);

    // Verify ActivityHistory recorded
    $history = ActivityHistory::where('user_id', $member->id)->first();
    expect($history)->not->toBeNull()
        ->and(strlen((string) $history->id))->toBe(10)
        ->and($history->activity_name)->toBe('Ganti Oli Mesin MPX')
        ->and($history->points)->toBe(50)
        ->and($history->user_name)->toBe('Ahmad Pelanggan')
        ->and($history->admin_id)->toBe($admin->id);
});

test('member tier upgrades automatically when lifetime points pass threshold', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $member = User::factory()->create([
        'name' => 'Siti Nurhaliza',
        'points' => 450,
        'lifetime_points' => 450,
        'tier' => MemberTier::Bronze,
    ]);

    $activity = Activity::create([
        'name' => 'Servis Besar AHASS',
        'points' => 100,
        'is_active' => true,
    ]);

    // Adding 100 points will bring lifetime points to 550 (Silver threshold is 500)
    $this->actingAs($admin)
        ->post(route('admin.scan.store'), [
            'user_id' => $member->id,
            'activity_id' => $activity->id,
            'points' => 100,
        ]);

    $member->refresh();
    expect($member->points)->toBe(550)
        ->and($member->lifetime_points)->toBe(550)
        ->and($member->tier)->toBe(MemberTier::Silver);
});

test('admin can create new activity with auto-generated 10-digit ID', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $response = $this
        ->actingAs($admin)
        ->post(route('admin.activities.store'), [
            'name' => 'Uji Emisi Gas Buang',
            'points' => 75,
            'description' => 'Uji emisi resmi Honda AHASS',
            'is_active' => true,
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $activity = Activity::where('name', 'Uji Emisi Gas Buang')->first();
    expect($activity)->not->toBeNull()
        ->and(strlen($activity->id))->toBe(10)
        ->and($activity->points)->toBe(75)
        ->and($activity->is_active)->toBeTrue();
});

test('admin can view activities and history lists', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $activity = Activity::create([
        'name' => 'Tune Up Rutin',
        'points' => 120,
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($admin)
        ->get(route('admin.activities.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/activities/index')
        ->has('activities')
        ->has('histories.data')
        ->has('stats')
    );
});
