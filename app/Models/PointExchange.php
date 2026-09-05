<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string|null $reward_id
 * @property string $reward_name
 * @property string|null $reward_image
 * @property int $points_cost
 * @property int $user_id
 * @property string $user_name
 * @property string $user_email
 * @property string|null $user_phone
 * @property string|null $user_address
 * @property string $status
 * @property int|null $admin_id
 * @property string|null $admin_notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Reward|null $reward
 * @property-read User $user
 * @property-read User|null $admin
 */
#[Fillable([
    'id',
    'reward_id',
    'reward_name',
    'reward_image',
    'points_cost',
    'user_id',
    'user_name',
    'user_email',
    'user_phone',
    'user_address',
    'status',
    'admin_id',
    'admin_notes',
])]
class PointExchange extends Model
{
    use HasFactory;

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
    protected $keyType = 'string';

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::creating(function (PointExchange $exchange) {
            if (empty($exchange->id)) {
                do {
                    $exchange->id = (string) random_int(1000000000, 9999999999);
                } while (static::where('id', $exchange->id)->exists());
            }

            if (empty($exchange->status)) {
                $exchange->status = 'hold';
            }
        });
    }

    /**
     * Get the associated reward.
     */
    public function reward(): BelongsTo
    {
        return $this->belongsTo(Reward::class);
    }

    /**
     * Get the user who made the exchange.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the admin who reviewed the exchange.
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    /**
     * Scope query to hold status.
     *
     * @param  Builder<PointExchange>  $query
     */
    public function scopeHold(Builder $query): void
    {
        $query->where('status', 'hold');
    }

    /**
     * Scope query to claimed status.
     *
     * @param  Builder<PointExchange>  $query
     */
    public function scopeClaimed(Builder $query): void
    {
        $query->where('status', 'claimed');
    }

    /**
     * Scope query to rejected status.
     *
     * @param  Builder<PointExchange>  $query
     */
    public function scopeRejected(Builder $query): void
    {
        $query->where('status', 'rejected');
    }

    /**
     * Scope query to cancelled status.
     *
     * @param  Builder<PointExchange>  $query
     */
    public function scopeCancelled(Builder $query): void
    {
        $query->where('status', 'cancelled');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'points_cost' => 'integer',
        ];
    }
}
