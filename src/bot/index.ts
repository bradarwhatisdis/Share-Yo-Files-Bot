import { Bot, session } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import { ratelimiter } from '@grammyjs/ratelimiter';
import { config } from '../config/index.js';
import { MyContext } from '../types/bot.js';
import { authMiddleware } from './middleware/index.js';
import {
  startCommand,
  mirrorCommand,
  statusCommand,
  cancelCommand,
  helpCommand,
  quotaCommand,
} from './handlers/commands.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

export const bot = new Bot<MyContext>(config.telegram.botToken);

// Middleware
bot.use(session({ initial: () => ({}) }));
bot.use(conversations());
bot.use(ratelimiter({ timeFrame: 1000, limit: 3, onLimitExceeded: (ctx) => ctx.reply('Terlalu cepat! Tunggu sebentar.') }));

// Auth middleware
bot.use(authMiddleware);

// Commands
bot.command('start', startCommand);
bot.command('mirror', mirrorCommand);
bot.command('status', statusCommand);
bot.command('cancel', cancelCommand);
bot.command('help', helpCommand);
bot.command('quota', quotaCommand);

// Error handler
bot.catch((err) => {
  const ctx = err.ctx;
  const e = err.error;

  logger.error(
    { err: e, update: ctx.update },
    'Bot error occurred'
  );

  if (e instanceof AppError) {
    ctx.reply(e.message);
  } else {
    ctx.reply('Terjadi kesalahan sistem. Tim kami telah diberitahu.');
  }
});

export async function startBot() {
  if (config.telegram.webhookUrl) {
    await bot.api.setWebhook(config.telegram.webhookUrl);
    logger.info({ url: config.telegram.webhookUrl }, 'Webhook set');
  } else {
    await bot.start();
    logger.info('Bot started in long-polling mode');
  }
}

export async function stopBot() {
  await bot.stop();
  logger.info('Bot stopped');
}
