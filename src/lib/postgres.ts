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

function createClient() {
  const connectionString = getConnectionString();
  // Disable prefetch as it is not supported for "Transaction" pool mode
  return postgres(connectionString, { prepare: false });
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    if (!_db) {
      if (!_client) _client = createClient();
      _db = drizzle(_client, { schema });
    }
    // @ts-expect-error - forwarding properties dynamically
    return Reflect.get(_db, prop, receiver);
  },
});