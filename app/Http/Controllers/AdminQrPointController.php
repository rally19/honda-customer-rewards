<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\QrPointToken;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminQrPointController extends Controller
{
    /**
     * Display the QR Poin management page with activity selector, live QR, and history.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            return redirect()->route('dashboard')->with('error', 'Akses ditolak. Halaman ini khusus untuk Administrator.');
        }

        // Opportunistic background pruning for expired tokens older than 1 day
        QrPointToken::pruneOldExpired();

        // Expire active tokens that have passed their expiration timestamp & auto-regenerate if requested
        $expiredActiveTokens = QrPointToken::where('admin_id', $request->user()->id)
            ->where('status', 'active')
            ->where('expires_at', '<=', now())
            ->get();

        foreach ($expiredActiveTokens as $expToken) {
            $expToken->update(['status' => 'expired']);
            $expToken->regenerateNextToken();
        }

        // Expire any remaining active/pending tokens past their expiration
        QrPointToken::whereIn('status', ['active', 'pending_confirmation'])
            ->where('expires_at', '<=', now())
            ->update(['status' => 'expired']);

        // Active activities available for selection
        $activities = Activity::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'points', 'description'])
            ->map(fn ($act) => [
                'id' => (string) $act->id,
                'name' => $act->name,
                'points' => (int) $act->points,
                'description' => $act->description ?? '',
            ]);

        // Current active or pending confirmation QR token for this admin
        $rawActiveToken = QrPointToken::with(['activity:id,name,points', 'admin:id,name', 'scannedByUser:id,name,phone_number,email,tier'])
            ->where('admin_id', $request->user()->id)
            ->whereIn('status', ['active', 'pending_confirmation'])
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        $activeToken = $rawActiveToken ? [
            'id' => (string) $rawActiveToken->id,
            'token' => $rawActiveToken->token,
            'activity_id' => (string) $rawActiveToken->activity_id,
            'activity_name' => $rawActiveToken->activity_name,
            'points' => (int) $rawActiveToken->points,
            'notes' => $rawActiveToken->notes ?? '',
            'status' => $rawActiveToken->status,
            'requires_manual_confirmation' => (bool) $rawActiveToken->requires_manual_confirmation,
            'auto_regenerate' => (bool) $rawActiveToken->auto_regenerate,
            'duration_minutes' => (int) $rawActiveToken->duration_minutes,
            'admin_id' => (string) $rawActiveToken->admin_id,
            'admin_name' => $rawActiveToken->admin?->name ?? 'Admin',
            'scanned_by_user_id' => $rawActiveToken->scanned_by_user_id ? (string) $rawActiveToken->scanned_by_user_id : null,
            'scanned_by_user_name' => $rawActiveToken->scanned_by_user_name ?? $rawActiveToken->scannedByUser?->name,
            'scanned_by_user_phone' => $rawActiveToken->scannedByUser?->phone_number,
            'scanned_by_user_tier' => (string) ($rawActiveToken->scannedByUser?->tier?->value ?? $rawActiveToken->scannedByUser?->tier ?? 'Bronze'),
            'scanned_at' => $rawActiveToken->scanned_at?->format('d M Y, H:i:s'),
            'expires_at' => $rawActiveToken->expires_at->toIso8601String(),
            'expires_at_formatted' => $rawActiveToken->expires_at->format('H:i:s'),
            'seconds_remaining' => (int) max(0, ceil(now()->diffInSeconds($rawActiveToken->expires_at, false))),
            'created_at' => $rawActiveToken->created_at->format('d M Y, H:i:s'),
        ] : null;

        // Recent QR tokens generated today
        $recentTokens = QrPointToken::with(['activity:id,name', 'admin:id,name', 'scannedByUser:id,name,phone_number'])
            ->whereDate('created_at', today())
            ->latest()
            ->take(15)
            ->get()
            ->map(fn ($t) => [
                'id' => (string) $t->id,
                'token' => $t->token,
                'activity_id' => (string) $t->activity_id,
                'activity_name' => $t->activity_name,
                'points' => (int) $t->points,
                'status' => $t->status,
                'requires_manual_confirmation' => (bool) $t->requires_manual_confirmation,
                'auto_regenerate' => (bool) $t->auto_regenerate,
                'duration_minutes' => (int) $t->duration_minutes,
                'admin_id' => $t->admin_id ? (string) $t->admin_id : null,
                'admin_name' => $t->admin?->name ?? 'Admin',
                'scanned_by_user_id' => $t->scanned_by_user_id ? (string) $t->scanned_by_user_id : null,
                'scanned_by_user_name' => $t->scanned_by_user_name ?? $t->scannedByUser?->name ?? '-',
                'scanned_by_user_phone' => $t->scannedByUser?->phone_number ?? '-',
                'scanned_at' => $t->scanned_at?->format('d M Y, H:i') ?? '-',
                'claimed_at' => $t->claimed_at?->format('d M Y, H:i') ?? '-',
                'expires_at' => $t->expires_at->toIso8601String(),
                'expires_at_formatted' => $t->expires_at->format('H:i:s'),
                'created_at' => $t->created_at->format('d M Y, H:i'),
            ]);

        $stats = [
            'activeTokensCount' => QrPointToken::where('status', 'active')->where('expires_at', '>', now())->count(),
            'pendingConfirmationCount' => QrPointToken::where('status', 'pending_confirmation')->count(),
            'todayClaimedCount' => QrPointToken::whereDate('claimed_at', today())->where('status', 'claimed')->count(),
            'todayClaimedPoints' => (int) QrPointToken::whereDate('claimed_at', today())->where('status', 'claimed')->sum('points'),
        ];

        return Inertia::render('admin/qr-poin/index', [
            'activities' => $activities,
            'activeToken' => $activeToken,
            'recentTokens' => $recentTokens,
            'stats' => $stats,
        ]);
    }

    /**
     * Generate a new time-based one-time QR token.
     */
    public function generate(Request $request): RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Akses khusus admin.');
        }

        $validated = $request->validate([
            'activity_id' => ['required', 'exists:activities,id'],
            'points' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'duration_minutes' => ['nullable', 'integer', 'min:1', 'max:120'],
            'auto_regenerate' => ['nullable', 'boolean'],
            'requires_manual_confirmation' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $activity = Activity::findOrFail($validated['activity_id']);
        $points = ! empty($validated['points']) ? (int) $validated['points'] : (int) $activity->points;
        $durationMinutes = ! empty($validated['duration_minutes']) ? (int) $validated['duration_minutes'] : 5;
        $autoRegenerate = (bool) ($validated['auto_regenerate'] ?? false);
        $requiresManualConfirmation = (bool) ($validated['requires_manual_confirmation'] ?? false);
        $notes = $validated['notes'] ?? ('QR Poin: '.$activity->name);

        // Cancel previous active tokens created by this admin
        QrPointToken::where('admin_id', $request->user()->id)
            ->where('status', 'active')
            ->update(['status' => 'cancelled']);

        $token = QrPointToken::create([
            'token' => QrPointToken::generateUniqueToken(),
            'activity_id' => $activity->id,
            'activity_name' => $activity->name,
            'points' => $points,
            'notes' => $notes,
            'admin_id' => $request->user()->id,
            'requires_manual_confirmation' => $requiresManualConfirmation,
            'auto_regenerate' => $autoRegenerate,
            'duration_minutes' => $durationMinutes,
            'status' => 'active',
            'expires_at' => now()->addMinutes($durationMinutes),
        ]);

        return back()->with('success', 'QR Poin berhasil digenerate dan aktif selama '.$durationMinutes.' menit.');
    }

    /**
     * Cancel an active QR token.
     */
    public function cancel(Request $request, QrPointToken $token): RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Akses khusus admin.');
        }

        if (in_array($token->status, ['active', 'pending_confirmation'])) {
            $token->update(['status' => 'cancelled']);
        }

        return back()->with('info', 'QR Poin berhasil dibatalkan.');
    }

    /**
     * Confirm a pending QR scan and award points to customer.
     */
    public function confirm(Request $request, QrPointToken $token): RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Akses khusus admin.');
        }

        if ($token->status !== 'pending_confirmation') {
            return back()->with('error', 'Status QR bukan menunggu konfirmasi.');
        }

        $customer = User::findOrFail($token->scanned_by_user_id);
        $activity = $token->activity ?? Activity::find($token->activity_id) ?? new Activity([
            'id' => $token->activity_id ?? 'custom',
            'name' => $token->activity_name,
            'points' => $token->points,
        ]);

        // Award points to the customer and record admin_id
        $customer->awardPoints(
            $activity,
            $token->points,
            $request->user(),
            $token->notes ?? 'Klaim Mandiri via QR Poin AHASS (Dikonfirmasi Staf)'
        );

        $token->update([
            'status' => 'claimed',
            'claimed_at' => now(),
        ]);

        // If auto-regenerate is enabled, immediately spawn the next active token
        $token->regenerateNextToken();

        return back()->with('success', 'Konfirmasi berhasil! '.$token->points.' poin telah diberikan kepada '.$customer->name.'.');
    }

    /**
     * Reject a pending QR scan.
     */
    public function reject(Request $request, QrPointToken $token): RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Akses khusus admin.');
        }

        if ($token->status !== 'pending_confirmation') {
            return back()->with('error', 'Status QR bukan menunggu konfirmasi.');
        }

        $token->update([
            'status' => 'rejected',
        ]);

        // If auto-regenerate is enabled, spawn next token
        $token->regenerateNextToken();

        return back()->with('info', 'Klaim QR Poin telah ditolak.');
    }
}
