import { db } from '../db';
import { passwordRecoveryTokens } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';

export interface RecoveryTokenRecord {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  used: number;
  createdAt: string;
}

export const recoveryRepository = {
  create: async (data: RecoveryTokenRecord) => {
    await db.insert(passwordRecoveryTokens).values(data);
    return data;
  },

  findValidToken: async (token: string): Promise<RecoveryTokenRecord | null> => {
    const now = new Date().toISOString();
    const result = await db
      .select()
      .from(passwordRecoveryTokens)
      .where(
        and(
          eq(passwordRecoveryTokens.token, token),
          eq(passwordRecoveryTokens.used, 0),
          gt(passwordRecoveryTokens.expiresAt, now)
        )
      );

    return result.length > 0 ? result[0] : null;
  },

  markAsUsed: async (token: string) => {
    await db
      .update(passwordRecoveryTokens)
      .set({ used: 1 })
      .where(eq(passwordRecoveryTokens.token, token));
  }
};
