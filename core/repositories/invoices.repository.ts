import { db } from '../db';
import { invoices, users } from '../db/schema';
import { eq, and, sql, desc, like, or, inArray } from 'drizzle-orm';

export const invoicesRepository = {
    findAllPaginated: async (params: { 
        limit: number; 
        offset: number; 
        userIds?: string[]; 
        months?: string[] 
    }) => {
        const { limit, offset, userIds, months } = params;
        let conditions: any[] = [];

        if (userIds && userIds.length > 0) {
            conditions.push(inArray(invoices.userId, userIds));
        }

        if (months && months.length > 0) {
            const monthConditions = months.map(m => like(invoices.from, `${m}%`));
            conditions.push(or(...monthConditions));
        }

        const query = db
            .select({
                id: invoices.id,
                userId: invoices.userId,
                username: users.username,
                from: invoices.from,
                to: invoices.to,
                total: invoices.total
            })
            .from(invoices)
            .innerJoin(users, eq(invoices.userId, users.id));

        if (conditions.length > 0) {
            query.where(and(...conditions));
        }

        return await query
            .orderBy(desc(invoices.from))
            .limit(limit)
            .offset(offset)
            .all();
    },

    countAll: async (params: { userIds?: string[]; months?: string[] }) => {
        const { userIds, months } = params;
        let conditions: any[] = [];

        if (userIds && userIds.length > 0) {
            conditions.push(inArray(invoices.userId, userIds));
        }

        if (months && months.length > 0) {
            const monthConditions = months.map(m => like(invoices.from, `${m}%`));
            conditions.push(or(...monthConditions));
        }

        const query = db
            .select({ count: sql<number>`count(*)` })
            .from(invoices);

        if (conditions.length > 0) {
            query.where(and(...conditions));
        }

        const result = await query.get();
        return result?.count || 0;
    },

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
        return data; 
    },
    update: async (id: string, userId: string, data: any) => {
        await db.update(invoices).set(data).where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
        return await invoicesRepository.findById(id, userId);
    },
    delete: async (id: string, userId: string) => {
        await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
    }
};
