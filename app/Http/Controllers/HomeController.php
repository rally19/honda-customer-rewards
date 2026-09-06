<?php

namespace App\Http\Controllers;

use App\Enums\MemberTier;
use App\Models\Activity;
use App\Models\Reward;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * Handle the incoming request to display the homepage with real database data.
     */
    public function __invoke(Request $request): Response
    {
        $today = now()->startOfDay();

        // 1. All active activities from database
        $allActiveActivities = Activity::query()
            ->where('is_active', true)
            ->orderBy('points', 'desc')
            ->get(['id', 'name', 'points', 'description']);

        $totalActivitiesCount = $allActiveActivities->count();

        // Top 6 activities for homepage showcase
        $topActivities = $allActiveActivities
            ->take(6)
            ->map(fn (Activity $a) => [
                'id' => (string) $a->id,
                'name' => $a->name,
                'points' => (int) $a->points,
                'description' => $a->description ?? '',
            ])
            ->values()
            ->all();

        // 2. All active rewards from database with active dates
        $allActiveRewards = Reward::query()
            ->where('is_active', true)
            ->where(function ($q) use ($today) {
                $q->whereNull('start_period')->orWhere('start_period', '<=', $today);
            })
            ->where(function ($q) use ($today) {
                $q->whereNull('end_period')->orWhere('end_period', '>=', $today);
            })
            ->orderBy('points_cost', 'asc')
            ->get(['id', 'name', 'description', 'image_url', 'points_cost', 'stock']);

        $totalRewardsCount = $allActiveRewards->count();

        // Top 6 rewards for homepage showcase
        $topRewards = $allActiveRewards
            ->take(6)
            ->map(fn (Reward $r) => [
                'id' => (string) $r->id,
                'name' => $r->name,
                'description' => $r->description ?? '',
                'image' => $r->image_url ?: '/images/pictures/voucher_service_img.jpg',
                'points' => (int) $r->points_cost,
                'stock' => (int) $r->stock,
            ])
            ->values()
            ->all();

        // 3. System statistics
        $totalMembers = User::query()->where('role', 'user')->count();
        $totalLifetimePoints = (int) User::query()->sum('lifetime_points');

        $stats = [
            'totalMembers' => $totalMembers,
            'totalActivities' => $totalActivitiesCount,
            'totalRewards' => $totalRewardsCount,
            'totalPointsCirculated' => $totalLifetimePoints,
        ];

        // 4. Official 5 Member Tiers from MemberTier enum
        $tiers = array_map(fn (MemberTier $tier) => [
            'tier' => $tier->value,
            'name' => $tier->value.' Member',
            'minPoints' => $tier->minPoints(),
            'maxPoints' => $tier->maxPoints(),
            'benefit' => $tier->benefits(),
            'visualStyles' => $tier->visualStyles(),
        ], MemberTier::cases());

        // 5. Active activities for interactive simulation calculator
        $simulationActivities = $allActiveActivities
            ->map(fn (Activity $a) => [
                'id' => (string) $a->id,
                'name' => $a->name,
                'points' => (int) $a->points,
            ])
            ->values()
            ->all();

        return Inertia::render('welcome', [
            'activities' => $topActivities,
            'totalActivitiesCount' => $totalActivitiesCount,
            'rewards' => $topRewards,
            'totalRewardsCount' => $totalRewardsCount,
            'stats' => $stats,
            'tiers' => $tiers,
            'simulationActivities' => $simulationActivities,
        ]);
    }
}
