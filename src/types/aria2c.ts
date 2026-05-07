import { z } from 'zod';

export const Aria2cStatus = z.enum([
  'active',
  'waiting',
  'paused',
  'error',
  'complete',
  'removed',
]);
export type Aria2cStatus = z.infer<typeof Aria2cStatus>;

export const Aria2cResponseSchema = z.object({
  id: z.string(),
  result: z.unknown().optional(),
  error: z
    .object({
      code: z.number(),
      message: z.string(),
    })
    .optional(),
});
export type Aria2cResponse = z.infer<typeof Aria2cResponseSchema>;

export const Aria2cStatusSchema = z.object({
  gid: z.string(),
  status: Aria2cStatus,
  totalLength: z.string(),
  completedLength: z.string(),
  downloadSpeed: z.string(),
  uploadSpeed: z.string(),
  connections: z.string(),
  dir: z.string(),
  files: z.array(
    z.object({
      path: z.string(),
      length: z.string(),
      completedLength: z.string(),
    })
  ),
});
export type Aria2cStatus = z.infer<typeof Aria2cStatusSchema>;

export interface Aria2cAddUriOptions {
  dir: string;
  out?: string;
  split?: string;
  'max-connection-per-server'?: string;
  'min-split-size'?: string;
  continue?: string;
  'bt-metadata-only'?: string;
  'bt-stop-timeout'?: string;
  'seed-time'?: string;
}
