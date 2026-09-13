<?php

use App\Enums\UserRole;
use App\Models\Activity;
use App\Models\QrPointToken;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('non-admin user cannot access admin qr-poin', function () {
    $user = User::factory()->create([
        'role' => UserRole::User->value,
    ]);

    $this->actingAs($user)
        ->get(route('admin.qr-poin.index'))
        ->assertRedirect(route('dashboard'));
});

test('admin can view qr-poin page and generate token', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $activity = Activity::create([
        'name' => 'Ganti Oli MPX',
        'points' => 50,
        'description' => 'Ganti oli mesin asli Honda',
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($admin)
        ->get(route('admin.qr-poin.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/qr-poin/index')
        ->has('activities')
    );

    // Generate token with auto_regenerate = true
    $postResponse = $this
        ->actingAs($admin)
        ->post(route('admin.qr-poin.generate'), [
            'activity_id' => $activity->id,
            'points' => 50,
            'duration_minutes' => 5,
            'auto_regenerate' => true,
            'requires_manual_confirmation' => false,
        ]);

    $postResponse->assertSessionHas('success');

    $token = QrPointToken::where('admin_id', $admin->id)->latest()->first();
    expect($token)->not->toBeNull()
        ->and($token->status)->toBe('active')
        ->and($token->auto_regenerate)->toBeTrue()
        ->and($token->points)->toBe(50);
});

test('expired token with auto_regenerate triggers new token generation on index reload', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $activity = Activity::create([
        'name' => 'Tune Up AHASS',
        'points' => 100,
        'description' => 'Servis Tune Up',
        'is_active' => true,
    ]);

    // Create a token that is already expired
    $oldToken = QrPointToken::create([
        'token' => QrPointToken::generateUniqueToken(),
        'activity_id' => $activity->id,
        'activity_name' => $activity->name,
        'points' => 100,
        'admin_id' => $admin->id,
        'admin_name' => $admin->name,
        'status' => 'active',
        'auto_regenerate' => true,
        'requires_manual_confirmation' => false,
        'duration_minutes' => 5,
        'expires_at' => now()->subMinute(),
    ]);

    // Admin visits/reloads qr-poin page
    $this->actingAs($admin)
        ->get(route('admin.qr-poin.index'))
        ->assertOk();

    // Old token should be marked expired
    expect($oldToken->fresh()->status)->toBe('expired');

    // A new token should have been regenerated
    $newToken = QrPointToken::where('admin_id', $admin->id)
        ->where('status', 'active')
        ->where('id', '!=', $oldToken->id)
        ->first();

    expect($newToken)->not->toBeNull()
        ->and($newToken->activity_name)->toBe('Tune Up AHASS')
        ->and($newToken->points)->toBe(100)
        ->and($newToken->auto_regenerate)->toBeTrue();
});

test('customer can claim active qr point and triggers auto-regeneration if enabled', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $customer = User::factory()->create([
        'role' => UserRole::User->value,
        'points' => 0,
        'lifetime_points' => 0,
    ]);

    $activity = Activity::create([
        'name' => 'Beli Sparepart',
        'points' => 75,
        'is_active' => true,
    ]);

    $token = QrPointToken::create([
        'token' => QrPointToken::generateUniqueToken(),
        'activity_id' => $activity->id,
        'activity_name' => $activity->name,
        'points' => 75,
        'admin_id' => $admin->id,
        'admin_name' => $admin->name,
        'status' => 'active',
        'auto_regenerate' => true,
        'requires_manual_confirmation' => false,
        'duration_minutes' => 5,
        'expires_at' => now()->addMinutes(5),
    ]);

    $claimResponse = $this->actingAs($customer)
        ->postJson(route('customer.qr-poin.claim'), [
            'token' => $token->token,
        ]);

    $claimResponse->assertOk()
        ->assertJson([
            'success' => true,
            'status' => 'claimed',
            'points' => 75,
        ]);

    expect($customer->fresh()->points)->toBe(75)
        ->and($token->fresh()->status)->toBe('claimed');

    // Auto-regenerated token should exist
    $next = QrPointToken::where('admin_id', $admin->id)
        ->where('status', 'active')
        ->where('id', '!=', $token->id)
        ->first();

    expect($next)->not->toBeNull()
        ->and($next->points)->toBe(75);
});
