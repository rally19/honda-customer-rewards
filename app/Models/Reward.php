<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $name
 * @property string|null $description
 * @property string|null $image_url
 * @property string|null $image
 * @property int $points_cost
 * @property int $stock
 * @property Carbon|null $start_period
 * @property Carbon|null $end_period
 * @property Carbon|null $start_date
 * @property Carbon|null $end_date
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'id',
    'name',
    'description',
    'image_url',
    'points_cost',
    'stock',
    'start_period',
    'end_period',
    'is_active',
])]
class Reward extends Model
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
        static::creating(function (Reward $reward) {
            if (empty($reward->id)) {
                do {
                    $reward->id = (string) random_int(1000000000, 9999999999);
                } while (static::where('id', $reward->id)->exists());
            }
        });
    }

    /**
     * Get the point exchanges for this reward.
     */
    public function exchanges(): HasMany
    {
        return $this->hasMany(PointExchange::class);
    }

    /**
     * Check if this reward is currently claimable.
     */
    public function isClaimable(): bool
    {
        if (! $this->is_active || $this->stock <= 0) {
            return false;
        }

        $today = now()->startOfDay();

        if ($this->start_period && $today->lt($this->start_period)) {
            return false;
        }

        if ($this->end_period && $today->gt($this->end_period)) {
            return false;
        }

        return true;
    }

    /**
     * Alias accessor/mutator for image and image_url.
     */
    protected function image(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->image_url,
            set: fn ($value) => ['image_url' => $value],
        );
    }

    /**
     * Alias accessor/mutator for start_date and start_period.
     */
    protected function startDate(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->start_period,
            set: fn ($value) => ['start_period' => $value],
        );
    }

    /**
     * Alias accessor/mutator for end_date and end_period.
     */
    protected function endDate(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->end_period,
            set: fn ($value) => ['end_period' => $value],
        );
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
            'stock' => 'integer',
            'start_period' => 'date',
            'end_period' => 'date',
            'is_active' => 'boolean',
        ];
    }
}
