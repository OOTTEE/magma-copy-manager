import { db } from '../db';
import { consumptionDistributions } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const distributionsRepository = {
    findByUserAndMonth: async (userId: string, month: string) => {
        return await db
            .select()
            .from(consumptionDistributions)
            .where(and(
                eq(consumptionDistributions.userId, userId),
                eq(consumptionDistributions.month, month)
            ));
    },

    saveBatch: async (userId: string, month: string, distributions: any[]) => {
        return await db.transaction(async (tx) => {
            // 1. Limpiar repartos anteriores para ese mes/usuario
            await tx.delete(consumptionDistributions).where(and(
                eq(consumptionDistributions.userId, userId),
                eq(consumptionDistributions.month, month)
            ));

            // 2. Insertar nuevos repartos
            if (distributions.length > 0) {
                const now = new Date().toISOString();
                const values = distributions.map(d => ({
                    id: randomUUID(),
                    userId,
                    nexudusAccountId: d.nexudusAccountId,
                    month,
                    type: d.type,
                    quantity: d.quantity,
                    createdAt: now
                }));
                await tx.insert(consumptionDistributions).values(values);
            }
        });
    },

    deleteByUserAndMonth: async (userId: string, month: string) => {
        return await db.delete(consumptionDistributions).where(and(
            eq(consumptionDistributions.userId, userId),
            eq(consumptionDistributions.month, month)
        ));
    }
};
