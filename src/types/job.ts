import { z } from 'zod';

export const JobStatus = z.enum([
  'pending',
  'queued',
  'downloading',
  'uploading',
  'completed',
  'failed',
  'cancelled',
]);
export type JobStatus = z.infer<typeof JobStatus>;

export const JobSchema = z.object({
  id: z.string().uuid(),
  userId: z.number().int().positive(),
  chatId: z.number().int(),
  messageId: z.number().int().optional(),
  sourceUrl: z.string().url(),
  idempotencyKey: z.string().min(1),
  filename: z.string().min(1),
  expectedSize: z.number().int().nonnegative().optional(),
  contentType: z.string().optional(),
  destination: z.string().min(1),
  status: JobStatus.default('pending'),
  progress: z.number().min(0).max(100).default(0),
  attempts: z.number().int().min(0).default(0),
  maxAttempts: z.number().int().positive().default(3),
  errorMessage: z.string().optional(),
  destinationUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});

export type Job = z.infer<typeof JobSchema>;

export const CreateJobInput = JobSchema.omit({
  id: true,
  status: true,
  progress: true,
  attempts: true,
  errorMessage: true,
  destinationUrl: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});
export type CreateJobInput = z.infer<typeof CreateJobInput>;
