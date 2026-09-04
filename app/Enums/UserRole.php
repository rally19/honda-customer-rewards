<?php

namespace App\Enums;

enum UserRole: string
{
    case User = 'user';
    case Admin = 'admin';

    /**
     * Get the display label for the role.
     */
    public function label(): string
    {
        return match ($this) {
            self::User => 'User',
            self::Admin => 'Admin',
        };
    }

    /**
     * Determine if the role is admin.
     */
    public function isAdmin(): bool
    {
        return $this === self::Admin;
    }

    /**
     * Determine if the role is regular user.
     */
    public function isUser(): bool
    {
        return $this === self::User;
    }
}
