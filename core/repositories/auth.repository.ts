import { db } from '../db';
import { refreshTokens } from '../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Auth Repository
 * 
 * Handles persistence for refresh tokens to support persistent sessions and revocation.
 */
export const authRepository = {
    createRefreshToken: async (data: {
        id: string;
        userId: string;
        token: string;
        expiresAt: string;
        createdOn: string;
    }) => {
        return db.insert(refreshTokens).values(data).run();
    },

    findValidToken: async (token: string) => {
        return db.select()
            .from(refreshTokens)
            .where(and(
                eq(refreshTokens.token, token),
                eq(refreshTokens.revoked, 0)
            ))
            .get();
    },

    revokeToken: async (token: string) => {
        return db.update(refreshTokens)
            .set({ revoked: 1 })
            .where(eq(refreshTokens.token, token))
            .run();
    },

    revokeAllUserTokens: async (userId: string) => {
        return db.update(refreshTokens)
            .set({ revoked: 1 })
            .where(eq(refreshTokens.userId, userId))
            .run();
    }
};
