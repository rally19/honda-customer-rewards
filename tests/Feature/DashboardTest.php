<?php

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
