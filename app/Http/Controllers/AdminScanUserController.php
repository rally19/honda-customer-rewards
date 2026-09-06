<?php

namespace App\Http\Controllers;

use App\Enums\MemberTier;
use App\Enums\UserRole;
use App\Models\PointExchange;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminScanUserController extends Controller
{
    /**
     * Display the QR scan and manual user lookup page specifically for reward claims & member details.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            return redirect()->route('dashboard')->with('error', 'Akses ditolak. Halaman ini khusus untuk Administrator.');
        }

        // Recent reward claims stream (last 8 claims in the system)
        $recentClaims = PointExchange::with(['user:id,name,email,tier,phone_number', 'reward:id,name,image_url', 'admin:id,name'])
            ->latest('created_at')
            ->take(8)
            ->get()
            ->map(fn ($exchange) => [
                'id' => (string) $exchange->id,
                'reward_id' => (string) ($exchange->reward_id ?? '-'),
                'reward_name' => $exchange->reward_name,
                'reward_image' => $exchange->reward_image ?? $exchange->reward?->image_url ?? '',
                'points_cost' => (int) $exchange->points_cost,
                'user_id' => (string) $exchange->user_id,
                'user_name' => $exchange->user_name,
                'user_email' => $exchange->user_email,
                'user_phone' => $exchange->user_phone ?? $exchange->user?->phone_number ?? '-',
                'user_tier' => $exchange->user?->tier instanceof MemberTier
                    ? $exchange->user->tier->value
                    : (string) ($exchange->user?->tier ?? 'Bronze'),
                'status' => $exchange->status,
                'admin_name' => $exchange->admin?->name ?? 'Staf AHASS',
                'admin_notes' => $exchange->admin_notes ?? '',
                'time_ago' => $exchange->created_at?->diffForHumans() ?? '-',
                'created_at' => $exchange->created_at?->format('d M Y, H:i') ?? '-',
            ]);

        // Global stats for reward claims
        $stats = [
            'totalClaims' => PointExchange::count(),
            'holdClaims' => PointExchange::where('status', 'hold')->count(),
            'claimedCount' => PointExchange::where('status', 'claimed')->count(),
            'totalPointsExchanged' => (int) PointExchange::where('status', 'claimed')->sum('points_cost'),
        ];

        // Optional pre-load by user_id query parameter
        $initialMember = null;
        $initialClaims = [];
        $initialMemberStats = null;

        if ($request->filled('user_id')) {
            $foundUser = User::find($request->query('user_id'));
            if ($foundUser) {
                $memberData = $this->formatMemberData($foundUser);
                $initialMember = $memberData['member'];
                $initialClaims = $memberData['claims'];
                $initialMemberStats = $memberData['stats'];
            }
        }

        return Inertia::render('admin/scan-user/index', [
            'recentClaims' => $recentClaims,
            'stats' => $stats,
            'initialMember' => $initialMember,
            'initialClaims' => $initialClaims,
            'initialMemberStats' => $initialMemberStats,
        ]);
    }

    /**
     * Lookup a member by raw ID, scanned QR code value, email, or phone,
     * and retrieve their detailed profile & reward claims history.
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

        // Strip prefixes like HND-MEMBER- or HND- if present
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

        $data = $this->formatMemberData($user);

        return response()->json([
            'found' => true,
            'member' => $data['member'],
            'claims' => $data['claims'],
            'stats' => $data['stats'],
        ]);
    }

    /**
     * Format a user model into structured member data, claims history, and personal stats.
     *
     * @return array{
     *     member: array<string, mixed>,
     *     claims: array<int, array<string, mixed>>,
     *     stats: array<string, int>
     * }
     */
    private function formatMemberData(User $user): array
    {
        $tier = $user->tier instanceof MemberTier
            ? $user->tier
            : MemberTier::calculate((int) $user->lifetime_points);

        $claims = PointExchange::with(['reward:id,name,image_url', 'admin:id,name'])
            ->where('user_id', $user->id)
            ->latest('created_at')
            ->get()
            ->map(fn ($exchange) => [
                'id' => (string) $exchange->id,
                'reward_id' => (string) ($exchange->reward_id ?? '-'),
                'reward_name' => $exchange->reward_name,
                'reward_image' => $exchange->reward_image ?? $exchange->reward?->image_url ?? '',
                'points_cost' => (int) $exchange->points_cost,
                'user_id' => (string) $exchange->user_id,
                'user_name' => $exchange->user_name,
                'user_email' => $exchange->user_email,
                'user_phone' => $exchange->user_phone ?? $user->phone_number ?? '-',
                'user_address' => $exchange->user_address ?? $user->address ?? '-',
                'status' => $exchange->status,
                'admin_name' => $exchange->admin?->name ?? 'Staf AHASS',
                'admin_notes' => $exchange->admin_notes ?? '',
                'time_ago' => $exchange->created_at?->diffForHumans() ?? '-',
                'created_at' => $exchange->created_at?->format('d M Y, H:i') ?? '-',
                'raw_date' => $exchange->created_at?->toIso8601String() ?? '',
            ])
            ->all();

        $memberStats = [
            'totalClaims' => count($claims),
            'holdClaims' => count(array_filter($claims, fn ($c) => $c['status'] === 'hold')),
            'claimedCount' => count(array_filter($claims, fn ($c) => $c['status'] === 'claimed')),
            'rejectedCount' => count(array_filter($claims, fn ($c) => in_array($c['status'], ['rejected', 'cancelled'], true))),
            'totalPointsSpent' => array_sum(array_column(array_filter($claims, fn ($c) => $c['status'] === 'claimed'), 'points_cost')),
            'totalActivities' => $user->activityHistories()->count(),
        ];

        return [
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
            'claims' => $claims,
            'stats' => $memberStats,
        ];
    }
}
