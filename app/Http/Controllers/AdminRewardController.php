<?php

namespace App\Http\Controllers;

use App\Models\PointExchange;
use App\Models\Reward;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminRewardController extends Controller
{
    /**
     * Display reward management and point exchange history.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            return redirect()->route('dashboard')->with('error', 'Akses ditolak. Khusus Administrator.');
        }

        $search = $request->query('search', '');
        $status = $request->query('status', 'all');

        $rewardsQuery = Reward::withCount('exchanges')->orderByDesc('created_at');

        if (! empty($search)) {
            $rewardsQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($status === 'active') {
            $rewardsQuery->where('is_active', true);
        } elseif ($status === 'inactive') {
            $rewardsQuery->where('is_active', false);
        }

        $rewards = $rewardsQuery->get()->map(fn ($r) => [
            'id' => (string) $r->id,
            'name' => $r->name,
            'description' => $r->description ?? '',
            'image_url' => $r->image_url ?? '',
            'points_cost' => (int) $r->points_cost,
            'stock' => (int) $r->stock,
            'start_period' => $r->start_period?->format('Y-m-d'),
            'end_period' => $r->end_period?->format('Y-m-d'),
            'start_period_formatted' => $r->start_period?->format('d M Y') ?? 'Sekarang',
            'end_period_formatted' => $r->end_period?->format('d M Y') ?? 'Tidak terbatas',
            'is_active' => (bool) $r->is_active,
            'is_claimable' => $r->isClaimable(),
            'exchanges_count' => (int) $r->exchanges_count,
            'created_at' => $r->created_at?->format('d M Y, H:i') ?? '-',
        ]);

        // Point Exchanges (Penukaran Poin)
        $exchangeSearch = $request->query('exchange_search', '');
        $exchangeStatus = $request->query('exchange_status', 'all');

        $exchangeQuery = PointExchange::with(['user:id,name,email,phone_number,address', 'admin:id,name', 'reward:id,name,image_url'])
            ->latest('created_at');

        if (! empty($exchangeSearch)) {
            $exchangeQuery->where(function ($q) use ($exchangeSearch) {
                $q->where('id', 'like', "%{$exchangeSearch}%")
                    ->orWhere('reward_name', 'like', "%{$exchangeSearch}%")
                    ->orWhere('user_name', 'like', "%{$exchangeSearch}%")
                    ->orWhere('user_id', 'like', "%{$exchangeSearch}%")
                    ->orWhere('user_email', 'like', "%{$exchangeSearch}%")
                    ->orWhere('user_phone', 'like', "%{$exchangeSearch}%");
            });
        }

        if (in_array($exchangeStatus, ['hold', 'claimed', 'rejected', 'cancelled'], true)) {
            $exchangeQuery->where('status', $exchangeStatus);
        }

        $exchanges = $exchangeQuery->paginate(15)->withQueryString()->through(fn ($ex) => [
            'id' => (string) $ex->id,
            'reward_id' => (string) ($ex->reward_id ?? '-'),
            'reward_name' => $ex->reward_name,
            'reward_image' => $ex->reward_image ?? $ex->reward?->image_url ?? '',
            'points_cost' => (int) $ex->points_cost,
            'user_id' => (string) $ex->user_id,
            'user_name' => $ex->user_name,
            'user_email' => $ex->user_email,
            'user_phone' => $ex->user_phone ?? '-',
            'user_address' => $ex->user_address ?? '-',
            'status' => $ex->status,
            'admin_name' => $ex->admin?->name ?? 'Staf AHASS',
            'admin_notes' => $ex->admin_notes ?? '',
            'created_at' => $ex->created_at?->format('d M Y, H:i') ?? '-',
            'raw_date' => $ex->created_at?->toIso8601String(),
        ]);

        $stats = [
            'totalRewards' => Reward::count(),
            'activeRewards' => Reward::where('is_active', true)->count(),
            'holdExchanges' => PointExchange::where('status', 'hold')->count(),
            'totalPointsExchanged' => (int) PointExchange::where('status', 'claimed')->sum('points_cost'),
        ];

        return Inertia::render('admin/rewards/index', [
            'rewards' => $rewards,
            'exchanges' => $exchanges,
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'exchange_search' => $exchangeSearch,
                'exchange_status' => $exchangeStatus,
            ],
        ]);
    }

    /**
     * Store a new reward.
     */
    public function store(Request $request): RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            return redirect()->route('dashboard')->with('error', 'Akses ditolak.');
        }

        $validated = $request->validate([
            'id' => ['nullable', 'string', 'digits:10', 'unique:rewards,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'points_cost' => ['required', 'integer', 'min:1', 'max:1000000'],
            'stock' => ['required', 'integer', 'min:0', 'max:1000000'],
            'start_period' => ['nullable', 'date'],
            'end_period' => ['nullable', 'date', 'after_or_equal:start_period'],
            'image_url' => ['nullable', 'string', 'max:500'],
            'image_file' => ['nullable', 'image', 'max:5120'],
            'is_active' => ['boolean'],
        ]);

        $imageUrl = $validated['image_url'] ?? null;
        if ($request->hasFile('image_file')) {
            $path = $request->file('image_file')->store('rewards', 'public');
            $imageUrl = '/storage/'.$path;
        }

        $data = [
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'points_cost' => (int) $validated['points_cost'],
            'stock' => (int) $validated['stock'],
            'start_period' => $validated['start_period'] ?? null,
            'end_period' => $validated['end_period'] ?? null,
            'image_url' => $imageUrl,
            'is_active' => $request->boolean('is_active', true),
        ];

        if (! empty($validated['id'])) {
            $data['id'] = $validated['id'];
        }

        $reward = Reward::create($data);

        return back()->with('success', "Reward '{$reward->name}' (ID: {$reward->id}) berhasil ditambahkan!");
    }

    /**
     * Update an existing reward.
     */
    public function update(Request $request, Reward $reward): RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            return redirect()->route('dashboard')->with('error', 'Akses ditolak.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'points_cost' => ['required', 'integer', 'min:1', 'max:1000000'],
            'stock' => ['required', 'integer', 'min:0', 'max:1000000'],
            'start_period' => ['nullable', 'date'],
            'end_period' => ['nullable', 'date', 'after_or_equal:start_period'],
            'image_url' => ['nullable', 'string', 'max:500'],
            'image_file' => ['nullable', 'image', 'max:5120'],
            'is_active' => ['boolean'],
        ]);

        $imageUrl = $reward->image_url;
        if ($request->hasFile('image_file')) {
            $path = $request->file('image_file')->store('rewards', 'public');
            $imageUrl = '/storage/'.$path;
        } elseif (array_key_exists('image_url', $validated)) {
            $imageUrl = $validated['image_url'];
        }

        $reward->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'points_cost' => (int) $validated['points_cost'],
            'stock' => (int) $validated['stock'],
            'start_period' => $validated['start_period'] ?? null,
            'end_period' => $validated['end_period'] ?? null,
            'image_url' => $imageUrl,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', "Reward '{$reward->name}' berhasil diperbarui!");
    }

    /**
     * Remove the specified reward.
     */
    public function destroy(Request $request, Reward $reward): RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            return redirect()->route('dashboard')->with('error', 'Akses ditolak.');
        }

        $name = $reward->name;
        $reward->delete();

        return back()->with('success', "Reward '{$name}' berhasil dihapus.");
    }

    /**
     * Approve a hold point exchange.
     */
    public function approve(Request $request, PointExchange $exchange): RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            return redirect()->route('dashboard')->with('error', 'Akses ditolak.');
        }

        if ($exchange->status !== 'hold') {
            return back()->with('error', 'Penukaran ini tidak dalam status hold.');
        }

        $validated = $request->validate([
            'admin_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $exchange->update([
            'status' => 'claimed',
            'admin_id' => $request->user()->id,
            'admin_notes' => $validated['admin_notes'] ?? 'Disetujui oleh admin AHASS.',
        ]);

        return back()->with('success', "Klaim reward #{$exchange->id} untuk member {$exchange->user_name} berhasil disetujui!");
    }

    /**
     * Reject a hold point exchange and refund points and stock.
     */
    public function reject(Request $request, PointExchange $exchange): RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            return redirect()->route('dashboard')->with('error', 'Akses ditolak.');
        }

        if ($exchange->status !== 'hold') {
            return back()->with('error', 'Penukaran ini tidak dalam status hold.');
        }

        $validated = $request->validate([
            'admin_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($exchange, $request, $validated) {
            // 1. Refund points to user
            $user = User::where('id', $exchange->user_id)->lockForUpdate()->first();
            if ($user) {
                $user->points = (int) $user->points + $exchange->points_cost;
                $user->save();
            }

            // 2. Restore stock to reward
            if ($exchange->reward_id) {
                $reward = Reward::where('id', $exchange->reward_id)->lockForUpdate()->first();
                if ($reward) {
                    $reward->stock = (int) $reward->stock + 1;
                    $reward->save();
                }
            }

            // 3. Mark exchange as rejected
            $exchange->update([
                'status' => 'rejected',
                'admin_id' => $request->user()->id,
                'admin_notes' => $validated['admin_notes'] ?? 'Ditolak oleh admin AHASS.',
            ]);
        });

        return back()->with('success', "Klaim reward #{$exchange->id} telah ditolak. Saldo {$exchange->points_cost} poin dan 1 stok telah dikembalikan.");
    }
}
