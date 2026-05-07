import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export function generateJobId(): string {
  return uuidv4();
}

export function generateIdempotencyKey(url: string, userId: number, date: string): string {
  return createHash('sha256')
    .update(`${url}:${userId}:${date}`)
    .digest('hex');
}

export function generateCorrelationId(): string {
  return uuidv4();
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\.\./g, '-')
    .trim()
    .substring(0, 255);
}
