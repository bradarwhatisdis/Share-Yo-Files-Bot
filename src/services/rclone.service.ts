import axios, { AxiosInstance } from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { TransferError } from '../utils/errors.js';
import { RcloneCopyUrlOptions, RcloneSyncCopyOptions, RcloneJob, RcloneAbout } from '../types/rclone.js';

export class RcloneService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.rclone.rcUrl,
      auth: {
        username: config.rclone.user,
        password: config.rclone.pass,
      },
      timeout: 30000,
    });
  }

  async request<T>(endpoint: string, method: 'GET' | 'POST' = 'POST', data?: unknown): Promise<T> {
    try {
      const response = await this.client.request<T>({
        method,
        url: endpoint,
        data,
      });
      return response.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new TransferError(`Rclone API error (${endpoint}): ${message}`);
    }
  }

  async copyUrl(options: RcloneCopyUrlOptions): Promise<number> {
    const response = await this.request<{ jobid: number }>('operations/copyurl', 'POST', options);
    logger.info({ jobId: response.jobid }, 'Rclone copyurl started');
    return response.jobid;
  }

  async syncCopy(options: RcloneSyncCopyOptions): Promise<number> {
    const response = await this.request<{ jobid: number }>('sync/copy', 'POST', options);
    logger.info({ jobId: response.jobid }, 'Rclone synccopy started');
    return response.jobid;
  }

  async getJobStatus(jobId: number): Promise<RcloneJob> {
    const response = await this.request<{ status: RcloneJob }>(`job/status`, 'POST', { jobid: jobId });
    return response.status;
  }

  async getStats(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('core/stats', 'POST');
  }

  async getAbout(remote: string): Promise<RcloneAbout> {
    return this.request<RcloneAbout>('operations/about', 'POST', { fs: remote });
  }

  async cancelJob(jobId: number): Promise<void> {
    await this.request(`job/stop`, 'POST', { jobid: jobId });
  }
}

export const rcloneService = new RcloneService();
