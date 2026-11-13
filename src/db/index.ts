import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Lazily created Postgres pool.
 *
 * The old version threw `DATABASE_URL is required` at *import* time, which
 * broke `next build` (page-data collection) and every route that merely
 * imported the db module, even ones that never touch the database.
 *
 * Now the connection is only created on first real query. If DATABASE_URL is
 * not configured the call throws a clear, catchable error and the API routes
 * fall back to their DB-less behaviour (the app stays browsable as Guest).
 */

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsPostgresqlDb?: NodePgDatabase<Record<string, never>>;
};

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL is not configured — database features are disabled.");
    this.name = "DatabaseNotConfiguredError";
  }
}

export function getPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new DatabaseNotConfiguredError();

  if (!globalForDb.__arenaNextJsPostgresqlPool) {
    globalForDb.__arenaNextJsPostgresqlPool = new Pool({
      connectionString: databaseUrl,
      max: 5,
      ssl: /localhost|127\.0\.0\.1/.test(databaseUrl) ? undefined : { rejectUnauthorized: false },
    });
  }
  return globalForDb.__arenaNextJsPostgresqlPool;
}

export function getDb(): NodePgDatabase<Record<string, never>> {
  if (!globalForDb.__arenaNextJsPostgresqlDb) {
    globalForDb.__arenaNextJsPostgresqlDb = drizzle(getPool());
  }
  return globalForDb.__arenaNextJsPostgresqlDb;
}

export function isDbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

/**
 * `db` keeps the old call sites working (`db.select()...`) but resolves the
 * pool on first property access instead of at import time.
 */
export const db = new Proxy({} as NodePgDatabase<Record<string, never>>, {
  get(_target, prop) {
    const real = getDb() as any;
    const value = real[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const real = getPool() as any;
    const value = real[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});
