import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { serverConfig } from '../config/server.config';

const globalForDb = global as unknown as { 
    db: any, 
    sqlite: any 
};

const dbPath = serverConfig.databaseUrl;

// Ensure we only create one connection per process/worker, 
// especially critical for ":memory:" databases.
if (!globalForDb.sqlite) {
    globalForDb.sqlite = new Database(dbPath.replace('file:', ''));
    try {
        const nexAccCols = globalForDb.sqlite.prepare("PRAGMA table_info(user_nexudus_accounts)").all();
        if (nexAccCols.length > 0 && !nexAccCols.some((col: any) => col.name === 'account_name')) {
            globalForDb.sqlite.prepare("ALTER TABLE user_nexudus_accounts ADD COLUMN account_name TEXT").run();
        }
    } catch {
        // Table might not exist yet during initial setup
    }
}

if (!globalForDb.db) {
    globalForDb.db = drizzle(globalForDb.sqlite, { schema });
}

export const db = globalForDb.db;
export const sqlite = globalForDb.sqlite;
