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
    }
};
