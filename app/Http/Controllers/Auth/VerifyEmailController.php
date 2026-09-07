<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class VerifyEmailController extends Controller
{
    /**
     * Mark the authenticated or specified user's email address as verified.
     */
    public function __invoke(Request $request, string|int $id, string $hash): RedirectResponse
    {
        $user = User::find($id);

        if (! $user || ! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            abort(403, 'Tautan verifikasi tidak valid atau user tidak ditemukan.');
        }

        if ($user->hasVerifiedEmail()) {
            if (! Auth::check()) {
                Auth::login($user);
            }

            return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        if (! Auth::check()) {
            Auth::login($user);
        }

        return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
    }
}
