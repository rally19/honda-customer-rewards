<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class QrPointToken extends Model
{
    use HasFactory, Prunable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'token',
        'activity_id',
        'activity_name',
        'points',
        'notes',
        'admin_id',
        'requires_manual_confirmation',
        'auto_regenerate',
        'duration_minutes',
        'status',
        'scanned_by_user_id',
        'scanned_by_user_name',
        'scanned_at',
        'claimed_at',
        'expires_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'points' => 'integer',
            'duration_minutes' => 'integer',
            'requires_manual_confirmation' => 'boolean',
            'auto_regenerate' => 'boolean',
            'scanned_at' => 'datetime',
            'claimed_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    /**
     * Determine the prunable query for background pruning of tokens expired more than 1 day.
     */
    public function prunable(): Builder
    {
        return static::where('expires_at', '<=', now()->subDay());
    }

    /**
     * Opportunistically prune tokens expired more than 1 day.
     */
    public static function pruneOldExpired(): int
    {
        return static::where('expires_at', '<=', now()->subDay())->delete();
    }

    /**
     * Generate a unique, recognizable, cryptographically secure token string.
     */
    public static function generateUniqueToken(): string
    {
        do {
            $token = 'HND-QP-'.strtoupper(Str::random(12));
        } while (static::where('token', $token)->exists());

        return $token;
    }

    /**
     * Check if the token has passed its expiration time.
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * The activity associated with this QR point token.
     */
    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    /**
     * The admin user who generated this token.
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    /**
     * Regenerate the next token if auto_regenerate is enabled and no active token exists.
     */
    public function regenerateNextToken(): ?self
    {
        if (! $this->auto_regenerate || ! $this->admin_id) {
            return null;
        }

        // Check if there is already an active or pending confirmation token for this admin
        $hasActive = static::where('admin_id', $this->admin_id)
            ->whereIn('status', ['active', 'pending_confirmation'])
            ->where('expires_at', '>', now())
            ->exists();

        if ($hasActive) {
            return null;
        }

        return static::create([
            'token' => static::generateUniqueToken(),
            'activity_id' => $this->activity_id,
            'activity_name' => $this->activity_name,
            'points' => $this->points,
            'notes' => $this->notes,
            'status' => 'active',
            'requires_manual_confirmation' => (bool) $this->requires_manual_confirmation,
            'auto_regenerate' => true,
            'duration_minutes' => $this->duration_minutes ?? 5,
            'admin_id' => $this->admin_id,
            'admin_name' => $this->admin_name,
            'expires_at' => now()->addMinutes($this->duration_minutes ?? 5),
        ]);
    }

    /**
     * The customer who scanned this token.
     */
    public function scannedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'scanned_by_user_id');
    }
}
