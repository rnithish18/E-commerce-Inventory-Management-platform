import { pool } from './pool';
import { QueryResult, QueryResultRow } from 'pg';

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params as unknown[]);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development' && duration > 100) {
    console.warn(`⚠️  Slow query (${duration}ms):`, text.slice(0, 80));
  }
  return res;
}

export async function getClient() {
  return pool.connect();
}
