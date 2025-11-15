import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './db/schema';

const connectionString = process.env.POSTGRES_URL!;

const pool = new Pool({
  connectionString,
});

pool.on('connect', (client) => {
  client.query('SET search_path TO cecschema, public');
});

export const db = drizzle(pool, { schema });