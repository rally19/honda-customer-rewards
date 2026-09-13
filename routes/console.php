<?php

use App\Models\QrPointToken;
use App\Models\TeamInvitation;
use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    TeamInvitation::query()
        ->whereNotNull('expires_at')
        ->where('expires_at', '<', now())
        ->delete();
})->daily()->description('Delete expired team invitations');

Schedule::call(function () {
    QrPointToken::pruneOldExpired();
})->daily()->description('Delete QR point tokens expired more than 1 day');
