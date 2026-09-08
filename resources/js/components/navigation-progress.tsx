import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

/**
 * NavigationProgress
 *
 * Replaces Inertia's built-in progress bar with a full-screen blur overlay +
 * red spinner during page navigation.
 *
 * Elements that should stay visible (sidebars, topbars, bottom navs) must
 * have a z-index higher than the blur overlay (z-[70]).
 * Those elements already use z-40/z-50/sticky which won't be fully covered
 * because we push them above via CSS stacking context.
 */
export function NavigationProgress() {
    const [navigating, setNavigating] = useState(false);
    const [progress, setProgress] = useState(0);
    const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const startProgress = () => {
            setNavigating(true);
            setProgress(5);

            // Animate progress bar from 5 → 85 over ~1.2 s
            let current = 5;
            progressRef.current = setInterval(() => {
                current += Math.random() * 12 + 4;
                if (current >= 85) {
                    current = 85;
                    if (progressRef.current) clearInterval(progressRef.current);
                }
                setProgress(current);
            }, 120);
        };

        const finishProgress = () => {
            if (progressRef.current) clearInterval(progressRef.current);
            setProgress(100);
            timeoutRef.current = setTimeout(() => {
                setNavigating(false);
                setProgress(0);
            }, 320);
        };

        const unsubStart = router.on('start', startProgress);
        const unsubFinish = router.on('finish', finishProgress);

        return () => {
            unsubStart();
            unsubFinish();
            if (progressRef.current) clearInterval(progressRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    if (!navigating) return null;

    return (
        <>
            {/* ── Top progress bar ─────────────────────────────────────── */}
            <div
                className="pointer-events-none fixed top-0 left-0 z-[9999] h-[3px] bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.7)] transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Navigasi halaman"
            >
                {/* Glowing tip */}
                <span className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 translate-x-1/2 rounded-full bg-red-500 shadow-[0_0_12px_4px_rgba(220,38,38,0.6)]" />
            </div>

            {/* ── Full-page blur overlay ────────────────────────────────── */}
            <div
                className="pointer-events-none fixed inset-0 z-[55] bg-white/10 backdrop-blur-[3px] transition-opacity duration-200 dark:bg-zinc-950/10"
                aria-hidden="true"
            />

            {/* ── Centred spinner ───────────────────────────────────────── */}
            <div
                className="pointer-events-none fixed inset-0 z-[56] flex items-center justify-center"
                aria-hidden="true"
            >
                <div className="flex flex-col items-center gap-3">
                    <div className="relative flex h-14 w-14 items-center justify-center">
                        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-red-200 border-t-red-600 dark:border-zinc-700 dark:border-t-red-500" />
                        <div className="h-3 w-3 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)] dark:bg-red-500" />
                    </div>
                    <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold text-zinc-600 shadow-sm backdrop-blur-sm dark:bg-zinc-900/80 dark:text-zinc-300">
                        Memuat…
                    </span>
                </div>
            </div>
        </>
    );
}
