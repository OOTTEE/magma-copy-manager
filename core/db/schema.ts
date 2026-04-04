import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull().default('customer'),
  printUser: text('print_user').notNull(),
  nexudusUser: text('nexudus_user').notNull(),
  a3NoPaperMode: integer('a3_no_paper_mode').notNull().default(0),
});

export const copies = sqliteTable('copies', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  invoiceId: text('invoice_id').references(() => invoices.id),
  datetime: text('datetime').notNull(),
  a4Color: integer('a4_color').notNull().default(0),
  a4Bw: integer('a4_bw').notNull().default(0),
  a3Color: integer('a3_color').notNull().default(0),
  a3Bw: integer('a3_bw').notNull().default(0),
  a4ColorTotal: integer('a4_color_total').notNull().default(0),
  a4BwTotal: integer('a4_bw_total').notNull().default(0),
  a3ColorTotal: integer('a3_color_total').notNull().default(0),
  a3BwTotal: integer('a3_bw_total').notNull().default(0),
});

export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  from: text('from').notNull(),
  to: text('to').notNull(),
  total: integer('total').notNull().default(0),
});

export const invoiceItems = sqliteTable('invoice_items', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id),
  concept: text('concept').notNull(),
  quantity: integer('quantity').notNull().default(0),
  unitPrice: integer('unit_price').notNull().default(0),
  total: integer('total').notNull().default(0),
});

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
});
