import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull().default('customer'),
  printUser: text('print_user').notNull(),
  nexudusUser: text('nexudus_user'),
  a3NoPaperMode: integer('a3_no_paper_mode').notNull().default(0),
});

export const copies = sqliteTable('copies', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  nexudusSaleId: text('nexudus_sale_id').references(() => nexudusSales.id),
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

// Invoices and InvoiceItems tables removed as per "Nexudus First" approach.

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
});

export const syncLogs = sqliteTable('sync_logs', {
  id: text('id').primaryKey(),
  datetime: text('datetime').notNull(),
  status: text('status').notNull(), // 'success', 'failed', 'partial'
  triggerType: text('trigger_type').default('auto'), // 'auto', 'manual'
  summary: text('summary'),
  details: text('details').notNull(), // JSON string con resumen por usuario
});

export const nexudusSales = sqliteTable('nexudus_sales', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  month: text('month').notNull(), // YYYY-MM
  type: text('type').notNull(), // A4_BW, A4_COLOR, etc.
  quantity: integer('quantity').notNull(),
  nexudusSaleId: text('nexudus_sale_id').notNull(), // ID retornado por Nexudus
  nexudusProductId: text('nexudus_product_id').notNull(), // ID del producto de Nexudus usado
  saleDate: text('sale_date').notNull(),
  createdOn: text('created_on').notNull(),
});
