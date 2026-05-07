import { config } from './config/index.js';
import { startBot, stopBot } from './bot/index.js';
import { startHealthServer } from './health/index.js';
import { db } from './database/service.js';
import { logger } from './utils/logger.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Initialize database schema
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const schema = readFileSync(join(__dirname, 'database', 'schema.sql'), 'utf-8');
db.exec(schema);

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Shutting down gracefully');
  try {
    await stopBot();
    db.checkpoint();
    db.close();
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Start services
async function main() {
  logger.info({ env: config.app.nodeEnv }, 'Starting Telegram Cloud Mirror Bot');

  startHealthServer();
  await startBot();

  logger.info('Bot is ready!');
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start bot');
  process.exit(1);
});
