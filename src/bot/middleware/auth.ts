import { MyContext } from '../../types/bot.js';
import { User } from '../../types/user.js';
import { db } from '../../database/service.js';
import { UnauthorizedError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export async function authMiddleware(ctx: MyContext, next: () => Promise<void>) {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    throw new UnauthorizedError('User ID not found');
  }

  let user = db
    .prepare<User>('SELECT * FROM users WHERE telegram_id = ?')
    .get(telegramId);

  if (!user) {
    const insertUser = db.prepare(`
      INSERT INTO users (telegram_id, username, first_name, last_name)
      VALUES (?, ?, ?, ?)
    `);
    insertUser.run(
      telegramId,
      ctx.from?.username,
      ctx.from?.first_name,
      ctx.from?.last_name
    );
    user = db
      .prepare<User>('SELECT * FROM users WHERE telegram_id = ?')
      .get(telegramId);
  }

  if (!user) {
    throw new UnauthorizedError();
  }

  ctx.user = user;

  logger.info(
    { userId: telegramId, username: user.username, role: user.role },
    'User authenticated'
  );

  await next();
}
