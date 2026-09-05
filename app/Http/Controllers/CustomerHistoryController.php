<?php

namespace App\Http\Controllers;

use App\Enums\MemberTier;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerHistoryController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $tier = MemberTier::calculate((int) $user->lifetime_points);

        $search = $request->input('search');
        $period = $request->input('period', 'all');

        $query = $user->activityHistories()
            ->with(['admin:id,name'])
            ->latest('created_at');

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('activity_name', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('admin', function ($adminQ) use ($search) {
                        $adminQ->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($period === 'this_month') {
            $query->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year);
        } elseif ($period === 'last_3_months') {
            $query->where('created_at', '>=', now()->subMonths(3));
        } elseif ($period === 'this_year') {
            $query->whereYear('created_at', now()->year);
        }

        $paginated = $query->paginate(10)->withQueryString();

        $histories = [
            'data' => $paginated->getCollection()->map(fn ($h) => [
                'id' => (string) $h->id,
                'activity_id' => (string) $h->activity_id,
                'title' => $h->activity_name,
                'dealer' => $h->admin?->name ? 'AHASS (Petugas: '.$h->admin->name.')' : 'Bengkel AHASS Resmi',
                'admin_name' => $h->admin?->name ?? 'Staf Kasir AHASS',
                'points' => (int) $h->points,
                'type' => 'credit',
                'notes' => $h->notes,
                'date' => $h->created_at?->format('d M Y, H:i') ?? '-',
                'raw_date' => $h->created_at?->toIso8601String(),
            ])->all(),
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
            'links' => $paginated->linkCollection()->toArray(),
        ];

        $stats = [
            'currentPoints' => (int) $user->points,
            'lifetimePoints' => (int) $user->lifetime_points,
            'totalActivities' => (int) $user->activityHistories()->count(),
            'pointsThisMonth' => (int) $user->activityHistories()
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('points'),
            'tier' => $tier->value.' Member',
            'tierBadge' => strtoupper($tier->value),
        ];

        return Inertia::render('customer/history', [
            'histories' => $histories,
            'stats' => $stats,
            'filters' => [
                'search' => $search ?? '',
                'period' => $period,
            ],
            'memberId' => (string) $user->id,
        ]);
    }
}
