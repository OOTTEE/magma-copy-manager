import { db } from '../db';
import { copies, users } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const readCopiesService = {
    listAll: async () => {
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

        // Join users and copies, filter by current month
        const results = await db
            .select({
                printUser: users.printUser,
                nexudusUser: users.nexudusUser,
                a4: copies.a4Copies,
                a3: copies.a3Copies,
                sra3: copies.sra3Copies,
                color: copies.colorCopies,
                bw: copies.bwCopies,
                total: copies.totalCopies,
                from: copies.from,
                to: copies.to,
            })
            .from(copies)
            .innerJoin(users, eq(copies.userId, users.id))
            .where(
                and(
                    sql`${copies.from} >= ${startOfMonth}`,
                    sql`${copies.to} <= ${endOfMonth}`
                )
            );

        return results.map(row => ({
            printUser: row.printUser,
            nexudusUser: row.nexudusUser,
            copies: {
                "A4": row.a4,
                "A3": row.a3,
                "SRA3": row.sra3,
                "Color": row.color,
                "B&W": row.bw
            },
            total: row.total,
            from: row.from,
            to: row.to
        }));
    }
};
