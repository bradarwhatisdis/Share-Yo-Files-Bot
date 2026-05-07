import Database from 'better-sqlite3';
import { config } from '../config/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

export class DatabaseService {
  private db: Database.Database;

  constructor() {
    const dbPath = config.database.path;
    const dbDir = dirname(dbPath);
    mkdirSync(dbDir, { recursive: true });

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('busy_timeout = 5000');
  }

  get instance(): Database.Database {
    return this.db;
  }

  prepare<T extends {} = {}>(sql: string): Database.Statement<T> {
    return this.db.prepare<T>(sql);
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  close(): void {
    this.db.close();
  }

  checkpoint(): void {
    this.db.pragma('wal_checkpoint(PASSIVE)');
  }
}

export const db = new DatabaseService();
