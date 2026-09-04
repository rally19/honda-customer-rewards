<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\ActivityHistory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminActivityController extends Controller
{
    /**
     * Display activities management and history.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            return redirect()->route('dashboard')->with('error', 'Akses ditolak.');
        }

        $search = $request->query('search', '');
        $status = $request->query('status', 'all');

        $activitiesQuery = Activity::withCount('histories')->orderByDesc('created_at');

        if (! empty($search)) {
            $activitiesQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($status === 'active') {
            $activitiesQuery->where('is_active', true);
        } elseif ($status === 'inactive') {
            $activitiesQuery->where('is_active', false);
        }

        $activities = $activitiesQuery->get()->map(fn ($act) => [
            'id' => (string) $act->id,
            'name' => $act->name,
            'points' => (int) $act->points,
            'description' => $act->description ?? '',
            'is_active' => (bool) $act->is_active,
            'histories_count' => (int) $act->histories_count,
            'created_at' => $act->created_at?->format('d M Y, H:i') ?? '-',
        ]);

        // Activity Histories
        $historySearch = $request->query('history_search', '');
        $historyQuery = ActivityHistory::with(['admin:id,name'])->latest();

        if (! empty($historySearch)) {
            $historyQuery->where(function ($q) use ($historySearch) {
                $q->where('id', 'like', "%{$historySearch}%")
                    ->orWhere('activity_name', 'like', "%{$historySearch}%")
                    ->orWhere('user_name', 'like', "%{$historySearch}%")
                    ->orWhere('user_id', 'like', "%{$historySearch}%")
                    ->orWhere('user_email', 'like', "%{$historySearch}%")
                    ->orWhere('user_phone', 'like', "%{$historySearch}%");
            });
        }

        $histories = $historyQuery->paginate(15)->withQueryString()->through(fn ($h) => [
            'id' => (string) $h->id,
            'activity_id' => (string) ($h->activity_id ?? '-'),
            'activity_name' => $h->activity_name,
            'points' => (int) $h->points,
            'user_id' => (string) $h->user_id,
            'user_name' => $h->user_name,
            'user_email' => $h->user_email,
            'user_phone' => $h->user_phone ?? '-',
            'user_address' => $h->user_address ?? '-',
            'admin_name' => $h->admin?->name ?? 'Admin AHASS',
            'notes' => $h->notes ?? '-',
            'created_at' => $h->created_at?->format('d M Y, H:i') ?? '-',
        ]);

        $stats = [
            'totalActivities' => Activity::count(),
            'activeActivities' => Activity::where('is_active', true)->count(),
            'totalPointsAwarded' => (int) ActivityHistory::sum('points'),
            'totalTransactions' => ActivityHistory::count(),
        ];

        return Inertia::render('admin/activities/index', [
            'activities' => $activities,
            'histories' => $histories,
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'history_search' => $historySearch,
            ],
        ]);
    }

    /**
     * Store a new activity.
     */
    public function store(Request $request): RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            return redirect()->route('dashboard')->with('error', 'Akses ditolak.');
        }

        $validated = $request->validate([
            'id' => ['nullable', 'string', 'digits:10', 'unique:activities,id'],
            'name' => ['required', 'string', 'max:255'],
            'points' => ['required', 'integer', 'min:0', 'max:100000'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ]);

        $data = [
            'name' => $validated['name'],
            'points' => (int) $validated['points'],
            'description' => $validated['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ];

        if (! empty($validated['id'])) {
            $data['id'] = $validated['id'];
        }

        $activity = Activity::create($data);

        return back()->with('success', "Aktivitas '{$activity->name}' (ID: {$activity->id}) berhasil ditambahkan!");
    }

    /**
     * Update an existing activity.
     */
    public function update(Request $request, Activity $activity): RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            return redirect()->route('dashboard')->with('error', 'Akses ditolak.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'points' => ['required', 'integer', 'min:0', 'max:100000'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ]);

        $activity->update([
            'name' => $validated['name'],
            'points' => (int) $validated['points'],
            'description' => $validated['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', "Aktivitas '{$activity->name}' berhasil diperbarui!");
    }

    /**
     * Remove the specified activity.
     */
    public function destroy(Request $request, Activity $activity): RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            return redirect()->route('dashboard')->with('error', 'Akses ditolak.');
        }

        $name = $activity->name;
        $activity->delete();

        return back()->with('success', "Aktivitas '{$name}' berhasil dihapus.");
    }
}
