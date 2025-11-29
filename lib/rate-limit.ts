import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client if credentials are available
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "10 s"), // Default: 10 requests per 10 seconds
    analytics: true,
  });
}

// In-memory rate limiter fallback (for development or when Redis is not available)
class InMemoryRateLimit {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async limit(
    identifier: string
  ): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter((time) => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      const oldestRequest = validRequests[0];
      const reset = oldestRequest + this.windowMs;
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: Math.ceil((reset - now) / 1000),
      };
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - validRequests.length,
      reset: Math.ceil(this.windowMs / 1000),
    };
  }
}

// Create rate limiters for different endpoints
export const orderRateLimit = ratelimit
  ? ratelimit
  : new InMemoryRateLimit(5, 10000); // 5 orders per 10 seconds

export const apiRateLimit = ratelimit
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 requests per minute
      analytics: true,
    })
  : new InMemoryRateLimit(30, 60000); // 30 requests per minute

export const authRateLimit = ratelimit
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 auth attempts per minute
      analytics: true,
    })
  : new InMemoryRateLimit(5, 60000); // 5 auth attempts per minute

// Helper function to get client identifier
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (for production behind proxy)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";

  return ip;
}

// Rate limit middleware for API routes
export async function checkRateLimit(
  request: Request,
  limiter: Ratelimit | InMemoryRateLimit
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const identifier = getClientIdentifier(request);
  return await limiter.limit(identifier);
}
