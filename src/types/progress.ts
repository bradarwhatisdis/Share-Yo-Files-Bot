import { z } from 'zod';

export const DownloadProgressSchema = z.object({
  jobId: z.string().uuid(),
  downloaded: z.number().int().min(0),
  total: z.number().int().min(0),
  speed: z.number().min(0),
  eta: z.number().int().min(0).optional(),
  status: z.string(),
  gid: z.string().optional(),
});

export type DownloadProgress = z.infer<typeof DownloadProgressSchema>;

export const TransferProgressSchema = z.object({
  jobId: z.string().uuid(),
  bytes: z.number().int().min(0),
  totalBytes: z.number().int().min(0),
  speed: z.number().min(0),
  percentage: z.number().min(0).max(100),
  destination: z.string(),
});

export type TransferProgress = z.infer<typeof TransferProgressSchema>;
