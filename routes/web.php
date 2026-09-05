<?php

use App\Http\Controllers\AdminActivityController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminRewardController;
use App\Http\Controllers\AdminScanController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\Auth\TwoFactorEmailController;
use App\Http\Controllers\CustomerDashboardController;
use App\Http\Controllers\CustomerHistoryController;
use App\Http\Controllers\CustomerRewardController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Customer Dashboard (E-Wallet / Digital Member Rewards)
    Route::get('dashboard', CustomerDashboardController::class)->name('dashboard');
    Route::get('activities', CustomerHistoryController::class)->name('customer.activities');
    Route::get('history', CustomerHistoryController::class)->name('customer.history');
    Route::get('rewards', [CustomerRewardController::class, 'index'])->name('customer.rewards');
    Route::post('rewards/{reward}/claim', [CustomerRewardController::class, 'claim'])->name('customer.rewards.claim');
    Route::post('rewards/exchanges/{exchange}/cancel', [CustomerRewardController::class, 'cancel'])->name('customer.rewards.cancel');

    // Admin Portal & Management
    Route::get('admin/dashboard', AdminDashboardController::class)->name('admin.dashboard');
    Route::get('admin/users', [AdminUserController::class, 'index'])->name('admin.users.index');
    Route::post('admin/users', [AdminUserController::class, 'store'])->name('admin.users.store');
    Route::put('admin/users/{user}', [AdminUserController::class, 'update'])->name('admin.users.update');
    Route::delete('admin/users/{user}', [AdminUserController::class, 'destroy'])->name('admin.users.destroy');

    // Scan & Input Member Point Rewards
    Route::get('admin/scan', [AdminScanController::class, 'index'])->name('admin.scan.index');
    Route::post('admin/scan/lookup', [AdminScanController::class, 'lookup'])->name('admin.scan.lookup');
    Route::post('admin/scan', [AdminScanController::class, 'store'])->name('admin.scan.store');

    // Activities & Activity Histories Management
    Route::get('admin/activities', [AdminActivityController::class, 'index'])->name('admin.activities.index');
    Route::post('admin/activities', [AdminActivityController::class, 'store'])->name('admin.activities.store');
    Route::put('admin/activities/{activity}', [AdminActivityController::class, 'update'])->name('admin.activities.update');
    Route::delete('admin/activities/{activity}', [AdminActivityController::class, 'destroy'])->name('admin.activities.destroy');

    // Rewards & Point Exchanges Management
    Route::get('admin/rewards', [AdminRewardController::class, 'index'])->name('admin.rewards.index');
    Route::post('admin/rewards', [AdminRewardController::class, 'store'])->name('admin.rewards.store');
    Route::put('admin/rewards/{reward}', [AdminRewardController::class, 'update'])->name('admin.rewards.update');
    Route::delete('admin/rewards/{reward}', [AdminRewardController::class, 'destroy'])->name('admin.rewards.destroy');
    Route::post('admin/rewards/exchanges/{exchange}/approve', [AdminRewardController::class, 'approve'])->name('admin.rewards.approve');
    Route::post('admin/rewards/exchanges/{exchange}/reject', [AdminRewardController::class, 'reject'])->name('admin.rewards.reject');
});

Route::post('two-factor-challenge/resend-email', [TwoFactorEmailController::class, 'resend'])
    ->middleware(['web'])
    ->name('two-factor.resend-email');

require __DIR__.'/settings.php';
