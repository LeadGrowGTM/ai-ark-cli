/**
 * Multi-tier token bucket rate limiter.
 * Enforces AI Ark's global rate limits: 5/sec, 300/min, 18K/hr.
 */

export interface RateLimitTier {
  maxTokens: number;
  refillRate: number;
  refillIntervalMs: number;
}

interface TierState {
  config: RateLimitTier;
  tokens: number;
  lastRefill: number;
}

const DEFAULT_TIERS: RateLimitTier[] = [
  { maxTokens: 5, refillRate: 5, refillIntervalMs: 1000 },
  { maxTokens: 300, refillRate: 300, refillIntervalMs: 60000 },
  { maxTokens: 18000, refillRate: 18000, refillIntervalMs: 3600000 },
];

export class RateLimiter {
  private tiers: TierState[];

  constructor(tiers: RateLimitTier[] = DEFAULT_TIERS) {
    const now = Date.now();
    this.tiers = tiers.map((config) => ({
      config,
      tokens: config.maxTokens,
      lastRefill: now,
    }));
  }

  /**
   * Acquire a token across all tiers. Waits if any tier is empty.
   * Refills elapsed tokens before checking availability.
   */
  async acquire(): Promise<void> {
    while (true) {
      const now = Date.now();
      this.refillAll(now);

      const emptyTier = this.tiers.find((t) => t.tokens < 1);
      if (!emptyTier) {
        // All tiers have tokens — consume one from each and proceed
        for (const tier of this.tiers) {
          tier.tokens -= 1;
        }
        return;
      }

      // Wait until the emptiest tier refills at least one token
      const waitMs = this.msUntilNextToken(emptyTier, now);
      await sleep(Math.max(waitMs, 1));
    }
  }

  private refillAll(now: number): void {
    for (const tier of this.tiers) {
      const elapsed = now - tier.lastRefill;
      if (elapsed >= tier.config.refillIntervalMs) {
        const intervals = Math.floor(elapsed / tier.config.refillIntervalMs);
        const refilled = intervals * tier.config.refillRate;
        tier.tokens = Math.min(tier.config.maxTokens, tier.tokens + refilled);
        tier.lastRefill += intervals * tier.config.refillIntervalMs;
      }
    }
  }

  private msUntilNextToken(tier: TierState, now: number): number {
    const elapsed = now - tier.lastRefill;
    return tier.config.refillIntervalMs - elapsed;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
