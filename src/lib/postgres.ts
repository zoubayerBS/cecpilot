import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './db/schema';

let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url || url.trim() === '') {
    throw new Error('DATABASE_URL is missing. Set it in your hosting environment variables (e.g., Netlify Site settings -> Environment). Do not rely on .env.local in production.');
  }
  return url;
}

export function getDb() {
  if (!_db) {
    if (!_client) {
      const connectionString = getConnectionString();
      _client = postgres(connectionString, { prepare: false });
    }
    _db = drizzle(_client, { schema });
  }
  return _db;
}