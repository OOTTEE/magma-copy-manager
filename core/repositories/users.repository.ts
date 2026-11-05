import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export const usersRepository = {
    findByUsername: async (username: string) => {
        const result = await db
            .select()
            .from(users)
            .where(eq(users.username, username));
        return result.length > 0 ? result[0] : null;
    },
    findByPrintUser: async (printUser: string) => {
        const result = await db
            .select()
            .from(users)
            .where(eq(users.printUser, printUser));
        return result.length > 0 ? result[0] : null;
    },
    findAll: async () => {
        return await db.select().from(users);
    },
    findAllActive: async (includeIgnored: boolean = false) => {
        if (includeIgnored) {
            return await db.select().from(users);
        }
        return await db.select().from(users).where(eq(users.isIgnored, 0));
    },
    findById: async (id: string) => {
        const result = await db.select().from(users).where(eq(users.id, id));
        return result.length > 0 ? result[0] : null;
    },
    create: async (user: any) => {
        await db.insert(users).values(user);
        return user;
    },
    update: async (id: string, data: any) => {
        await db.update(users).set(data).where(eq(users.id, id));
        return await usersRepository.findById(id);
    },
    incrementFailedAttempts: async (userId: string, currentAttempts: number) => {
        const nextAttempts = currentAttempts + 1;
        const isLocked = nextAttempts >= 5 ? 1 : 0;
        await db.update(users).set({
            failedLoginAttempts: nextAttempts,
            isLocked
        }).where(eq(users.id, userId));
        return { failedAttempts: nextAttempts, isLocked: Boolean(isLocked) };
    },
    resetFailedAttempts: async (userId: string) => {
        await db.update(users).set({
            failedLoginAttempts: 0
        }).where(eq(users.id, userId));
    },
    unlockUser: async (userId: string) => {
        await db.update(users).set({
            failedLoginAttempts: 0,
            isLocked: 0
        }).where(eq(users.id, userId));
    },
    delete: async (id: string) => {
        await db.delete(users).where(eq(users.id, id));
    }
};
