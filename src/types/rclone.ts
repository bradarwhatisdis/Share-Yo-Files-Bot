import { z } from 'zod';

export const RcloneJobStatus = z.enum(['pending', 'running', 'success', 'error', 'not found']);
export type RcloneJobStatus = z.infer<typeof RcloneJobStatus>;

export const RcloneJobSchema = z.object({
  id: z.number(),
  status: RcloneJobStatus,
  bytes: z.number().int().min(0),
  speed: z.number().min(0),
  percentage: z.number().min(0).max(100),
  error: z.string().optional(),
});
export type RcloneJob = z.infer<typeof RcloneJobSchema>;

export const RcloneAboutSchema = z.object({
  total: z.number(),
  used: z.number(),
  free: z.number(),
  trash: z.number().optional(),
});
export type RcloneAbout = z.infer<typeof RcloneAboutSchema>;

export interface RcloneCopyUrlOptions {
  srcFs: string;
  srcRemote: string;
  dstFs: string;
  dstRemote: string;
  _async?: boolean;
}

export interface RcloneSyncCopyOptions {
  srcFs: string;
  dstFs: string;
  _async?: boolean;
  transfers?: number;
  checkers?: number;
}
