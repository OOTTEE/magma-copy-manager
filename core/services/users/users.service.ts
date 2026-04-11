import { usersRepository } from '../../repositories/users.repository';
import * as argon2 from 'argon2';
import crypto from 'crypto';
import { db } from '../../db';
import { userNexudusAccounts } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { sanitizeUsername } from '../../lib/string.utils';

export const usersService = {
  getAll: async () => await usersRepository.findAll(),
  getById: async (id: string) => await usersRepository.findById(id),
  getByPrintUser: async (printUser: string) => await usersRepository.findByPrintUser(printUser),
  create: async (data: any) => {
    const hashedPassword = await argon2.hash(data.password);
    const newUser = {
      id: crypto.randomUUID(),
      ...data,
      username: sanitizeUsername(data.username),
      password: hashedPassword
    };
    const user = await usersRepository.create(newUser);
    
    // Sync to multi-account table if nexudusUser is provided
    if (data.nexudusUser) {
      await usersService.syncNexudusAccount(user.id, data.nexudusUser);
    }
    
    return user;
  },
  update: async (id: string, data: any) => {
    if (data.password) {
      data.password = await argon2.hash(data.password);
    }
    if (data.username) {
      data.username = sanitizeUsername(data.username);
    }
    const result = await usersRepository.update(id, data);

    // Sync to multi-account table if nexudusUser was updated
    if (data.nexudusUser) {
      await usersService.syncNexudusAccount(id, data.nexudusUser);
    }

    return result;
  },
  delete: async (id: string) => {
    await usersRepository.delete(id);
  },

  getNexudusAccounts: async (userId: string) => {
    return await db.select().from(userNexudusAccounts).where(eq(userNexudusAccounts.userId, userId)).all();
  },

  addNexudusAccount: async (userId: string, nexudusUserId: string) => {
    const id = crypto.randomUUID();
    const newAccount = {
      id,
      userId,
      nexudusUserId,
      isDefault: 0,
      createdOn: new Date().toISOString()
    };
    await db.insert(userNexudusAccounts).values(newAccount).run();
    return newAccount;
  },

  deleteNexudusAccount: async (accountId: string) => {
    await db.delete(userNexudusAccounts).where(eq(userNexudusAccounts.id, accountId)).run();
  },

  setDefaultNexudusAccount: async (userId: string, accountId: string) => {
    db.transaction((tx: any) => {
      // 1. Reset all to non-default
      tx.update(userNexudusAccounts)
        .set({ isDefault: 0 })
        .where(eq(userNexudusAccounts.userId, userId))
        .run();
      
      // 2. Set the chosen one as default
      tx.update(userNexudusAccounts)
        .set({ isDefault: 1 })
        .where(eq(userNexudusAccounts.id, accountId))
        .run();
    });
  },

  /**
   * Syncs a nexudusUserId from the base users table to the multi-account table.
   * Ensures the provided nexudusUserId exists and is marked as default.
   */
  syncNexudusAccount: async (userId: string, nexudusUserId: string) => {
    if (!nexudusUserId) return;

    db.transaction((tx: any) => {
      // 1. Check if it already exists
      const existing = tx.select()
        .from(userNexudusAccounts)
        .where(
          and(
            eq(userNexudusAccounts.userId, userId),
            eq(userNexudusAccounts.nexudusUserId, nexudusUserId)
          )
        )
        .all();

      if (existing.length === 0) {
        // Create new account entry
        tx.insert(userNexudusAccounts).values({
          id: crypto.randomUUID(),
          userId,
          nexudusUserId,
          isDefault: 1,
          createdOn: new Date().toISOString()
        }).run();
      }

      // 2. Set this one as default and others as non-default for this user
      tx.update(userNexudusAccounts)
        .set({ isDefault: 0 })
        .where(eq(userNexudusAccounts.userId, userId))
        .run();

      tx.update(userNexudusAccounts)
        .set({ isDefault: 1 })
        .where(
          and(
            eq(userNexudusAccounts.userId, userId),
            eq(userNexudusAccounts.nexudusUserId, nexudusUserId)
          )
        )
        .run();
    });
  }
};
