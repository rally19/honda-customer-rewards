<?php

use App\Enums\MemberTier;
use App\Enums\UserRole;
use App\Models\PointExchange;
use App\Models\Reward;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guest is redirected to login when accessing customer rewards', function () {
    $response = $this->get(route('customer.rewards'));
    $response->assertRedirect(route('login'));
});

test('non-admin user cannot access admin rewards page', function () {
    $user = User::factory()->create([
        'role' => UserRole::User->value,
    ]);

    $this->actingAs($user)
        ->get(route('admin.rewards.index'))
        ->assertRedirect(route('dashboard'));
});

test('admin can view admin rewards page with rewards and exchanges', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $reward = Reward::create([
        'name' => 'Oli Mesin AHM Oil SPX 2',
        'description' => 'Oli motor matic Honda 800ml',
        'points_cost' => 150,
        'stock' => 10,
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)->get(route('admin.rewards.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/rewards/index')
        ->has('rewards')
        ->has('exchanges.data')
        ->has('stats')
    );
});

test('admin can create, update, and delete a reward', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    // Create
    $response = $this->actingAs($admin)->post(route('admin.rewards.store'), [
        'name' => 'Honda Riding Jacket',
        'description' => 'Jaket touring original Honda',
        'points_cost' => 500,
        'stock' => 5,
        'is_active' => true,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('rewards', [
        'name' => 'Honda Riding Jacket',
        'points_cost' => 500,
        'stock' => 5,
    ]);

    $reward = Reward::where('name', 'Honda Riding Jacket')->first();
    expect(strlen($reward->id))->toBe(10);

    // Update
    $updateResponse = $this->actingAs($admin)->put(route('admin.rewards.update', $reward->id), [
        'name' => 'Honda Riding Jacket Pro',
        'description' => 'Versi upgrade',
        'points_cost' => 550,
        'stock' => 8,
        'is_active' => true,
    ]);

    $updateResponse->assertRedirect();
    $this->assertDatabaseHas('rewards', [
        'id' => $reward->id,
        'name' => 'Honda Riding Jacket Pro',
        'points_cost' => 550,
        'stock' => 8,
    ]);

    // Delete
    $deleteResponse = $this->actingAs($admin)->delete(route('admin.rewards.destroy', $reward->id));
    $deleteResponse->assertRedirect();
    $this->assertDatabaseMissing('rewards', [
        'id' => $reward->id,
    ]);
});

test('customer can view active rewards catalog', function () {
    $user = User::factory()->create([
        'role' => UserRole::User->value,
        'points' => 300,
        'lifetime_points' => 600,
        'tier' => MemberTier::Silver,
    ]);

    Reward::create([
        'name' => 'Voucher Diskon AHASS Rp 50.000',
        'description' => 'Diskon servis jasa',
        'points_cost' => 100,
        'stock' => 20,
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->get(route('customer.rewards'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('customer/rewards')
        ->has('rewards', 1)
        ->where('stats.currentPoints', 300)
        ->where('stats.lifetimePoints', 600)
        ->where('stats.tierBadge', 'SILVER')
    );
});

test('customer can claim reward holding stock and points while keeping lifetime points and tier intact', function () {
    $user = User::factory()->create([
        'role' => UserRole::User->value,
        'points' => 300,
        'lifetime_points' => 300,
        'tier' => MemberTier::Silver,
        'phone_number' => '08123456789',
        'address' => 'Jl. Sudirman No. 1, Jakarta',
    ]);

    $reward = Reward::create([
        'name' => 'Gantungan Kunci Spesial Honda',
        'description' => 'Aksesoris eksklusif',
        'points_cost' => 100,
        'stock' => 5,
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->post(route('customer.rewards.claim', $reward->id));

    $response->assertRedirect();

    // Check user points decremented, but lifetime_points and tier remain intact
    $user->refresh();
    expect($user->points)->toBe(200);
    expect($user->lifetime_points)->toBe(300);
    expect($user->tier)->toBe(MemberTier::Silver);

    // Check reward stock decremented
    $reward->refresh();
    expect($reward->stock)->toBe(4);

    // Check point exchange record created with 'hold' status
    $this->assertDatabaseHas('point_exchanges', [
        'reward_id' => $reward->id,
        'user_id' => $user->id,
        'points_cost' => 100,
        'status' => 'hold',
    ]);

    $exchange = PointExchange::where('user_id', $user->id)->first();
    expect(strlen($exchange->id))->toBe(10);
    expect($exchange->user_phone)->toBe('08123456789');
});

test('customer cannot claim reward if points are insufficient or stock is zero', function () {
    $user = User::factory()->create([
        'role' => UserRole::User->value,
        'points' => 50,
        'lifetime_points' => 50,
    ]);

    $rewardExpensive = Reward::create([
        'name' => 'Helm Honda TRX-3',
        'description' => 'Helm full face SNI',
        'points_cost' => 500,
        'stock' => 5,
        'is_active' => true,
    ]);

    $rewardOutOfStock = Reward::create([
        'name' => 'Topi Honda Racing',
        'description' => 'Topi eksklusif HRC',
        'points_cost' => 30,
        'stock' => 0,
        'is_active' => true,
    ]);

    // Attempt claim expensive reward
    $response1 = $this->actingAs($user)->post(route('customer.rewards.claim', $rewardExpensive->id));
    $response1->assertSessionHas('error');
    $user->refresh();
    expect($user->points)->toBe(50);
    expect($rewardExpensive->fresh()->stock)->toBe(5);

    // Attempt claim out of stock reward
    $response2 = $this->actingAs($user)->post(route('customer.rewards.claim', $rewardOutOfStock->id));
    $response2->assertSessionHas('error');
    $user->refresh();
    expect($user->points)->toBe(50);
    expect($rewardOutOfStock->fresh()->stock)->toBe(0);
});

test('customer can cancel their hold claim and points plus stock are refunded', function () {
    $user = User::factory()->create([
        'role' => UserRole::User->value,
        'points' => 200,
        'lifetime_points' => 300,
    ]);

    $reward = Reward::create([
        'name' => 'Payung Lipat Honda Official',
        'points_cost' => 100,
        'stock' => 4,
        'is_active' => true,
    ]);

    $exchange = PointExchange::create([
        'reward_id' => $reward->id,
        'reward_name' => $reward->name,
        'points_cost' => 100,
        'user_id' => $user->id,
        'user_name' => $user->name,
        'user_email' => $user->email,
        'status' => 'hold',
    ]);

    $response = $this->actingAs($user)->post(route('customer.rewards.cancel', $exchange->id));

    $response->assertRedirect();
    $response->assertSessionHas('success');

    // Points refunded
    $user->refresh();
    expect($user->points)->toBe(300);

    // Stock refunded
    $reward->refresh();
    expect($reward->stock)->toBe(5);

    // Status updated
    $exchange->refresh();
    expect($exchange->status)->toBe('cancelled');
});

test('admin can approve a hold claim', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $user = User::factory()->create([
        'role' => UserRole::User->value,
        'points' => 200,
    ]);

    $reward = Reward::create([
        'name' => 'Mug Keramik Honda',
        'points_cost' => 80,
        'stock' => 9,
        'is_active' => true,
    ]);

    $exchange = PointExchange::create([
        'reward_id' => $reward->id,
        'reward_name' => $reward->name,
        'points_cost' => 80,
        'user_id' => $user->id,
        'user_name' => $user->name,
        'user_email' => $user->email,
        'status' => 'hold',
    ]);

    $response = $this->actingAs($admin)->post(route('admin.rewards.approve', $exchange->id), [
        'admin_notes' => 'Reward diserahkan di AHASS cabang pusat',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $exchange->refresh();
    expect($exchange->status)->toBe('claimed');
    expect($exchange->admin_id)->toBe($admin->id);
    expect($exchange->admin_notes)->toBe('Reward diserahkan di AHASS cabang pusat');

    // Points and stock are NOT refunded
    expect($user->fresh()->points)->toBe(200);
    expect($reward->fresh()->stock)->toBe(9);
});

test('admin can reject a hold claim and refund points and stock to customer', function () {
    $admin = User::factory()->create([
        'role' => UserRole::Admin->value,
    ]);

    $user = User::factory()->create([
        'role' => UserRole::User->value,
        'points' => 200,
    ]);

    $reward = Reward::create([
        'name' => 'Mug Keramik Honda',
        'points_cost' => 80,
        'stock' => 9,
        'is_active' => true,
    ]);

    $exchange = PointExchange::create([
        'reward_id' => $reward->id,
        'reward_name' => $reward->name,
        'points_cost' => 80,
        'user_id' => $user->id,
        'user_name' => $user->name,
        'user_email' => $user->email,
        'status' => 'hold',
    ]);

    $response = $this->actingAs($admin)->post(route('admin.rewards.reject', $exchange->id), [
        'admin_notes' => 'Stok fisik rusak di gudang, pengembalian poin',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $exchange->refresh();
    expect($exchange->status)->toBe('rejected');
    expect($exchange->admin_id)->toBe($admin->id);
    expect($exchange->admin_notes)->toBe('Stok fisik rusak di gudang, pengembalian poin');

    // Points and stock refunded
    expect($user->fresh()->points)->toBe(280);
    expect($reward->fresh()->stock)->toBe(10);
});
