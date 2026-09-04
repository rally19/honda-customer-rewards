<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\CustomerDashboardController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Customer Dashboard (E-Wallet / Digital Member Rewards)
    Route::get('dashboard', CustomerDashboardController::class)->name('dashboard');

    // Admin Portal & Management
    Route::get('admin/dashboard', AdminDashboardController::class)->name('admin.dashboard');
    Route::get('admin/users', [\App\Http\Controllers\AdminUserController::class, 'index'])->name('admin.users.index');
    Route::post('admin/users', [\App\Http\Controllers\AdminUserController::class, 'store'])->name('admin.users.store');
    Route::put('admin/users/{user}', [\App\Http\Controllers\AdminUserController::class, 'update'])->name('admin.users.update');
    Route::delete('admin/users/{user}', [\App\Http\Controllers\AdminUserController::class, 'destroy'])->name('admin.users.destroy');
});

Route::post('two-factor-challenge/resend-email', [App\Http\Controllers\Auth\TwoFactorEmailController::class, 'resend'])
    ->middleware(['web'])
    ->name('two-factor.resend-email');

require __DIR__.'/settings.php';
