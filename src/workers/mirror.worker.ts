import { Job } from 'bullmq';
import { config } from '../config/index.js';
import { db } from '../database/service.js';
import { aria2cService } from '../services/aria2c.service.js';
import { rcloneService } from '../services/rclone.service.js';
import { progressService } from '../services/progress.service.js';
import { logger, createCorrelationLogger } from '../utils/logger.js';
import { DownloadError, TransferError } from '../utils/errors.js';
import { generateCorrelationId, sanitizeFilename } from '../utils/idempotency.js';
import { Job as JobType } from '../types/job.js';
import { rm } from 'fs/promises';
import { dirname } from 'path';

async function processJob(job: Job<JobType>): Promise<void> {
  const correlationId = generateCorrelationId();
  const log = createCorrelationLogger(correlationId);

  log.info({ jobId: job.data.id, userId: job.data.userId }, 'Processing job');

  const tempDir = `/tmp/mirrorbot/${job.data.id}`;
  let downloadGid: string | undefined;

  try {
    // Update job status to downloading
    db.prepare('UPDATE jobs SET status = "downloading", correlation_id = ? WHERE id = ?').run(
      correlationId,
      job.data.id
    );

    // Download stage
    log.info({ url: job.data.sourceUrl }, 'Starting download');
    downloadGid = await aria2cService.addUri(job.data.sourceUrl, {
      dir: tempDir,
      out: sanitizeFilename(job.data.filename),
      split: String(config.aria2c.split),
      'max-connection-per-server': String(config.aria2c.split),
      'min-split-size': config.aria2c.minSplitSize,
      continue: 'true',
    });

    // Poll download progress
    let downloadComplete = false;
    while (!downloadComplete) {
      const status = await aria2cService.getStatus(downloadGid);
      if (status.status === 'complete') {
        downloadComplete = true;
      } else if (status.status === 'error') {
        throw new DownloadError('Download failed');
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Update job status to uploading
    db.prepare('UPDATE jobs SET status = "uploading" WHERE id = ?').run(job.data.id);

    // Upload stage
    log.info({ destination: job.data.destination }, 'Starting upload');
    const jobId = await rcloneService.syncCopy({
      srcFs: tempDir,
      dstFs: job.data.destination,
      _async: true,
    });

    // Poll upload progress
    let uploadComplete = false;
    while (!uploadComplete) {
      const status = await rcloneService.getJobStatus(jobId);
      if (status.status === 'success') {
        uploadComplete = true;
      } else if (status.status === 'error') {
        throw new TransferError(status.error || 'Upload failed');
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Mark job as completed
    db.prepare('UPDATE jobs SET status = "completed", completed_at = datetime("now") WHERE id = ?').run(
      job.data.id
    );

    log.info({ jobId: job.data.id }, 'Job completed successfully');
  } catch (err) {
    log.error({ err, jobId: job.data.id }, 'Job failed');

    db.prepare('UPDATE jobs SET status = "failed", error_message = ? WHERE id = ?').run(
      err instanceof Error ? err.message : 'Unknown error',
      job.data.id
    );

    throw err;
  } finally {
    // Cleanup temp files
    try {
      await rm(tempDir, { recursive: true, force: true });
      await progressService.deleteProgress(job.data.id);
    } catch (cleanupErr) {
      log.warn({ cleanupErr }, 'Cleanup failed');
    }
  }
}

export const worker = createWorker(processJob);

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing worker');
  await worker.close();
  process.exit(0);
});
