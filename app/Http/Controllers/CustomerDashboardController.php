<?php

namespace App\Http\Controllers;

use App\Enums\MemberTier;
use App\Models\Activity;
use App\Models\PointExchange;
use App\Models\Reward;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $tier = MemberTier::calculate((int) $user->lifetime_points);

        $earningActivities = Activity::where('is_active', true)
            ->orderBy('id')
            ->get(['id', 'name', 'points', 'description'])
            ->map(fn (Activity $a) => [
                'id' => (string) $a->id,
                'name' => $a->name,
                'points' => (int) $a->points,
                'description' => $a->description ?? '',
            ])
            ->all();

        $realHistories = $user->activityHistories()
            ->with(['admin:id,name'])
            ->latest('created_at')
            ->take(3)
            ->get()
            ->map(fn ($h) => [
                'id' => (string) $h->id,
                'title' => $h->activity_name,
                'dealer' => $h->admin?->name ? 'AHASS (Petugas: '.$h->admin->name.')' : 'Bengkel AHASS Resmi',
                'points' => (int) $h->points,
                'type' => 'credit',
                'date' => $h->created_at?->format('d M Y, H:i') ?? '-',
            ])->toArray();

        $dummyFallbackTransactions = [
            [
                'id' => 'tx-welcome',
                'title' => 'Bonus Selamat Datang Member Honda',
                'dealer' => 'Sistem Honda Customer Rewards',
                'points' => 50,
                'type' => 'credit',
                'date' => $user->created_at?->format('d M Y, H:i') ?? 'Baru saja',
            ],
        ];

        $transactions = ! empty($realHistories) ? $realHistories : $dummyFallbackTransactions;

        $today = now()->startOfDay();
        $rewards = Reward::where('is_active', true)
            ->where(function ($q) use ($today) {
                $q->whereNull('start_period')->orWhere('start_period', '<=', $today);
            })
            ->where(function ($q) use ($today) {
                $q->whereNull('end_period')->orWhere('end_period', '>=', $today);
            })
            ->orderBy('points_cost')
            ->get(['id', 'name', 'description', 'image_url', 'points_cost', 'stock'])
            ->map(fn (Reward $r) => [
                'id' => (string) $r->id,
                'name' => $r->name,
                'description' => $r->description ?? '',
                'image_url' => $r->image_url ?? '',
                'image' => $r->image_url ?? '',
                'points_cost' => (int) $r->points_cost,
                'pointsCost' => (int) $r->points_cost,
                'stock' => (int) $r->stock,
                'can_afford' => (int) $user->points >= (int) $r->points_cost,
            ])
            ->all();

        $rewardExchanges = $user->pointExchanges()
            ->with(['reward:id,name,image_url', 'admin:id,name'])
            ->latest('created_at')
            ->take(3)
            ->get()
            ->map(fn (PointExchange $c) => [
                'id' => (string) $c->id,
                'reward_id' => (string) ($c->reward_id ?? ''),
                'title' => $c->reward_name,
                'reward_name' => $c->reward_name,
                'reward_image' => $c->reward_image ?? $c->reward?->image_url ?? '',
                'points_cost' => (int) $c->points_cost,
                'status' => $c->status,
                'status_label' => match ($c->status) {
                    'claimed' => 'Disetujui',
                    'hold' => 'Diproses',
                    'rejected' => 'Ditolak',
                    'cancelled' => 'Dibatalkan',
                    default => ucfirst($c->status),
                },
                'date' => $c->created_at?->format('d M Y, H:i') ?? '-',
            ])
            ->all();

        $loyaltyData = [
            'memberId' => (string) $user->id,
            'tier' => $tier->value.' Member',
            'tierBadge' => strtoupper($tier->value),
            'tierLevel' => $tier->value,
            'nextTier' => $tier->nextTier() ? $tier->nextTier()->value.' Member' : 'Maksimal',
            'points' => (int) $user->points,
            'lifetimePoints' => (int) $user->lifetime_points,
            'pointsToNextTier' => $tier->pointsToNextTier((int) $user->lifetime_points),
            'tierProgress' => $tier->progress((int) $user->lifetime_points),
            'tierRoadmap' => MemberTier::roadmap((int) $user->lifetime_points),
            'vouchers' => [],
            'rewards' => $rewards,
            'rewardExchanges' => $rewardExchanges,
            'transactions' => $transactions,
            'raffleTickets' => [],
            'earningActivities' => $earningActivities,
        ];

        return Inertia::render('customer/dashboard', [
            'loyalty' => $loyaltyData,
            'earningActivities' => $earningActivities,
            'rewards' => $rewards,
            'rewardExchanges' => $rewardExchanges,
        ]);
    }
}
