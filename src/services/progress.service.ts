import IORedis from 'ioredis';
import { config } from '../config/index.js';
import { DownloadProgress, TransferProgress } from '../types/progress.js';

const redis = new IORedis(config.redis.url, {
  password: config.redis.password,
  maxRetriesPerRequest: null,
});

const PROGRESS_PREFIX = 'progress:';
const JOB_TTL = 3600;

export const progressService = {
  async setDownloadProgress(jobId: string, progress: DownloadProgress): Promise<void> {
    await redis.setex(
      `${PROGRESS_PREFIX}download:${jobId}`,
      JOB_TTL,
      JSON.stringify(progress)
    );
  },

  async getDownloadProgress(jobId: string): Promise<DownloadProgress | null> {
    const data = await redis.get(`${PROGRESS_PREFIX}download:${jobId}`);
    return data ? JSON.parse(data) : null;
  },

  async setTransferProgress(jobId: string, progress: TransferProgress): Promise<void> {
    await redis.setex(
      `${PROGRESS_PREFIX}transfer:${jobId}`,
      JOB_TTL,
      JSON.stringify(progress)
    );
  },

  async getTransferProgress(jobId: string): Promise<TransferProgress | null> {
    const data = await redis.get(`${PROGRESS_PREFIX}transfer:${jobId}`);
    return data ? JSON.parse(data) : null;
  },

  async deleteProgress(jobId: string): Promise<void> {
    await redis.del(
      `${PROGRESS_PREFIX}download:${jobId}`,
      `${PROGRESS_PREFIX}transfer:${jobId}`
    );
  },

  async publishUpdate(jobId: string, data: unknown): Promise<void> {
    await redis.publish(`job-updates:${jobId}`, JSON.stringify(data));
  },
};
