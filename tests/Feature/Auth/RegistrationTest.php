<?php

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('registration screen includes team invitation context', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create(['name' => 'Laravel Team']);
    $team->members()->attach($owner, ['role' => TeamRole::Owner->value]);

    $invitation = TeamInvitation::factory()->create([
        'team_id' => $team->id,
        'email' => 'invited@example.com',
        'invited_by' => $owner->id,
    ]);

    $response = $this->get(route('register', ['invitation' => $invitation->code]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('auth/register')
        ->where('teamInvitation.code', $invitation->code)
        ->where('teamInvitation.teamName', 'Laravel Team'),
    );
});

test('new users can register', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();

    $user = User::where('email', 'test@example.com')->first();
    expect($user->role)->toBe(\App\Enums\UserRole::User);
    $response->assertRedirect(route('dashboard'));
});

test('new users can register with phone and address', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Budi Honda',
        'email' => 'budi@example.com',
        'phone_number' => '081234567890',
        'address' => 'Jl. Sudirman No. 1, Jakarta',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();

    $user = User::where('email', 'budi@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->phone_number)->toBe('081234567890');
    expect($user->address)->toBe('Jl. Sudirman No. 1, Jakarta');
    expect($user->role)->toBe(\App\Enums\UserRole::User);
    expect($user->isAdmin())->toBeFalse();
    expect($user->isUser())->toBeTrue();
    $response->assertRedirect(route('dashboard'));
});