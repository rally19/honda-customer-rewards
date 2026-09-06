<?php

namespace App\Http\Controllers;

use App\Enums\MemberTier;
use App\Enums\UserRole;
use App\Models\Activity;
use App\Models\ActivityHistory;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminScanController extends Controller
{
    /**
     * Display the QR scan and manual user ID input page.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            return redirect()->route('dashboard')->with('error', 'Akses ditolak. Halaman ini khusus untuk Administrator.');
        }

        $activities = Activity::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'points', 'description'])
            ->map(fn ($act) => [
                'id' => (string) $act->id,
                'name' => $act->name,
                'points' => (int) $act->points,
                'description' => $act->description ?? '',
            ]);

        $recentScans = ActivityHistory::with(['user:id,name,email,tier', 'activity:id,name', 'admin:id,name'])
            ->latest()
            ->take(8)
            ->get()
            ->map(fn ($history) => [
                'id' => (string) $history->id,
                'activity_name' => $history->activity_name,
                'points' => (int) $history->points,
                'user_id' => (string) $history->user_id,
                'user_name' => $history->user_name,
                'user_tier' => $history->user?->tier instanceof MemberTier
                    ? $history->user->tier->value
                    : (string) ($history->user?->tier ?? 'Bronze'),
                'admin_name' => $history->admin?->name ?? 'Admin',
                'time_ago' => $history->created_at?->diffForHumans() ?? '-',
                'created_at' => $history->created_at?->format('d M Y, H:i') ?? '-',
            ]);

        $stats = [
            'activeActivities' => $activities->count(),
            'todayPointsAwarded' => (int) ActivityHistory::whereDate('created_at', today())->sum('points'),
            'todayScansCount' => ActivityHistory::whereDate('created_at', today())->count(),
            'totalScans' => ActivityHistory::count(),
        ];

        // Optional pre-load by user_id query parameter
        $initialMember = null;
        if ($request->filled('user_id')) {
            $foundUser = User::find($request->query('user_id'));
            if ($foundUser) {
                $tier = $foundUser->tier instanceof MemberTier
                    ? $foundUser->tier
                    : MemberTier::calculate((int) $foundUser->lifetime_points);

                $initialMember = [
                    'id' => (string) $foundUser->id,
                    'name' => $foundUser->name,
                    'email' => $foundUser->email,
                    'phone_number' => $foundUser->phone_number ?? '-',
                    'address' => $foundUser->address ?? '-',
                    'role' => $foundUser->role instanceof UserRole ? $foundUser->role->value : (string) $foundUser->role,
                    'points' => (int) $foundUser->points,
                    'lifetime_points' => (int) $foundUser->lifetime_points,
                    'tier' => $tier->value,
                    'next_tier' => $tier->nextTier()?->value,
                    'points_to_next_tier' => $tier->pointsToNextTier((int) $foundUser->lifetime_points),
                    'tier_progress' => $tier->progress((int) $foundUser->lifetime_points),
                    'email_verified' => $foundUser->hasVerifiedEmail(),
                    'created_at' => $foundUser->created_at?->format('d M Y') ?? '-',
                ];
            }
        }

        return Inertia::render('admin/scan/index', [
            'activities' => $activities,
            'recentScans' => $recentScans,
            'stats' => $stats,
            'initialMember' => $initialMember,
            'awarded' => session('awarded'),
        ]);
    }

    /**
     * Lookup a member by raw ID, scanned QR code value, email, or phone.
     */
    public function lookup(Request $request): JsonResponse
    {
        if (! $request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'identifier' => ['required', 'string', 'max:255'],
        ]);

        $raw = trim($request->identifier);

        // Strip prefix like HND-MEMBER- or HND- if present
        $cleanDigits = preg_replace('/[^0-9]/', '', $raw);

        $user = null;

        if (! empty($cleanDigits) && strlen($cleanDigits) >= 9) {
            $user = User::where('id', $cleanDigits)->first();
        }

        if (! $user) {
            $user = User::where('id', $raw)
                ->orWhere('email', $raw)
                ->orWhere('phone_number', $raw)
                ->first();
        }

        if (! $user) {
            return response()->json([
                'found' => false,
                'message' => 'Member dengan ID atau kode QR tersebut tidak ditemukan.',
            ], 404);
        }

        $tier = $user->tier instanceof MemberTier
            ? $user->tier
            : MemberTier::calculate((int) $user->lifetime_points);

        return response()->json([
            'found' => true,
            'member' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone_number' => $user->phone_number ?? '-',
                'address' => $user->address ?? '-',
                'role' => $user->role instanceof UserRole ? $user->role->value : (string) $user->role,
                'points' => (int) $user->points,
                'lifetime_points' => (int) $user->lifetime_points,
                'tier' => $tier->value,
                'next_tier' => $tier->nextTier()?->value,
                'points_to_next_tier' => $tier->pointsToNextTier((int) $user->lifetime_points),
                'tier_progress' => $tier->progress((int) $user->lifetime_points),
                'email_verified' => $user->hasVerifiedEmail(),
                'created_at' => $user->created_at?->format('d M Y') ?? '-',
            ],
        ]);
    }

    /**
     * Process point addition for an activity.
     */
    public function store(Request $request): RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            return redirect()->route('dashboard')->with('error', 'Akses ditolak.');
        }

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'activity_id' => ['required', 'exists:activities,id'],
            'points' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $activity = Activity::findOrFail($validated['activity_id']);
        $points = ! empty($validated['points']) ? (int) $validated['points'] : (int) $activity->points;

        $user = User::findOrFail($validated['user_id']);

        $oldTier = $user->tier instanceof MemberTier
            ? $user->tier
            : MemberTier::calculate((int) $user->lifetime_points);

        $history = $user->awardPoints(
            $activity,
            $points,
            $request->user(),
            $validated['notes'] ?? null
        );

        $freshUser = $user->fresh();
        $newTier = $freshUser->tier instanceof MemberTier
            ? $freshUser->tier
            : MemberTier::calculate((int) $freshUser->lifetime_points);

        $isUpgrade = $newTier !== $oldTier;

        return back()->with([
            'success' => "Sukses! {$points} poin berhasil ditambahkan ke member {$user->name}.",
            'awarded' => [
                'history_id' => (string) $history->id,
                'user_id' => (string) $user->id,
                'user_name' => $user->name,
                'activity_name' => $activity->name,
                'points_added' => $points,
                'current_points' => (int) $freshUser->points,
                'lifetime_points' => (int) $freshUser->lifetime_points,
                'tier' => $newTier->value,
                'tier_upgraded' => $isUpgrade,
                'old_tier' => $oldTier->value,
                'new_tier' => $newTier->value,
            ],
        ]);
    }
}
