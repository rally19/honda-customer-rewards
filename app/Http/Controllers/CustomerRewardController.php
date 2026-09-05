<?php

namespace App\Http\Controllers;

use App\Enums\MemberTier;
use App\Models\PointExchange;
use App\Models\Reward;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

class CustomerRewardController extends Controller
{
    /**
     * Display the rewards catalog and user's claim history.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $tier = MemberTier::calculate((int) $user->lifetime_points);

        $today = now()->startOfDay();

        $rewards = Reward::where('is_active', true)
            ->where(function ($q) use ($today) {
                $q->whereNull('start_period')->orWhere('start_period', '<=', $today);
            })
            ->where(function ($q) use ($today) {
                $q->whereNull('end_period')->orWhere('end_period', '>=', $today);
            })
            ->orderBy('points_cost')
            ->get()
            ->map(fn ($r) => [
                'id' => (string) $r->id,
                'name' => $r->name,
                'description' => $r->description ?? '',
                'image_url' => $r->image_url ?? '',
                'points_cost' => (int) $r->points_cost,
                'stock' => (int) $r->stock,
                'start_period' => $r->start_period?->format('d M Y') ?? 'Sekarang',
                'end_period' => $r->end_period?->format('d M Y') ?? 'Tidak terbatas',
                'is_claimable' => (int) $r->stock > 0 && (int) $user->points >= (int) $r->points_cost,
                'can_afford' => (int) $user->points >= (int) $r->points_cost,
            ]);

        $myClaims = $user->pointExchanges()
            ->with(['reward:id,name,image_url', 'admin:id,name'])
            ->latest('created_at')
            ->get()
            ->map(fn ($c) => [
                'id' => (string) $c->id,
                'reward_id' => (string) ($c->reward_id ?? ''),
                'reward_name' => $c->reward_name,
                'reward_image' => $c->reward_image ?? $c->reward?->image_url ?? '',
                'points_cost' => (int) $c->points_cost,
                'status' => $c->status,
                'admin_name' => $c->admin?->name,
                'admin_notes' => $c->admin_notes,
                'date' => $c->created_at?->format('d M Y, H:i') ?? '-',
                'raw_date' => $c->created_at?->toIso8601String(),
            ]);

        $stats = [
            'currentPoints' => (int) $user->points,
            'lifetimePoints' => (int) $user->lifetime_points,
            'tier' => $tier->value.' Member',
            'tierBadge' => strtoupper($tier->value),
            'totalHold' => $user->pointExchanges()->where('status', 'hold')->count(),
            'totalClaimed' => $user->pointExchanges()->where('status', 'claimed')->count(),
        ];

        return Inertia::render('customer/rewards', [
            'rewards' => $rewards,
            'myClaims' => $myClaims,
            'stats' => $stats,
            'memberId' => (string) $user->id,
        ]);
    }

    /**
     * User initiates a reward claim.
     */
    public function claim(Request $request, Reward $reward): RedirectResponse
    {
        $user = $request->user();

        try {
            DB::transaction(function () use ($reward, $user) {
                // 1. Lock reward
                $lockedReward = Reward::where('id', $reward->id)->lockForUpdate()->firstOrFail();

                if (! $lockedReward->is_active) {
                    abort(422, 'Reward ini sedang tidak aktif.');
                }

                if ($lockedReward->stock <= 0) {
                    abort(422, 'Maaf, stok reward ini telah habis.');
                }

                $today = now()->startOfDay();
                if ($lockedReward->start_period && $today->lt($lockedReward->start_period)) {
                    abort(422, 'Periode penukaran reward ini belum dimulai.');
                }
                if ($lockedReward->end_period && $today->gt($lockedReward->end_period)) {
                    abort(422, 'Periode penukaran reward ini telah berakhir.');
                }

                // 2. Lock user
                $lockedUser = User::where('id', $user->id)->lockForUpdate()->firstOrFail();

                if ((int) $lockedUser->points < (int) $lockedReward->points_cost) {
                    abort(422, 'Poin Anda tidak mencukupi untuk menukarkan reward ini.');
                }

                // 3. Deduct active points and decrement stock (lifetime_points stays untouched!)
                $lockedUser->points = (int) $lockedUser->points - (int) $lockedReward->points_cost;
                $lockedUser->save();

                $lockedReward->stock = (int) $lockedReward->stock - 1;
                $lockedReward->save();

                // 4. Create Point Exchange record with status hold
                PointExchange::create([
                    'reward_id' => $lockedReward->id,
                    'reward_name' => $lockedReward->name,
                    'reward_image' => $lockedReward->image_url,
                    'points_cost' => (int) $lockedReward->points_cost,
                    'user_id' => $lockedUser->id,
                    'user_name' => $lockedUser->name,
                    'user_email' => $lockedUser->email,
                    'user_phone' => $lockedUser->phone_number,
                    'user_address' => $lockedUser->address,
                    'status' => 'hold',
                ]);
            });
        } catch (HttpException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', "Penukaran reward '{$reward->name}' berhasil! Status saat ini HOLD menunggu persetujuan admin. Anda dapat membatalkannya sebelum disetujui.");
    }

    /**
     * User cancels a hold reward claim.
     */
    public function cancel(Request $request, PointExchange $exchange): RedirectResponse
    {
        $user = $request->user();

        if ((string) $exchange->user_id !== (string) $user->id) {
            return back()->with('error', 'Akses tidak sah.');
        }

        if ($exchange->status !== 'hold') {
            return back()->with('error', 'Hanya penukaran dengan status HOLD yang dapat dibatalkan.');
        }

        DB::transaction(function () use ($exchange, $user) {
            // 1. Lock user and refund points
            $lockedUser = User::where('id', $user->id)->lockForUpdate()->firstOrFail();
            $lockedUser->points = (int) $lockedUser->points + (int) $exchange->points_cost;
            $lockedUser->save();

            // 2. Lock reward and restore stock
            if ($exchange->reward_id) {
                $lockedReward = Reward::where('id', $exchange->reward_id)->lockForUpdate()->first();
                if ($lockedReward) {
                    $lockedReward->stock = (int) $lockedReward->stock + 1;
                    $lockedReward->save();
                }
            }

            // 3. Mark exchange as cancelled
            $exchange->update([
                'status' => 'cancelled',
            ]);
        });

        return back()->with('success', "Klaim #{$exchange->id} dibatalkan. {$exchange->points_cost} poin telah dikembalikan ke saldo Anda.");
    }
}
