<?php

namespace App\Enums;

enum MemberTier: string
{
    case Bronze = 'Bronze';
    case Silver = 'Silver';
    case Gold = 'Gold';
    case Platinum = 'Platinum';
    case Diamond = 'Diamond';

    /**
     * Calculate member tier based on lifetime accumulated points.
     */
    public static function calculate(int $lifetimePoints): self
    {
        return match (true) {
            $lifetimePoints >= 7000 => self::Diamond,
            $lifetimePoints >= 3500 => self::Platinum,
            $lifetimePoints >= 1500 => self::Gold,
            $lifetimePoints >= 500 => self::Silver,
            default => self::Bronze,
        };
    }

    /**
     * Minimum points required to reach this tier.
     */
    public function minPoints(): int
    {
        return match ($this) {
            self::Bronze => 0,
            self::Silver => 500,
            self::Gold => 1500,
            self::Platinum => 3500,
            self::Diamond => 7000,
        };
    }

    /**
     * Next tier in progression, if any.
     */
    public function nextTier(): ?self
    {
        return match ($this) {
            self::Bronze => self::Silver,
            self::Silver => self::Gold,
            self::Gold => self::Platinum,
            self::Platinum => self::Diamond,
            self::Diamond => null,
        };
    }

    /**
     * Points remaining until the next tier.
     */
    public function pointsToNextTier(int $lifetimePoints): ?int
    {
        $next = $this->nextTier();
        if (! $next) {
            return 0;
        }

        $needed = $next->minPoints() - $lifetimePoints;

        return max(0, $needed);
    }

    /**
     * Progress percentage toward the next tier (0 to 100).
     */
    public function progress(int $lifetimePoints): int
    {
        $next = $this->nextTier();
        if (! $next) {
            return 100;
        }

        $currentMin = $this->minPoints();
        $nextMin = $next->minPoints();
        $range = $nextMin - $currentMin;

        if ($range <= 0) {
            return 100;
        }

        $progressPoints = $lifetimePoints - $currentMin;
        $pct = round(($progressPoints / $range) * 100);

        return (int) min(100, max(0, $pct));
    }

    /**
     * Badge visual properties for frontend styling.
     *
     * @return array{badge: string, color: string, bg: string, border: string, text: string}
     */
    public function visualStyles(): array
    {
        return match ($this) {
            self::Bronze => [
                'badge' => 'BRONZE',
                'color' => '#B45309',
                'bg' => 'bg-amber-100 dark:bg-amber-950/40',
                'border' => 'border-amber-300 dark:border-amber-800',
                'text' => 'text-amber-800 dark:text-amber-300',
            ],
            self::Silver => [
                'badge' => 'SILVER',
                'color' => '#64748B',
                'bg' => 'bg-slate-100 dark:bg-slate-900/40',
                'border' => 'border-slate-300 dark:border-slate-700',
                'text' => 'text-slate-700 dark:text-slate-300',
            ],
            self::Gold => [
                'badge' => 'GOLD',
                'color' => '#D97706',
                'bg' => 'bg-yellow-100 dark:bg-yellow-950/40',
                'border' => 'border-yellow-400 dark:border-yellow-700',
                'text' => 'text-yellow-800 dark:text-yellow-300',
            ],
            self::Platinum => [
                'badge' => 'PLATINUM',
                'color' => '#0891B2',
                'bg' => 'bg-cyan-100 dark:bg-cyan-950/40',
                'border' => 'border-cyan-300 dark:border-cyan-700',
                'text' => 'text-cyan-800 dark:text-cyan-300',
            ],
            self::Diamond => [
                'badge' => 'DIAMOND',
                'color' => '#7C3AED',
                'bg' => 'bg-purple-100 dark:bg-purple-950/40',
                'border' => 'border-purple-300 dark:border-purple-700',
                'text' => 'text-purple-800 dark:text-purple-300',
            ],
        };
    }
}
