import { Queue, Worker, QueueEvents, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { Job } from '../types/job.js';

const connection = new IORedis(config.redis.url, {
  password: config.redis.password,
  maxRetriesPerRequest: null,
});

export const mirrorQueue = new Queue<Job>('mirror-queue', {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: config.queue.removeOnComplete },
    removeOnFail: { count: config.queue.removeOnFail },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
  },
});

export const queueEvents = new QueueEvents('mirror-queue', { connection });

export function createWorker(processor: (job: import('bullmq').Job<Job>) => Promise<void>) {
  const worker = new Worker<Job>('mirror-queue', processor, {
    connection,
    concurrency: config.aria2c.maxConcurrent,
    autorun: true,
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'Job failed');
  });

  return worker;
}

export async function addJobToQueue(
  jobData: Job,
  opts?: JobsOptions
): Promise<import('bullmq').Job<Job>> {
  const jobCount = await mirrorQueue.getWaitingCount();
  if (jobCount >= config.queue.maxJobs) {
    throw new Error('Queue is full, try again later');
  }

  return mirrorQueue.add('mirror', jobData, opts);
}

export async function getJobStatus(jobId: string): Promise<import('bullmq').Job<Job> | undefined> {
  return mirrorQueue.getJob(jobId);
}

export async function cancelJob(jobId: string): Promise<void> {
  const job = await mirrorQueue.getJob(jobId);
  if (job) {
    await job.remove();
  }
}
