<?php

namespace App\Http\Controllers;

use App\Enums\MemberTier;
use App\Enums\UserRole;
use App\Models\Activity;
use App\Models\ActivityHistory;
use App\Models\PointExchange;
use App\Models\Reward;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        // Enforce admin authorization
        if (! $request->user()->isAdmin()) {
            return redirect()->route('dashboard')->with('error', 'Akses ditolak. Halaman ini khusus untuk Administrator.');
        }

        // 1. User & Member Metrics
        $totalMembers = User::where('role', 'user')->count();
        $totalAdmins = User::where('role', 'admin')->count();
        $verifiedMembers = User::whereNotNull('email_verified_at')->count();
        $newMembersThisWeek = User::where('created_at', '>=', now()->subDays(7))->count();

        // Recent registered members with tier & points from DB
        $recentMembers = User::latest()
            ->take(25)
            ->get(['id', 'name', 'email', 'phone_number', 'address', 'role', 'points', 'lifetime_points', 'tier', 'email_verified_at', 'created_at'])
            ->map(function ($user) {
                $tier = $user->tier instanceof MemberTier
                    ? $user->tier
                    : MemberTier::calculate((int) $user->lifetime_points);

                return [
                    'id' => (string) $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone_number' => $user->phone_number ?? '-',
                    'address' => $user->address ?? '-',
                    'role' => $user->role instanceof UserRole ? $user->role->value : (string) $user->role,
                    'points' => (int) $user->points,
                    'lifetime_points' => (int) $user->lifetime_points,
                    'tier' => $tier->value,
                    'is_verified' => ! is_null($user->email_verified_at),
                    'joined_at' => $user->created_at?->format('d M Y, H:i') ?? '-',
                ];
            });

        // 2. Points & Activity Statistics
        $totalPointsCirculating = (int) User::sum('points');
        $totalLifetimePoints = (int) User::sum('lifetime_points');
        $totalPointsRedeemed = (int) PointExchange::where('status', 'claimed')->sum('points_cost');
        $totalActivitiesCount = Activity::where('is_active', true)->count();
        $totalScansAwarded = ActivityHistory::count();
        $todayScansAwarded = ActivityHistory::whereDate('created_at', today())->count();
        $todayPointsAwarded = (int) ActivityHistory::whereDate('created_at', today())->sum('points');

        // 3. Rewards & Exchanges Statistics
        $activeRewardsCount = Reward::where('is_active', true)->count();
        $totalExchangesCount = PointExchange::count();
        $pendingHoldClaims = PointExchange::where('status', 'hold')->count();
        $completedClaims = PointExchange::where('status', 'claimed')->count();

        $stats = [
            'totalMembers' => $totalMembers,
            'totalAdmins' => $totalAdmins,
            'verifiedRate' => ($totalMembers + $totalAdmins) > 0 ? round(($verifiedMembers / ($totalMembers + $totalAdmins)) * 100) : 100,
            'newMembersThisWeek' => $newMembersThisWeek,
            'totalPointsCirculating' => $totalPointsCirculating,
            'totalLifetimePoints' => $totalLifetimePoints,
            'totalPointsRedeemed' => $totalPointsRedeemed,
            'totalActivitiesCount' => $totalActivitiesCount,
            'totalScansAwarded' => $totalScansAwarded,
            'todayScansAwarded' => $todayScansAwarded,
            'todayPointsAwarded' => $todayPointsAwarded,
            'activeRewardsCount' => $activeRewardsCount,
            'totalExchangesCount' => $totalExchangesCount,
            'pendingHoldClaims' => $pendingHoldClaims,
            'completedClaims' => $completedClaims,
        ];

        // 4. Real Reward Claims Stream (PointExchange from DB)
        $recentClaims = PointExchange::with(['reward:id,name,image_url', 'admin:id,name'])
            ->latest('created_at')
            ->take(20)
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
                'user_phone' => $exchange->user_phone ?? '-',
                'user_address' => $exchange->user_address ?? '-',
                'status' => $exchange->status,
                'admin_name' => $exchange->admin?->name ?? 'Staf AHASS',
                'admin_notes' => $exchange->admin_notes ?? '',
                'time_ago' => $exchange->created_at?->diffForHumans() ?? '-',
                'created_at' => $exchange->created_at?->format('d M Y, H:i') ?? '-',
            ]);

        // 5. Real Scan / Point Award Transactions (ActivityHistory from DB)
        $recentScans = ActivityHistory::with(['admin:id,name'])
            ->latest('created_at')
            ->take(20)
            ->get()
            ->map(fn ($history) => [
                'id' => (string) $history->id,
                'activity_id' => (string) ($history->activity_id ?? '-'),
                'activity_name' => $history->activity_name,
                'points' => (int) $history->points,
                'user_id' => (string) $history->user_id,
                'user_name' => $history->user_name,
                'admin_name' => $history->admin?->name ?? 'Staf AHASS',
                'time_ago' => $history->created_at?->diffForHumans() ?? '-',
                'created_at' => $history->created_at?->format('d M Y, H:i') ?? '-',
            ]);

        // 6. Real Active Rewards Catalog (Reward from DB)
        $rewards = Reward::withCount(['exchanges as claimed_count' => fn ($q) => $q->where('status', 'claimed')])
            ->latest('created_at')
            ->take(20)
            ->get()
            ->map(fn ($reward) => [
                'id' => (string) $reward->id,
                'name' => $reward->name,
                'description' => $reward->description ?? '',
                'points_cost' => (int) $reward->points_cost,
                'stock' => (int) $reward->stock,
                'claimed_count' => (int) $reward->claimed_count,
                'is_active' => (bool) $reward->is_active,
                'image_url' => $reward->image_url ?? '',
                'created_at' => $reward->created_at?->format('d M Y') ?? '-',
            ]);

        // 7. Top Activity Usage (Aggregated from ActivityHistory DB)
        $topActivities = ActivityHistory::select('activity_name', DB::raw('count(*) as count'), DB::raw('sum(points) as total_points'))
            ->groupBy('activity_name')
            ->orderByDesc('count')
            ->take(5)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->activity_name,
                'count' => (int) $row->count,
                'total_points' => (int) $row->total_points,
            ]);

        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
            'recentMembers' => $recentMembers,
            'recentClaims' => $recentClaims,
            'recentScans' => $recentScans,
            'rewards' => $rewards,
            'topActivities' => $topActivities,
        ]);
    }
}
