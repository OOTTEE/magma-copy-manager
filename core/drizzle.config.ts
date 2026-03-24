import { defineConfig } from 'drizzle-kit';
import { serverConfig } from './config/server.config';

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: serverConfig.databaseUrl.includes(':') ? serverConfig.databaseUrl : `file:${serverConfig.databaseUrl}`,
  },
});
