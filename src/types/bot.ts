import { Context, SessionFlavor } from 'grammy';
import { Job } from './job.js';
import { User } from './user.js';

export interface SessionData {
  waitingForDestination?: boolean;
  currentJobId?: string;
}

export type MyContext = Context & SessionFlavor<SessionData> & {
  user?: User;
  job?: Job;
  correlationId?: string;
};
