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
    delete: async (id: string) => {
        await db.delete(users).where(eq(users.id, id));
    }
};
