<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\TwoFactorCodeNotification;
use Illuminate\Support\Facades\Cache;

class TwoFactorEmailService
{
    /**
     * Cache key prefix for 2FA code.
     */
    private const CACHE_PREFIX = '2fa_email_code_';

    /**
     * Cache key prefix for resend throttle.
     */
    private const THROTTLE_PREFIX = '2fa_email_throttle_';

    /**
     * Generate and send a 2FA OTP code to user's email.
     */
    public function sendCode(User $user): string
    {
        $code = sprintf('%06d', random_int(100000, 999999));

        Cache::put(self::CACHE_PREFIX.$user->id, $code, now()->addMinutes(10));
        Cache::put(self::THROTTLE_PREFIX.$user->id, true, now()->addSeconds(60));

        // Also store in session as fallback
        session(['two_factor_email_code' => $code]);

        $user->notify(new TwoFactorCodeNotification($code));

        return $code;
    }

    /**
     * Verify if the provided code matches the email OTP code.
     */
    public function verifyCode(User $user, string $code): bool
    {
        $cachedCode = Cache::get(self::CACHE_PREFIX.$user->id);
        $sessionCode = session('two_factor_email_code');

        $isValid = ($cachedCode && hash_equals((string) $cachedCode, $code))
            || ($sessionCode && hash_equals((string) $sessionCode, $code));

        if ($isValid) {
            Cache::forget(self::CACHE_PREFIX.$user->id);
            session()->forget('two_factor_email_code');

            return true;
        }

        return false;
    }

    /**
     * Check if user can request a resend (rate limit).
     */
    public function canResend(User $user): bool
    {
        return ! Cache::has(self::THROTTLE_PREFIX.$user->id);
    }
}
