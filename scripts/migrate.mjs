import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run the database migration.');
}

const schemaPath = resolve(dirname(fileURLToPath(import.meta.url)), '../db/schema.sql');
const schema = await readFile(schemaPath, 'utf8');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  await client.query('BEGIN');
  await client.query(schema);
  await client.query('COMMIT');
  console.log('Database schema applied successfully.');
} catch (error) {
  await client.query('ROLLBACK');
  console.error('Database schema migration failed.', error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
