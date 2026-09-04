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
        ->has('loyalty.transactions'),
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
