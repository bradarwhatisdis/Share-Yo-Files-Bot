import { MyContext } from '../../types/bot.js';
import { config } from '../../config/index.js';
import { db } from '../../database/service.js';
import { RateLimitError } from '../../utils/errors.js';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export async function rateLimitMiddleware(ctx: MyContext, next: () => Promise<void>) {
  if (!ctx.user) {
    return next();
  }

  const user = ctx.user;
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;

  let limit: number;
  switch (user.role) {
    case 'admin':
      limit = config.rateLimit.admin === 0 ? Infinity : config.rateLimit.admin;
      break;
    case 'premium':
      limit = config.rateLimit.premium;
      break;
    default:
      limit = config.rateLimit.free;
  }

  if (limit === Infinity) {
    return next();
  }

  const key = `rate_limit:${user.telegram_id}:${Math.floor(now / hourMs)}`;
  const redis = new (await import('ioredis')).default(config.redis.url, {
    password: config.redis.password,
    maxRetriesPerRequest: null,
  });

  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, 3600);
    }

    if (current > limit) {
      throw new RateLimitError(
        `Terlalu banyak permintaan. Batas: ${limit} per jam`
      );
    }
  } finally {
    await redis.quit();
  }

  await next();
}
