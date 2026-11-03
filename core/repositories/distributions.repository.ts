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

    findById: async (id: string) => {
        const results = await db
            .select()
            .from(consumptionDistributions)
            .where(eq(consumptionDistributions.id, id));
        return results[0] || null;
    },

    createEntry: async (entry: {
        userId: string;
        nexudusAccountId: string;
        month: string;
        type: string;
        quantity: number;
        concept?: string;
    }) => {
        const newEntry = {
            id: randomUUID(),
            userId: entry.userId,
            nexudusAccountId: entry.nexudusAccountId,
            month: entry.month,
            type: entry.type,
            quantity: entry.quantity,
            concept: entry.concept || null,
            createdAt: new Date().toISOString()
        };
        await db.insert(consumptionDistributions).values(newEntry);
        return newEntry;
    },

    deleteEntry: async (id: string) => {
        return await db.delete(consumptionDistributions).where(eq(consumptionDistributions.id, id));
    },

    saveBatch: async (userId: string, month: string, distributions: any[]) => {
        // En better-sqlite3 las transacciones de Drizzle son síncronas.
        // El uso de async dentro del callback provoca el error "Transaction function cannot return a promise".
        db.transaction((tx: any) => {
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
                    concept: d.concept || null,
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
