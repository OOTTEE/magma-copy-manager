import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { serverConfig } from '../config/server.config';

const dbPath = serverConfig.databaseUrl;
const sqlite = new Database(dbPath.replace('file:', ''));
export const db = drizzle(sqlite, { schema });
