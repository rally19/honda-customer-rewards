<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string|null $activity_id
 * @property string $activity_name
 * @property int $points
 * @property int $user_id
 * @property string $user_name
 * @property string $user_email
 * @property string|null $user_phone
 * @property string|null $user_address
 * @property int|null $admin_id
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 * @property-read Activity|null $activity
 * @property-read User|null $admin
 */
#[Fillable([
    'id',
    'activity_id',
    'activity_name',
    'points',
    'user_id',
    'user_name',
    'user_email',
    'user_phone',
    'user_address',
    'admin_id',
    'notes',
])]
class ActivityHistory extends Model
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
        static::creating(function (ActivityHistory $history) {
            if (empty($history->id)) {
                do {
                    $history->id = (string) random_int(1000000000, 9999999999);
                } while (static::where('id', $history->id)->exists());
            }
        });
    }

    /**
     * Get the user that received the points.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the activity reference.
     */
    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    /**
     * Get the admin that recorded the activity.
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'points' => 'integer',
        ];
    }
}
