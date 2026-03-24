import { db } from '../db';
import { copies } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const copiesRepository = {
    findCopiesByUserId: async (userId: string, from?: string, to?: string) => {
        let conditions = [eq(copies.userId, userId)];
        if (from) conditions.push(sql`${copies.datetime} >= ${from}`);
        if (to) conditions.push(sql`${copies.datetime} <= ${to}`);

        return await db
            .select()
            .from(copies)
            .where(and(...conditions));
    }
};
