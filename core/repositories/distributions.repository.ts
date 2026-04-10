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
        // En better-sqlite3 las transacciones de Drizzle son síncronas.
        // El uso de async dentro del callback provoca el error "Transaction function cannot return a promise".
        db.transaction((tx) => {
            // 1. Limpiar repartos anteriores para ese mes/usuario
            tx.delete(consumptionDistributions).where(and(
                eq(consumptionDistributions.userId, userId),
                eq(consumptionDistributions.month, month)
            )).run();

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
                tx.insert(consumptionDistributions).values(values).run();
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
