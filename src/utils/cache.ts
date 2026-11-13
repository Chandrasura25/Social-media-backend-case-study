import { NextFunction, Request, Response } from 'express';
import { createClient } from 'redis';
import { config } from '../config';
import { AuthenticatedRequest } from './authMiddleware';

type Redis = ReturnType<typeof createClient>;

let client: Redis | null = null;
const PREFIX = 'cache:';

/** Connects to Redis if REDIS_URL is set. Without it, caching is simply skipped. */
export async function connectCache(): Promise<void> {
  if (!config.redisUrl) {
    console.log('REDIS_URL not set, response caching disabled');
    return;
  }
  const redis: Redis = createClient({ url: config.redisUrl });
  redis.on('error', (err) => console.error('Redis error:', err.message));
  await redis.connect();
  client = redis;
  console.log('Connected to Redis');
}

/**
 * Caches successful JSON responses.
 * `perUser` keys the cache by user id, so one user's personalised data is never served to another.
 */
export const cacheResponse =
  ({ perUser = false } = {}) =>
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!client?.isReady) return next();

    const key = PREFIX + (perUser ? `user:${req.user?.userId}:` : 'public:') + req.originalUrl;

    try {
      const cached = await client.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.status(200).json(JSON.parse(cached));
        return;
      }
    } catch (err) {
      console.error('Cache read failed:', (err as Error).message);
      return next();
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode === 200) {
        client?.setEx(key, config.cacheTtlSeconds, JSON.stringify(body)).catch(() => undefined);
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };
    next();
  };

/** Clears cached responses after a write so readers don't see stale posts, likes or comments. */
export async function invalidateCache(): Promise<void> {
  if (!client?.isReady) return;
  try {
    const keys: string[] = [];
    for await (const key of client.scanIterator({ MATCH: `${PREFIX}*`, COUNT: 100 })) {
      keys.push(key);
    }
    if (keys.length) await client.del(keys);
  } catch (err) {
    console.error('Cache invalidation failed:', (err as Error).message);
  }
}

export function invalidateAfterWrite(_req: Request, res: Response, next: NextFunction) {
  res.on('finish', () => {
    if (res.statusCode < 400) void invalidateCache();
  });
  next();
}
