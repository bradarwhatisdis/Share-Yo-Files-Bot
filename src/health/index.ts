import express from 'express';
import { config } from '../config/index.js';
import { db } from '../database/service.js';
import { aria2cService } from '../services/aria2c.service.js';
import { rcloneService } from '../services/rclone.service.js';
import { logger } from '../utils/logger.js';

const app = express();

app.get('/health', async (req, res) => {
  const checks = {
    database: false,
    redis: false,
    aria2c: false,
    rclone: false,
  };

  try {
    db.instance.prepare('SELECT 1').get();
    checks.database = true;
  } catch (err) {
    logger.error({ err }, 'Database health check failed');
  }

  try {
    const { createClient } = await import('ioredis');
    const redis = createClient(config.redis.url, { password: config.redis.password });
    await redis.ping();
    checks.redis = true;
    await redis.quit();
  } catch (err) {
    logger.error({ err }, 'Redis health check failed');
  }

  try {
    await aria2cService.getVersion();
    checks.aria2c = true;
  } catch (err) {
    logger.error({ err }, 'Aria2c health check failed');
  }

  try {
    await rcloneService.getStats();
    checks.rclone = true;
  } catch (err) {
    logger.error({ err }, 'Rclone health check failed');
  }

  const isHealthy = Object.values(checks).every(Boolean);
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  });
});

export function startHealthServer() {
  const port = config.app.port;
  app.listen(port, () => {
    logger.info({ port }, 'Health check server started');
  });
}
