// src/utils/rateLimitSignal.ts
// Pub/sub bridge between the axios interceptor (outside React) and
// the RateLimitBanner component (inside React).  Only one subscriber
// is expected — the banner mounts once at the app root.

type Handler = (retryAfterSeconds: number) => void;

let _handler: Handler | null = null;

/**
 * Subscribe to rate-limit events.  Returns an unsubscribe function.
 */
export function onRateLimitDetected(handler: Handler): () => void {
  _handler = handler;
  return () => {
    _handler = null;
  };
}

/**
 * Notify the subscriber that a 429 was received.
 * Called by the axios retry interceptor.
 */
export function notifyRateLimit(retryAfterSeconds: number): void {
  _handler?.(retryAfterSeconds);
}
