<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\QrPointToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerQrPointController extends Controller
{
    /**
     * Claim or scan a QR Point token from customer scanner.
     */
    public function claim(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:255'],
        ]);

        $user = $request->user();
        $rawToken = trim($validated['token']);

        // Normalize token: extract HND-QP-... pattern if embedded in URL or JSON
        $tokenCode = $rawToken;
        if (preg_match('/(HND-QP-[A-Z0-9]+)/i', $rawToken, $matches)) {
            $tokenCode = strtoupper($matches[1]);
        }

        $qrToken = QrPointToken::where('token', $tokenCode)->first();

        if (! $qrToken) {
            return response()->json([
                'success' => false,
                'message' => 'Kode QR Poin tidak valid atau tidak ditemukan di sistem AHASS.',
            ], 422);
        }

        if ($qrToken->status === 'claimed') {
            return response()->json([
                'success' => false,
                'message' => 'QR Poin ini sudah pernah digunakan dan tidak dapat diklaim lagi.',
            ], 422);
        }

        if ($qrToken->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'QR Poin ini telah dibatalkan oleh kasir.',
            ], 422);
        }

        if ($qrToken->status === 'rejected') {
            return response()->json([
                'success' => false,
                'message' => 'Klaim untuk QR Poin ini telah ditolak.',
            ], 422);
        }

        if ($qrToken->isExpired() || $qrToken->status === 'expired') {
            $qrToken->update(['status' => 'expired']);
            $qrToken->regenerateNextToken();

            return response()->json([
                'success' => false,
                'message' => 'QR Poin ini telah kedaluwarsa. Silakan scan QR terbaru di layar kasir.',
            ], 422);
        }

        if ($qrToken->status === 'pending_confirmation') {
            if ($qrToken->scanned_by_user_id === $user->id) {
                return response()->json([
                    'success' => true,
                    'status' => 'pending_confirmation',
                    'activity_name' => $qrToken->activity_name,
                    'points' => (int) $qrToken->points,
                    'message' => 'QR Poin Anda sedang menunggu konfirmasi persetujuan kasir.',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'QR Poin ini sedang diproses untuk pelanggan lain.',
            ], 422);
        }

        if ($qrToken->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Status QR Poin tidak aktif.',
            ], 422);
        }

        // Case 1: Requires manual confirmation by the admin
        if ($qrToken->requires_manual_confirmation) {
            $qrToken->update([
                'status' => 'pending_confirmation',
                'scanned_by_user_id' => $user->id,
                'scanned_by_user_name' => $user->name,
                'scanned_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'status' => 'pending_confirmation',
                'activity_name' => $qrToken->activity_name,
                'points' => (int) $qrToken->points,
                'message' => 'QR Poin berhasil dipindai! Menunggu konfirmasi persetujuan dari kasir AHASS.',
            ]);
        }

        // Case 2: Instant automatic claiming & points awarding
        $activity = $qrToken->activity ?? Activity::find($qrToken->activity_id) ?? new Activity([
            'id' => $qrToken->activity_id ?? 'custom',
            'name' => $qrToken->activity_name,
            'points' => $qrToken->points,
        ]);

        $user->awardPoints(
            $activity,
            $qrToken->points,
            $qrToken->admin,
            $qrToken->notes ?? 'Klaim Mandiri via QR Poin AHASS'
        );

        $qrToken->update([
            'status' => 'claimed',
            'scanned_by_user_id' => $user->id,
            'scanned_by_user_name' => $user->name,
            'scanned_at' => now(),
            'claimed_at' => now(),
        ]);

        // Auto-regenerate next active token if enabled
        $qrToken->regenerateNextToken();

        $freshUser = $user->fresh();

        return response()->json([
            'success' => true,
            'status' => 'claimed',
            'activity_name' => $qrToken->activity_name,
            'points' => (int) $qrToken->points,
            'total_points' => (int) $freshUser->points,
            'tier' => (string) ($freshUser->tier?->value ?? $freshUser->tier ?? 'Bronze'),
            'message' => 'Selamat! '.$qrToken->points.' poin berhasil ditambahkan ke akun Anda.',
        ]);
    }
}
