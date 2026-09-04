<?php

use App\Enums\UserRole;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('non-admin user cannot access admin users list', function () {
    $user = User::factory()->create([
        'role' => UserRole::User->value,
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('admin.users.index'));

    $response->assertRedirect(route('dashboard'));
});

test('admin can view users list', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    User::factory()->count(3)->create();

    $response = $this
        ->actingAs($admin)
        ->get(route('admin.users.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/users/index')
        ->has('users.data')
        ->has('stats')
        ->has('filters')
    );
});

test('admin can create a new user', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $response = $this
        ->actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'John Doe',
            'email' => 'john.doe@example.com',
            'phone_number' => '081234567890',
            'address' => 'Jl. Merdeka No. 10',
            'role' => 'user',
            'password' => 'secret12345',
            'is_verified' => true,
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $this->assertDatabaseHas('users', [
        'name' => 'John Doe',
        'email' => 'john.doe@example.com',
        'phone_number' => '081234567890',
        'address' => 'Jl. Merdeka No. 10',
        'role' => 'user',
    ]);

    $createdUser = User::where('email', 'john.doe@example.com')->first();
    expect($createdUser->email_verified_at)->not->toBeNull();
});

test('admin can update an existing user', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $targetUser = User::factory()->create([
        'name' => 'Old Name',
        'email' => 'old@example.com',
        'role' => 'user',
    ]);

    $response = $this
        ->actingAs($admin)
        ->put(route('admin.users.update', $targetUser), [
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
            'phone_number' => '089876543210',
            'address' => 'Jl. Baru No. 99',
            'role' => 'admin',
            'is_verified' => true,
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $targetUser->refresh();
    expect($targetUser->name)->toBe('Updated Name')
        ->and($targetUser->email)->toBe('updated@example.com')
        ->and($targetUser->phone_number)->toBe('089876543210')
        ->and($targetUser->address)->toBe('Jl. Baru No. 99')
        ->and($targetUser->isAdmin())->toBeTrue()
        ->and($targetUser->email_verified_at)->not->toBeNull();
});

test('admin can delete other users', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $targetUser = User::factory()->create([
        'role' => 'user',
    ]);

    $response = $this
        ->actingAs($admin)
        ->delete(route('admin.users.destroy', $targetUser));

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $this->assertDatabaseMissing('users', [
        'id' => $targetUser->id,
    ]);
});

test('admin cannot delete their own account', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $response = $this
        ->actingAs($admin)
        ->delete(route('admin.users.destroy', $admin));

    $response->assertRedirect();
    $response->assertSessionHas('error');

    $this->assertDatabaseHas('users', [
        'id' => $admin->id,
    ]);
});
