<?php

namespace App\Http\Middleware;

use App\Models\ActivityHistory;
use App\Models\PointExchange;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
            ],
            'notifications' => fn () => $user instanceof User ? $this->getUserNotifications($user) : [],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'currentTeam' => fn () => $user?->currentTeam ? $user->toUserTeam($user->currentTeam) : null,
            'teams' => fn () => $user?->toUserTeams(includeCurrent: true) ?? [],
        ];
    }

    /**
     * Get user recent activity and reward notifications for topbar dropdown.
     *
     * @return array<int, array{id: string, type: string, title: string, description: string, time: string, timestamp: int, link: string|null, points: int|null, status: string|null}>
     */
    protected function getUserNotifications(User $user): array
    {
        $activities = ActivityHistory::where('user_id', $user->id)
            ->latest('created_at')
            ->take(5)
            ->get()
            ->map(function (ActivityHistory $act) {
                $pts = (int) $act->points;
                $formattedPts = number_format($pts, 0, ',', '.');

                return [
                    'id' => 'act-'.$act->id,
                    'type' => 'activity',
                    'title' => "Poin Masuk: +{$formattedPts} Pts",
                    'description' => $act->activity_name.($act->notes ? " ({$act->notes})" : ''),
                    'time' => $act->created_at?->diffForHumans() ?? 'Baru saja',
                    'timestamp' => $act->created_at?->timestamp ?? 0,
                    'link' => '/activities',
                    'points' => $pts,
                    'status' => 'completed',
                ];
            });

        $rewards = PointExchange::where('user_id', $user->id)
            ->latest('created_at')
            ->take(5)
            ->get()
            ->map(function (PointExchange $exc) {
                $cost = (int) $exc->points_cost;
                $formattedCost = number_format($cost, 0, ',', '.');

                $title = match ($exc->status) {
                    'claimed' => 'Klaim Disetujui 🎉',
                    'rejected' => 'Klaim Ditolak',
                    'cancelled' => 'Klaim Dibatalkan',
                    default => 'Klaim Sedang Diproses',
                };

                $description = match ($exc->status) {
                    'claimed' => "Reward {$exc->reward_name} siap digunakan di AHASS/dealer.",
                    'rejected' => "Klaim {$exc->reward_name} ditolak. {$formattedCost} poin telah dikembalikan.",
                    'cancelled' => "Klaim {$exc->reward_name} dibatalkan. {$formattedCost} poin telah dikembalikan.",
                    default => "Permintaan klaim {$exc->reward_name} ({$formattedCost} Poin) menunggu konfirmasi.",
                };

                return [
                    'id' => 'reward-'.$exc->id,
                    'type' => 'reward',
                    'title' => $title,
                    'description' => $description,
                    'time' => $exc->created_at?->diffForHumans() ?? 'Baru saja',
                    'timestamp' => $exc->created_at?->timestamp ?? 0,
                    'link' => '/rewards',
                    'points' => -$cost,
                    'status' => $exc->status,
                ];
            });

        $events = collect([...$activities, ...$rewards])
            ->sortByDesc('timestamp')
            ->values();

        $eventCount = $events->count();

        $welcomeItem = [
            'id' => 'welcome-rewards',
            'type' => 'welcome',
            'title' => '🎉 Selamat Datang di Rewards!',
            'description' => 'ID MEMBER Anda telah aktif. Tunjukkan ID saat servis di AHASS atau kepada staff untuk kumpulkan poin.',
            'time' => $user->created_at?->diffForHumans() ?? 'Baru saja',
            'timestamp' => $user->created_at?->timestamp ?? 0,
            'link' => null,
            'points' => null,
            'status' => null,
        ];

        // Jika masih 1-4 pesan (atau 0 pesan), sisakan untuk pesan sambutan ini
        if ($eventCount < 5) {
            return $events->take(4)->push($welcomeItem)->all();
        }

        // Jika sudah 5 atau lebih pesan aktivitas/reward, ambil 5 pesan terakhir
        return $events->take(5)->all();
    }
}
