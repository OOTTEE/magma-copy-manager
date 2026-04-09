import { db } from '../db';
import { copies, users } from '../db/schema';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';

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
    findAll: async () => {
        return await db
            .select({
                id: copies.id,
                userId: copies.userId,
                username: users.username,
                datetime: copies.datetime,
                a4Bw: copies.a4Bw,
                a4Color: copies.a4Color,
                a3Bw: copies.a3Bw,
                a3Color: copies.a3Color,
                a4BwTotal: copies.a4BwTotal,
                a4ColorTotal: copies.a4ColorTotal,
                a3BwTotal: copies.a3BwTotal,
                a3ColorTotal: copies.a3ColorTotal,
                isSynced: sql<boolean>`CASE WHEN ${copies.nexudusSaleId} IS NOT NULL THEN 1 ELSE 0 END`
            })
            .from(copies)
            .leftJoin(users, eq(copies.userId, users.id))
            .orderBy(desc(copies.datetime));
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
    create: async (data: any) => {
        await db.insert(copies).values(data);
        return data;
    },
    deleteMany: async (ids: string[]) => {
        return await db.delete(copies).where(inArray(copies.id, ids));
    }
};
