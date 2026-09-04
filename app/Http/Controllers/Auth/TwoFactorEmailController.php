<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TwoFactorEmailService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TwoFactorEmailController extends Controller
{
    public function __construct(
        protected TwoFactorEmailService $emailService
    ) {}

    /**
     * Resend 2FA verification code to user's email.
     */
    public function resend(Request $request): RedirectResponse
    {
        if (! $request->session()->has('login.id')) {
            return redirect()->route('login');
        }

        $user = User::find($request->session()->get('login.id'));

        if (! $user) {
            return redirect()->route('login');
        }

        if (! $this->emailService->canResend($user)) {
            return back()->with('status', 'Mohon tunggu 1 menit sebelum meminta kode baru.');
        }

        $this->emailService->sendCode($user);

        return back()->with('status', 'Kode 2FA baru telah berhasil dikirim ke email Anda.');
    }
}
