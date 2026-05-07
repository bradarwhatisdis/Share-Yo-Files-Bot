import pino from 'pino';
import { config } from '../config/index.js';

const redactPaths = [
  '*.token',
  '*.secret',
  '*.password',
  '*.pass',
  'TELEGRAM_BOT_TOKEN',
  'ARIA2C_RPC_SECRET',
  'RCLONE_RC_PASS',
  'REDIS_PASSWORD',
];

export const logger = pino({
  level: config.app.logLevel,
  redact: redactPaths,
  transport: config.app.isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function createCorrelationLogger(correlationId: string) {
  return logger.child({ correlation_id: correlationId });
}
