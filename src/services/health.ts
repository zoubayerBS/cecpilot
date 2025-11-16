
'use server';

import { getDb } from '@/lib/postgres';
import { sql } from 'drizzle-orm';

export async function checkDbConnection() {
  const db = getDb();
  try {
    await db.execute(sql`SELECT 1`);
    return { status: 'ok' };
  } catch (error) {
    console.error('Database connection error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { status: 'error', message: errorMessage };
  }
}

export async function getDbSchema() {
  const db = getDb();
  try {
    const result = await db.execute(sql`SELECT current_schema()`);
    if (result.rows.length > 0) {
      return { schema: result.rows[0].current_schema as string };
    }
    return { schema: 'unknown' };
  } catch (error) {
    console.error('Error getting DB schema:', error);
    return { schema: 'error' };
  }
}
