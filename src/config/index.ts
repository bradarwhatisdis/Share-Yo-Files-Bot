import { getEnv } from '../types/env.js';

export const config = {
  get env() {
    return getEnv();
  },
  get telegram() {
    const env = getEnv();
    return {
      botToken: env.TELEGRAM_BOT_TOKEN,
      webhookUrl: env.WEBHOOK_URL,
      webhookSecret: env.WEBHOOK_SECRET,
    };
  },
  get redis() {
    const env = getEnv();
    return {
      url: env.REDIS_URL,
      password: env.REDIS_PASSWORD || undefined,
    };
  },
  get aria2c() {
    const env = getEnv();
    return {
      rpcUrl: env.ARIA2C_RPC_URL,
      secret: env.ARIA2C_RPC_SECRET,
      maxConcurrent: env.ARIA2C_MAX_CONCURRENT,
      split: env.ARIA2C_SPLIT,
      minSplitSize: env.ARIA2C_MIN_SPLIT_SIZE,
    };
  },
  get rclone() {
    const env = getEnv();
    return {
      rcUrl: env.RCLONE_RC_URL,
      user: env.RCLONE_RC_USER,
      pass: env.RCLONE_RC_PASS,
    };
  },
  get database() {
    const env = getEnv();
    return {
      path: env.DB_PATH,
    };
  },
  get queue() {
    const env = getEnv();
    return {
      maxJobs: env.QUEUE_MAX_JOBS,
      removeOnComplete: env.QUEUE_REMOVE_ON_COMPLETE,
      removeOnFail: env.QUEUE_REMOVE_ON_FAIL,
    };
  },
  get app() {
    const env = getEnv();
    return {
      nodeEnv: env.NODE_ENV,
      logLevel: env.LOG_LEVEL,
      port: env.PORT,
      isProduction: env.NODE_ENV === 'production',
      isDevelopment: env.NODE_ENV === 'development',
    };
  },
  get quotas() {
    const env = getEnv();
    return {
      defaultDaily: env.DEFAULT_USER_QUOTA_DAILY,
      premiumDaily: env.PREMIUM_USER_QUOTA_DAILY,
    };
  },
  get rateLimit() {
    const env = getEnv();
    return {
      free: env.RATE_LIMIT_FREE,
      premium: env.RATE_LIMIT_PREMIUM,
      admin: env.RATE_LIMIT_ADMIN,
    };
  },
};
