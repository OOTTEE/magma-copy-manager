import { db } from '../db';
import { invoices, invoiceItems } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const invoicesRepository = {
    findInvoicesByUserId: async (userId: string, from?: string, to?: string) => {
        let conditions = [eq(invoices.userId, userId)];
        if (from) conditions.push(sql`${invoices.from} >= ${from}`);
        if (to) conditions.push(sql`${invoices.to} <= ${to}`);

        return await db
            .select()
            .from(invoices)
            .where(and(...conditions));
    },
    findById: async (id: string, userId: string) => {
        const result = await db.select().from(invoices).where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
        return result.length > 0 ? result[0] : null;
    },
    create: async (data: any) => {
        await db.insert(invoices).values(data);
        return data; // Simple return for now
    },
    update: async (id: string, userId: string, data: any) => {
        await db.update(invoices).set(data).where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
        return await invoicesRepository.findById(id, userId);
    },
    delete: async (id: string, userId: string) => {
        await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
    }
};
