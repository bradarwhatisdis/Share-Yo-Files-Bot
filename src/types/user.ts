import { z } from 'zod';

export const UserRole = z.enum(['free', 'premium', 'admin']);
export type UserRole = z.infer<typeof UserRole>;

export const UserSchema = z.object({
  telegramId: z.number().int().positive(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: UserRole.default('free'),
  quotaLimitDaily: z.number().int().positive(),
  quotaUsedToday: z.number().int().min(0).default(0),
  totalDownloaded: z.number().int().min(0).default(0),
  totalUploaded: z.number().int().min(0).default(0),
  lastActivity: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;
