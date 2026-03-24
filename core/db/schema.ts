import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  printUser: text('print_user').notNull(),
  nexudusUser: text('nexudus_user').notNull(),
});

export const copies = sqliteTable('copies', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  from: text('from').notNull(), // ISO Date String
  to: text('to').notNull(),     // ISO Date String
  a4Copies: integer('a4_copies').notNull().default(0),
  a3Copies: integer('a3_copies').notNull().default(0),
  sra3Copies: integer('sra3_copies').notNull().default(0),
  colorCopies: integer('color_copies').notNull().default(0),
  bwCopies: integer('bw_copies').notNull().default(0),
  totalCopies: integer('total_copies').notNull().default(0),
});
