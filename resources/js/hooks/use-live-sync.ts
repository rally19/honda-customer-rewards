import { router, usePoll } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { type LiveEvent, subscribeLiveEvent } from '@/lib/live-sync';

export interface UseLiveSyncOptions {
    /**
     * Polling interval in milliseconds. Defaults to 3500ms (3.5 seconds).
     */
    interval?: number;
    /**
     * Scope partial reload to specific keys. If omitted, reloads all props.
     */
    only?: string[];
    /**
     * Callback when a live event is received.
     */
    onEvent?: (event: LiveEvent) => void;
    /**
     * Whether polling is enabled. Defaults to true.
     */
    enabled?: boolean;
}

/**
 * Hook to make any Inertia page fully live and reactive in real time.
 * Combines periodic background polling with instant 0ms cross-tab event reactivity.
 */
export function useLiveSync(options: UseLiveSyncOptions = {}) {
    const {
        interval = 3500,
        only,
        onEvent,
        enabled = true,
    } = options;

    const lastReloadRef = useRef<number>(0);
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;

    // Periodic background sync using Inertia v3 native usePoll
    usePoll(
        enabled ? interval : 0,
        {
            preserveScroll: true,
            preserveState: true,
            showProgress: false,
            only: only && only.length > 0 ? only : undefined,
        } as any,
        {
            autoStart: enabled,
            keepAlive: false, // Automatically throttles when browser tab is inactive/hidden
        },
    );

    // Instant cross-tab sync via BroadcastChannel
    useEffect(() => {
        if (!enabled) return;

        const unsubscribe = subscribeLiveEvent((event) => {
            // Debounce rapid events within 400ms
            const now = Date.now();
            if (now - lastReloadRef.current < 400) return;
            lastReloadRef.current = now;

            if (onEventRef.current) {
                try {
                    onEventRef.current(event);
                } catch (e) {
                    console.error('Error in onEvent callback:', e);
                }
            }

            router.reload({
                preserveScroll: true,
                preserveState: true,
                showProgress: false,
                only: only && only.length > 0 ? only : undefined,
            } as any);
        });

        return () => {
            unsubscribe();
        };
    }, [enabled, only]);
}
