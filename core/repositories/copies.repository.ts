import { db } from '../db';
import { copies } from '../db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

export const copiesRepository = {
    findCopiesByUserId: async (userId: string, from?: string, to?: string) => {
        let conditions = [eq(copies.userId, userId)];
        if (from) conditions.push(sql`${copies.datetime} >= ${from}`);
        if (to) conditions.push(sql`${copies.datetime} <= ${to}`);

        return await db
            .select()
            .from(copies)
            .where(and(...conditions));
    },
    findLatestByUserId: async (userId: string) => {
        const result = await db
            .select()
            .from(copies)
            .where(eq(copies.userId, userId))
            .orderBy(desc(copies.datetime))
            .limit(1);
        return result.length > 0 ? result[0] : null;
    },
    findById: async (id: string, userId: string) => {
        const result = await db.select().from(copies).where(and(eq(copies.id, id), eq(copies.userId, userId)));
        return result.length > 0 ? result[0] : null;
    },
    create: async (data: any) => {
        await db.insert(copies).values(data);
        return data;
    },
    update: async (id: string, userId: string, data: any) => {
        await db.update(copies).set(data).where(and(eq(copies.id, id), eq(copies.userId, userId)));
        return await copiesRepository.findById(id, userId);
    },
    delete: async (id: string, userId: string) => {
        await db.delete(copies).where(and(eq(copies.id, id), eq(copies.userId, userId)));
    }
};
