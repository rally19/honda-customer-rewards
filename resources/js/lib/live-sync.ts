/**
 * Cross-tab and real-time live synchronization service using modern BroadcastChannel API
 * with fallback for seamless multi-tab reactivity across Admin and Customer views.
 */

export type LiveEventType =
    | 'POINTS_AWARDED'
    | 'REWARD_CLAIMED'
    | 'CLAIM_STATUS_UPDATED'
    | 'ACTIVITY_MUTATED'
    | 'MEMBER_MUTATED'
    | 'FORCE_SYNC';

export interface LiveEvent<T = Record<string, unknown>> {
    type: LiveEventType;
    payload?: T;
    timestamp: number;
    sourceId: string;
}

const CHANNEL_NAME = 'honda_customer_rewards_live_channel';
const INSTANCE_ID = Math.random().toString(36).substring(2, 9);

let channel: BroadcastChannel | null = null;
const listeners = new Set<(event: LiveEvent) => void>();

function getChannel(): BroadcastChannel | null {
    if (typeof window === 'undefined') return null;

    if (!channel && 'BroadcastChannel' in window) {
        try {
            channel = new BroadcastChannel(CHANNEL_NAME);
            channel.onmessage = (event: MessageEvent<LiveEvent>) => {
                if (!event.data || event.data.sourceId === INSTANCE_ID) return;
                listeners.forEach((listener) => {
                    try {
                        listener(event.data);
                    } catch (e) {
                        console.error('Error in live event listener:', e);
                    }
                });
            };
        } catch (e) {
            console.warn('BroadcastChannel not supported or blocked:', e);
        }
    }

    return channel;
}

/**
 * Broadcasts a live mutation event to all other open tabs/windows.
 */
export function broadcastLiveEvent<T = Record<string, unknown>>(
    type: LiveEventType,
    payload?: T,
): void {
    if (typeof window === 'undefined') return;

    const event: LiveEvent<T> = {
        type,
        payload,
        timestamp: Date.now(),
        sourceId: INSTANCE_ID,
    };

    const chan = getChannel();
    if (chan) {
        try {
            chan.postMessage(event);
        } catch (e) {
            console.warn('Failed to postMessage to BroadcastChannel:', e);
        }
    }

    // Fallback via localStorage storage event for older browser engines
    try {
        localStorage.setItem(
            'honda_rewards_live_ping',
            JSON.stringify({ ...event, _t: Date.now() }),
        );
    } catch {
        // Ignore localStorage quota or private browsing errors
    }
}

/**
 * Subscribes to live events coming from other tabs/windows.
 */
export function subscribeLiveEvent(
    callback: (event: LiveEvent) => void,
): () => void {
    if (typeof window === 'undefined') return () => {};

    // Ensure channel is initialized
    getChannel();
    listeners.add(callback);

    // Also listen to storage events as a fallback
    const storageHandler = (e: StorageEvent) => {
        if (e.key !== 'honda_rewards_live_ping' || !e.newValue) return;
        try {
            const data: LiveEvent = JSON.parse(e.newValue);
            if (data.sourceId !== INSTANCE_ID) {
                callback(data);
            }
        } catch {
            // Ignore parse errors
        }
    };

    window.addEventListener('storage', storageHandler);

    return () => {
        listeners.delete(callback);
        window.removeEventListener('storage', storageHandler);
    };
}
