import { z } from 'zod';

export const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'Telegram bot token is required'),
  WEBHOOK_URL: z.string().url().optional(),
  WEBHOOK_SECRET: z.string().optional(),

  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),

  ARIA2C_RPC_URL: z.string().url().default('ws://localhost:6800/jsonrpc'),
  ARIA2C_RPC_SECRET: z.string().min(1, 'Aria2c RPC secret is required'),
  ARIA2C_MAX_CONCURRENT: z.coerce.number().int().positive().default(5),
  ARIA2C_SPLIT: z.coerce.number().int().positive().default(16),
  ARIA2C_MIN_SPLIT_SIZE: z.string().default('10M'),

  RCLONE_RC_URL: z.string().url().default('http://localhost:5572'),
  RCLONE_RC_USER: z.string().min(1, 'Rclone RC user is required'),
  RCLONE_RC_PASS: z.string().min(1, 'Rclone RC password is required'),

  DB_PATH: z.string().default('./data/mirrorbot.db'),

  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  PORT: z.coerce.number().int().positive().default(3000),

  QUEUE_MAX_JOBS: z.coerce.number().int().positive().default(1000),
  QUEUE_REMOVE_ON_COMPLETE: z.coerce.number().int().min(0).default(100),
  QUEUE_REMOVE_ON_FAIL: z.coerce.number().int().min(0).default(50),

  DEFAULT_USER_QUOTA_DAILY: z.coerce.number().int().positive().default(10737418240),
  PREMIUM_USER_QUOTA_DAILY: z.coerce.number().int().positive().default(1099511627776),

  RATE_LIMIT_FREE: z.coerce.number().int().min(0).default(5),
  RATE_LIMIT_PREMIUM: z.coerce.number().int().min(0).default(50),
  RATE_LIMIT_ADMIN: z.coerce.number().int().min(0).default(0),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }
  return cachedEnv;
}
