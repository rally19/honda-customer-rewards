<?php

namespace App\Http\Responses\Concerns;

use Illuminate\Http\Request;

trait RedirectsToCurrentTeam
{
    protected function redirectPathForCurrentTeam(Request $request, string $redirect): string
    {
        $user = $request->user();

        if (! $user) {
            return $redirect;
        }

        if ($user->role === 'admin') {
            return '/admin/dashboard';
        }

        return '/dashboard';
    }
}
