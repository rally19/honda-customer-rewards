<?php

namespace App\Models;

use App\Concerns\HasTeams;
use App\Enums\MemberTier;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $phone_number
 * @property string|null $address
 * @property UserRole|string $role
 * @property int $points
 * @property int $lifetime_points
 * @property MemberTier|string $tier
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property int|null $current_team_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Team|null $currentTeam
 * @property-read Collection<int, Team> $ownedTeams
 * @property-read Collection<int, Membership> $teamMemberships
 * @property-read Collection<int, Team> $teams
 * @property-read Collection<int, ActivityHistory> $activityHistories
 */
#[Fillable(['name', 'email', 'password', 'role', 'current_team_id', 'phone_number', 'address', 'points', 'lifetime_points', 'tier'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasTeams, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * The data type of the primary key ID.
     *
     * @var string
     */
    protected $keyType = 'int';

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::creating(function (User $user) {
            if (empty($user->id)) {
                do {
                    $user->id = random_int(1000000000, 9999999999);
                } while (static::where('id', $user->id)->exists());
            }

            if (empty($user->role)) {
                $user->role = UserRole::User;
            }

            if (empty($user->tier)) {
                $user->tier = MemberTier::Bronze;
            }
        });
    }

    /**
     * Check if user has admin role.
     */
    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin || $this->role === 'admin';
    }

    /**
     * Check if user has regular user role.
     */
    public function isUser(): bool
    {
        return $this->role === UserRole::User || $this->role === 'user';
    }

    /**
     * Get the activity histories for the user.
     */
    public function activityHistories(): HasMany
    {
        return $this->hasMany(ActivityHistory::class);
    }

    /**
     * Award points to this user for an activity and update tier level.
     */
    public function awardPoints(Activity $activity, int $points, ?User $admin = null, ?string $notes = null): ActivityHistory
    {
        return DB::transaction(function () use ($activity, $points, $admin, $notes) {
            $this->points = (int) $this->points + $points;
            $this->lifetime_points = (int) $this->lifetime_points + $points;
            $this->tier = MemberTier::calculate($this->lifetime_points);
            $this->save();

            return ActivityHistory::create([
                'activity_id' => $activity->id,
                'activity_name' => $activity->name,
                'points' => $points,
                'user_id' => $this->id,
                'user_name' => $this->name,
                'user_email' => $this->email,
                'user_phone' => $this->phone_number,
                'user_address' => $this->address,
                'admin_id' => $admin?->id,
                'notes' => $notes,
            ]);
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'role' => UserRole::class,
            'tier' => MemberTier::class,
            'points' => 'integer',
            'lifetime_points' => 'integer',
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }
}
