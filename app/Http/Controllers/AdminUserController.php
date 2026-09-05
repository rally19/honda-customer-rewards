<?php

namespace App\Http\Controllers;

use App\Enums\MemberTier;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminUserController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            return redirect()->route('dashboard')->with('error', 'Akses ditolak. Halaman ini khusus untuk Administrator.');
        }

        $search = $request->input('search');
        $role = $request->input('role');
        $status = $request->input('status');

        $query = User::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%");
            });
        }

        if ($role && in_array($role, ['user', 'admin'], true)) {
            $query->where('role', $role);
        }

        if ($status === 'verified') {
            $query->whereNotNull('email_verified_at');
        } elseif ($status === 'unverified') {
            $query->whereNull('email_verified_at');
        }

        $users = $query->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (User $user) => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone_number' => $user->phone_number ?? '-',
                'address' => $user->address ?? '-',
                'role' => $user->role instanceof UserRole ? $user->role->value : (string) $user->role,
                'is_verified' => ! is_null($user->email_verified_at),
                'points' => (int) $user->points,
                'lifetime_points' => (int) $user->lifetime_points,
                'tier' => $user->tier instanceof MemberTier ? $user->tier->value : (string) ($user->tier ?? 'Bronze'),
                'created_at' => $user->created_at?->format('d M Y, H:i') ?? '-',
            ]);

        $totalUsers = User::count();
        $totalAdmins = User::where('role', UserRole::Admin->value)->count();
        $totalRegularUsers = User::where('role', UserRole::User->value)->count();
        $totalVerified = User::whereNotNull('email_verified_at')->count();

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => [
                'search' => $search ?? '',
                'role' => $role ?? 'all',
                'status' => $status ?? 'all',
            ],
            'stats' => [
                'totalUsers' => $totalUsers,
                'totalAdmins' => $totalAdmins,
                'totalRegularUsers' => $totalRegularUsers,
                'totalVerified' => $totalVerified,
                'verifiedRate' => $totalUsers > 0 ? round(($totalVerified / $totalUsers) * 100) : 100,
            ],
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Akses ditolak. Halaman ini khusus untuk Administrator.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone_number' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],
            'role' => ['required', Rule::enum(UserRole::class)],
            'password' => ['required', 'string', 'min:8'],
            'is_verified' => ['nullable', 'boolean'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone_number' => $validated['phone_number'] ?? null,
            'address' => $validated['address'] ?? null,
            'role' => $validated['role'],
            'password' => $validated['password'],
        ]);

        if (! empty($validated['is_verified'])) {
            $user->markEmailAsVerified();
        }

        return back()->with('success', "Pengguna {$user->name} berhasil didaftarkan.");
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Akses ditolak. Halaman ini khusus untuk Administrator.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone_number' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],
            'role' => ['required', Rule::enum(UserRole::class)],
            'password' => ['nullable', 'string', 'min:8'],
            'is_verified' => ['nullable', 'boolean'],
        ]);

        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone_number' => $validated['phone_number'] ?? null,
            'address' => $validated['address'] ?? null,
            'role' => $validated['role'],
        ];

        if (! empty($validated['password'])) {
            $userData['password'] = $validated['password'];
        }

        $user->update($userData);

        if (array_key_exists('is_verified', $validated)) {
            if ($validated['is_verified'] && is_null($user->email_verified_at)) {
                $user->markEmailAsVerified();
            } elseif (! $validated['is_verified'] && ! is_null($user->email_verified_at)) {
                $user->forceFill(['email_verified_at' => null])->save();
            }
        }

        return back()->with('success', "Data pengguna {$user->name} berhasil diperbarui.");
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Akses ditolak. Halaman ini khusus untuk Administrator.');
        }

        if ($user->id === $request->user()->id) {
            return back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        $name = $user->name;
        $user->delete();

        return back()->with('success', "Pengguna {$name} berhasil dihapus dari sistem.");
    }
}
