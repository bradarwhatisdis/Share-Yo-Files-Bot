import { Database } from '../service.js';

export async function up(db: Database): Promise<void> {
  const schema = await import('../schema.sql');
  db.exec(schema.default || schema);
}

export async function down(db: Database): Promise<void> {
  db.exec(`
    DROP TABLE IF EXISTS audit_logs;
    DROP TABLE IF EXISTS whitelist;
    DROP TABLE IF EXISTS files;
    DROP TABLE IF EXISTS jobs;
    DROP TABLE IF EXISTS users;
  `);
}
