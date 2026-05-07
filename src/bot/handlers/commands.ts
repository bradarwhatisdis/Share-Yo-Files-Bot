import { MyContext } from '../../types/bot.js';
import { config } from '../../config/index.js';
import { db } from '../../database/service.js';
import { generateJobId, generateIdempotencyKey } from '../../utils/idempotency.js';
import { QuotaExceededError } from '../../utils/errors.js';
import { JobStatus } from '../../types/job.js';
import { addJobToQueue } from '../../services/queue.service.js';

export async function startCommand(ctx: MyContext) {
  const user = ctx.user!;
  await ctx.reply(
    `🤖 *Selamat datang di Telegram Cloud Mirror Bot!*\n\n` +
    `Halo, ${user.first_name || 'User'}!\n` +
    `Role: ${user.role}\n` +
    `Kuota harian: ${(user.quota_limit_daily / 1073741824).toFixed(0)}GB\n\n` +
    `Gunakan /mirror <url> untuk memulai mirroring file.`,
    { parse_mode: 'Markdown' }
  );
}

export async function mirrorCommand(ctx: MyContext) {
  const url = ctx.match;
  if (!url) {
    return ctx.reply('Gunakan: /mirror <url>\n\n' +
      'Didukung: HTTP/HTTPS, Magnet, Torrent, SourceForge');
  }

  const user = ctx.user!;
  const jobId = generateJobId();
  const idempotencyKey = generateIdempotencyKey(url, user.telegram_id, new Date().toISOString());

  const existingJob = db
    .prepare('SELECT * FROM jobs WHERE idempotency_key = ? AND status != "failed"')
    .get(idempotencyKey);

  if (existingJob) {
    return ctx.reply('Job dengan URL ini sudah ada. Gunakan /status untuk melihat status.');
  }

  const jobData = {
    id: jobId,
    userId: user.telegram_id,
    chatId: ctx.chat!.id,
    messageId: ctx.msg?.message_id,
    sourceUrl: url,
    idempotencyKey,
    filename: url.split('/').pop() || 'unknown',
    destination: 'gdrive:MirrorBot',
    status: 'pending' as JobStatus,
    progress: 0,
    attempts: 0,
  };

  await addJobToQueue(jobData);

  db.prepare(
    `INSERT INTO jobs (id, user_id, chat_id, message_id, source_url, idempotency_key, filename, destination, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    jobId,
    user.telegram_id,
    ctx.chat!.id,
    ctx.msg?.message_id,
    url,
    idempotencyKey,
    jobData.filename,
    jobData.destination,
    'pending'
  );

  await ctx.reply(
    `✅ Job ditambahkan ke antrean!\n\n` +
    `Job ID: \`${jobId}\`\n` +
    `URL: ${url}\n\n` +
    `Gunakan /status ${jobId} untuk melihat progres.`,
    { parse_mode: 'Markdown' }
  );
}

export async function statusCommand(ctx: MyContext) {
  const jobId = ctx.match;
  const userId = ctx.user!.telegram_id;

  if (jobId) {
    const job = db
      .prepare('SELECT * FROM jobs WHERE id = ? AND user_id = ?')
      .get(jobId, userId);

    if (!job) {
      return ctx.reply('Job tidak ditemukan.');
    }

    await ctx.reply(
      `📊 *Status Job*\n\n` +
      `ID: \`${job.id}\`\n` +
      `Status: ${job.status}\n` +
      `Progress: ${job.progress}%\n` +
      `File: ${job.filename}`,
      { parse_mode: 'Markdown' }
    );
  } else {
    const jobs = db
      .prepare('SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT 10')
      .all(userId);

    if (jobs.length === 0) {
      return ctx.reply('Belum ada job.');
    }

    const jobList = jobs
      .map(
        (j: any) => `- ${j.filename}: ${j.status} (${j.progress}%)`
      )
      .join('\n');

    await ctx.reply(`📋 *Job Terbaru*\n\n${jobList}`, {
      parse_mode: 'Markdown',
    });
  }
}

export async function cancelCommand(ctx: MyContext) {
  const jobId = ctx.match;
  if (!jobId) {
    return ctx.reply('Gunakan: /cancel <job_id>');
  }

  const job = db
    .prepare('SELECT * FROM jobs WHERE id = ? AND user_id = ?')
    .get(jobId, ctx.user!.telegram_id);

  if (!job) {
    return ctx.reply('Job tidak ditemukan.');
  }

  await db
    .prepare('UPDATE jobs SET status = "cancelled" WHERE id = ?')
    .run(jobId);

  await ctx.reply(`✅ Job ${jobId} dibatalkan.`);
}

export async function helpCommand(ctx: MyContext) {
  await ctx.reply(
    `📖 *Bantuan*\n\n` +
    `/start - Mulai bot\n` +
    `/mirror <url> - Mirror file ke cloud\n` +
    `/status [job_id] - Cek status job\n` +
    `/cancel <job_id> - Batalkan job\n` +
    `/quota - Cek kuota\n` +
    `/help - Bantuan ini\n\n` +
    `Didukung: HTTP/HTTPS, Magnet, Torrent`,
    { parse_mode: 'Markdown' }
  );
}

export async function quotaCommand(ctx: MyContext) {
  const user = ctx.user!;
  const today = new Date().toISOString().split('T')[0];
  const lastReset = user.last_quota_reset?.split('T')[0];

  if (lastReset !== today) {
    db.prepare('UPDATE users SET quota_used_today = 0, last_quota_reset = ? WHERE telegram_id = ?')
      .run(new Date().toISOString(), user.telegram_id);
    user.quota_used_today = 0;
  }

  const usedGB = (user.quota_used_today / 1073741824).toFixed(2);
  const limitGB = (user.quota_limit_daily / 1073741824).toFixed(0);

  await ctx.reply(
    `📊 *Kuota Harian*\n\n` +
    `Terpakai: ${usedGB}GB\n` +
    `Limit: ${limitGB}GB\n` +
    `Sisa: ${(Number(limitGB) - Number(usedGB)).toFixed(2)}GB`,
    { parse_mode: 'Markdown' }
  );
}
