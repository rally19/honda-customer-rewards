<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Contracts\Cache\Repository;
use Laravel\Fortify\TwoFactorAuthenticationProvider;
use PragmaRX\Google2FA\Google2FA;

class CustomTwoFactorAuthenticationProvider extends TwoFactorAuthenticationProvider
{
    public function __construct(
        Google2FA $engine,
        ?Repository $cache = null,
        protected ?TwoFactorEmailService $emailService = null
    ) {
        parent::__construct($engine, $cache);
        $this->emailService ??= app(TwoFactorEmailService::class);
    }

    /**
     * Verify the given code against email OTP or TOTP authenticator.
     *
     * @param  string  $secret
     * @param  string  $code
     */
    public function verify($secret, $code): bool
    {
        // Check if there is a challenged user with valid email OTP
        $user = $this->getChallengedUser();
        if ($user && $this->emailService->verifyCode($user, $code)) {
            return true;
        }

        // Fallback to standard TOTP verification (Google Authenticator)
        return parent::verify($secret, $code);
    }

    /**
     * Retrieve challenged user from session if present.
     */
    protected function getChallengedUser(): ?User
    {
        if (session()->has('login.id')) {
            $userId = session('login.id');

            return User::find($userId);
        }

        if (auth()->check()) {
            return auth()->user();
        }

        return null;
    }
}
