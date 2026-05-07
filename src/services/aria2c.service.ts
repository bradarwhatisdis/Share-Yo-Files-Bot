import WebSocket from 'ws';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { DownloadError } from '../utils/errors.js';
import { Aria2cAddUriOptions, Aria2cResponse, Aria2cStatus } from '../types/aria2c.js';
import { generateCorrelationId } from '../utils/idempotency.js';

export class Aria2cService {
  private ws: WebSocket | null = null;
  private correlationId: string;

  constructor() {
    this.correlationId = generateCorrelationId();
  }

  private async getConnection(): Promise<WebSocket> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return this.ws;
    }

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(config.aria2c.rpcUrl, {
        headers: { 'Content-Type': 'application/json' },
      });

      this.ws.once('open', () => {
        logger.info('Aria2c WebSocket connected');
        resolve(this.ws!);
      });

      this.ws.once('error', (err) => {
        logger.error({ err }, 'Aria2c WebSocket connection error');
        reject(err);
      });
    });
  }

  async sendRequest(method: string, params: unknown[] = []): Promise<unknown> {
    const ws = await this.getConnection();
    const id = generateCorrelationId();

    const request = {
      id,
      method,
      params: [`token:${config.aria2c.secret}`, ...params],
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new DownloadError('Aria2c RPC timeout'));
      }, 30000);

      const messageHandler = (data: WebSocket.Data) => {
        clearTimeout(timeout);
        ws.removeListener('message', messageHandler);

        try {
          const response = JSON.parse(data.toString()) as Aria2cResponse;
          if (response.error) {
            reject(new DownloadError(response.error.message));
          } else {
            resolve(response.result);
          }
        } catch (err) {
          reject(new DownloadError(`Failed to parse Aria2c response: ${err}`));
        }
      };

      ws.on('message', messageHandler);
      ws.send(JSON.stringify(request));
    });
  }

  async addUri(url: string, options: Aria2cAddUriOptions): Promise<string> {
    const gid = (await this.sendRequest('aria2.addUri', [[url], options])) as string;
    logger.info({ gid, url }, 'Aria2c download added');
    return gid;
  }

  async getStatus(gid: string): Promise<Aria2cStatus> {
    const status = (await this.sendRequest('aria2.tellStatus', [gid])) as Aria2cStatus;
    return status;
  }

  async removeDownload(gid: string): Promise<string> {
    return (await this.sendRequest('aria2.remove', [gid])) as string;
  }

  async shutdown(): Promise<void> {
    try {
      await this.sendRequest('aria2.shutdown', []);
    } catch {
      // Ignore errors during shutdown
    }
  }

  async getVersion(): Promise<string> {
    return (await this.sendRequest('aria2.getVersion', [])) as Promise<string>;
  }
}

export const aria2cService = new Aria2cService();
