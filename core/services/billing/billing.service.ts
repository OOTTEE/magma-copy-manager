import { reportsService } from '../reports/reports.service';
import { settingsService } from '../settings/settings.service';
import { nexudusService } from '../nexudus/nexudus.service';
import { db } from '../../db';
import { copies, nexudusSales, syncLogs, users, userNexudusAccounts, consumptionDistributions } from '../../db/schema';
import { eq, and, sql, isNull, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { logger } from '../../lib/logger';
import { distributionsRepository } from '../../repositories/distributions.repository';

/**
 * Billing Service
 * 
 * Handles invoice generation and simulation logic.
 */
export const billingService = {
  /**
   * Helper to format ISO date to DD-MM-YYYY
   */
  formatDate: (iso: string) => {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  },

  /**
   * Returns saved distributions for a specific user and month.
   */
  getDistributions: async (userId: string, month: string) => {
    return await distributionsRepository.findByUserAndMonth(userId, month);
  },

  /**
   * Saves distribution intention for a user/month.
   */
  saveDistributions: async (userId: string, month: string, distributions: any[]) => {
    return await distributionsRepository.saveBatch(userId, month, distributions);
  },

  /**
   * Simulates an invoice for a specific user based on current consumption.
   * Business Rule: No persistence, pure calculation.
   */
  simulateInvoice: async (userId: string) => {
    const report = await reportsService.getMonthlyAccumulationForUser(userId);
    if (!report || report.data.total === 0) {
      const error = new Error('No consumption data found for this user in the current period.');
      (error as any).statusCode = 400;
      throw error;
    }

    const settings = await settingsService.getAllSettings();
    const data = report.data;
    const isSRA3 = data.a3NoPaperMode;

    const lines: Array<{ concept: string; quantity: number }> = [];

    // A4 BW
    if (data.a4Bw > 0) {
      lines.push({
        concept: 'Copias A4 B/N (con papel)',
        quantity: data.a4Bw
      });
    }

    // A4 Color
    if (data.a4Color > 0) {
      lines.push({
        concept: 'Copias A4 Color (con papel)',
        quantity: data.a4Color
      });
    }

    // A3 BW / SRA3 BW
    const a3BwCount = isSRA3 ? data.sra3Bw : data.a3Bw;
    if (a3BwCount > 0) {
      lines.push({
        concept: isSRA3 ? 'Copias SRA3 B/N (sin papel)' : 'Copias A3 B/N (con papel)',
        quantity: a3BwCount
      });
    }

    // A3 Color / SRA3 Color
    const a3ColorCount = isSRA3 ? data.sra3Color : data.a3Color;
    if (a3ColorCount > 0) {
      lines.push({
        concept: isSRA3 ? 'Copias SRA3 Color (sin papel)' : 'Copias A3 Color (con papel)',
        quantity: a3ColorCount
      });
    }

    return {
      userId,
      username: data.username,
      period: report.period,
      lines,
    };
  },

  /**
   * Retrieves synchronization status for a user in a given month.
   */
  getSyncStatus: async (userId: string, monthStr: string) => {
    const sales = await db
      .select()
      .from(nexudusSales)
      .where(and(
        eq(nexudusSales.userId, userId),
        eq(nexudusSales.month, monthStr)
      ));
    
    return sales.length > 0 ? { synced: true, salesCount: sales.length, sales } : { synced: false };
  },

  /**
   * Retrieves paginated synchronization history from Nexudus sales, grouped by user and sale session.
   */
  getPaginatedSales: async (params: { 
    page: number; 
    limit: number; 
    userIds?: string[]; 
    months?: string[] 
  }) => {
    const { page, limit, userIds, months } = params;
    const offset = (page - 1) * limit;

    // Filter construction
    let whereClause = sql`1=1`;
    if (userIds && userIds.length > 0) {
      whereClause = sql`${whereClause} AND ns.user_id IN ${userIds}`;
    }
    if (months && months.length > 0) {
      whereClause = sql`${whereClause} AND ns.month IN ${months}`;
    }

    // Main grouped query
    const data = await db.all(sql`
      SELECT 
        ns.user_id as userId,
        u.username as username,
        na.nex_user_id as nexudusCoworkerId, -- Keep for backwards compat if needed, but primarily use from items
        ns.month as month,
        ns.sale_date as saleDate,
        SUM(ns.quantity) as totalQuantity,
        json_group_array(json_object(
          'id', ns.id,
          'type', ns.type,
          'quantity', ns.quantity,
          'nexudusSaleId', ns.nexudus_sale_id,
          'nexudusCoworkerId', na.nex_user_id
        )) as items,
        MAX(ns.created_on) as createdOn
      FROM nexudus_sales ns
      JOIN users u ON ns.user_id = u.id
      LEFT JOIN user_nexudus_accounts na ON ns.nexudus_account_id = na.id
      WHERE ${whereClause}
      GROUP BY ns.user_id, ns.sale_date
      ORDER BY ns.sale_date DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    // Parse items JSON and format response
    const formattedData = data.map((row: any) => ({
      ...row,
      items: JSON.parse(row.items)
    }));
    
    // Count total GROUPS for pagination
    const totalResult = await db.get(sql`
      SELECT count(*) as count FROM (
        SELECT 1 FROM nexudus_sales ns
        JOIN users u ON ns.user_id = u.id
        WHERE ${whereClause}
        GROUP BY ns.user_id, ns.sale_date
      )
    `);
    const total = (totalResult as any)?.count || 0;

    return {
      data: formattedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Retrieves detailed information about a specific Nexudus sale.
   */
  getSaleWithDetails: async (id: string) => {
    return db
      .select({
        id: nexudusSales.id,
        userId: nexudusSales.userId,
        username: sql<string>`users.username`,
        month: nexudusSales.month,
        type: nexudusSales.type,
        quantity: nexudusSales.quantity,
        nexudusSaleId: nexudusSales.nexudusSaleId,
        nexudusCoworkerId: userNexudusAccounts.nexudusUserId,
        nexudusProductId: nexudusSales.nexudusProductId,
        saleDate: nexudusSales.saleDate,
        createdOn: nexudusSales.createdOn,
        nexudusAccountId: nexudusSales.nexudusAccountId,
      })
      .from(nexudusSales)
      .innerJoin(users, eq(users.id, nexudusSales.userId))
      .leftJoin(userNexudusAccounts, eq(userNexudusAccounts.id, nexudusSales.nexudusAccountId))
      .where(eq(nexudusSales.id, id))
      .get();
  },

  /**
   * Synchronizes consumption to Nexudus for a single user, supporting multi-account distribution.
   */
  syncUserConsumption: async (userId: string, customNote?: string, nexudusAccountId?: string) => {
    const report = await reportsService.getMonthlyAccumulationForUser(userId);
    if (!report) throw new Error('No report data found for user');

    const monthStr = report.period.from.slice(0, 7);
    const settings = await settingsService.getAllSettings();
    const typeToProductIdMap: Record<string, string> = {
      'a4Bw': settings.nexudus_product_id_a4bw,
      'a4Color': settings.nexudus_product_id_a4color,
      'a3Bw': settings.nexudus_product_id_a3bw,
      'a3Color': settings.nexudus_product_id_a3color,
      'sra3Bw': settings.nexudus_product_id_sra3bw,
      'sra3Color': settings.nexudus_product_id_sra3color,
    };
    const copyTypes = ['a4Bw', 'a4Color', 'a3Bw', 'a3Color', 'sra3Bw', 'sra3Color'];

    // 1. Obtener todas las cuentas del usuario
    const allAccounts = await db.select().from(userNexudusAccounts).where(eq(userNexudusAccounts.userId, userId));
    const defaultAccount = allAccounts.find((a: any) => a.isDefault === 1) || allAccounts[0];
    
    if (!defaultAccount) {
      throw new Error(`User ${report.data.username} has no valid Nexudus account configured.`);
    }

    // 2. Obtener repartos manuales guardados
    const savedDistributions = await distributionsRepository.findByUserAndMonth(userId, monthStr);
    
    // 3. Organizar tareas de cobro por cuenta y tipo
    // Estructura: AccountID -> { type -> { quantity, productId } }
    const tasksPerAccount: Record<string, Record<string, { quantity: number; productId: string }>> = {};

    const registerTask = (accountId: string, type: string, quantity: number) => {
      if (quantity <= 0) return;
      const productId = typeToProductIdMap[type];
      if (!productId) return;
      
      if (!tasksPerAccount[accountId]) tasksPerAccount[accountId] = {};
      if (!tasksPerAccount[accountId][type]) tasksPerAccount[accountId][type] = { quantity: 0, productId };
      tasksPerAccount[accountId][type].quantity += quantity;
    };

    // A. Procesar repartos manuales
    const totalDistributedByType: Record<string, number> = {};
    for (const dist of savedDistributions) {
      registerTask(dist.nexudusAccountId, dist.type, dist.quantity);
      totalDistributedByType[dist.type] = (totalDistributedByType[dist.type] || 0) + dist.quantity;
    }

    // B. Calcular remanente para la cuenta por defecto (o cuenta específica si se pasó por parámetro)
    const targetRemainderAccountId = nexudusAccountId || defaultAccount.id;
    for (const type of copyTypes) {
      const totalRequested = report.data[type as keyof typeof report.data] as number || 0;
      const distributed = totalDistributedByType[type] || 0;
      const remainder = totalRequested - distributed;
      
      if (remainder > 0) {
        registerTask(targetRemainderAccountId, type, remainder);
      }
    }

    if (Object.keys(tasksPerAccount).length === 0) return { userId, salesCreated: 0 };

    // 4. Preparar Periodo para la Nota
    const latestSync = await db.select()
      .from(nexudusSales)
      .where(and(eq(nexudusSales.userId, userId), eq(nexudusSales.month, monthStr)))
      .orderBy(desc(nexudusSales.saleDate))
      .get();

    const inicioPeriodo = latestSync ? latestSync.saleDate : report.period.from;
    const fechaActual = new Date().toISOString();
    const periodNote = `Periodo: ${billingService.formatDate(inicioPeriodo)} - ${billingService.formatDate(fechaActual)}`;
    const saleDate = fechaActual;

    const createdNexudusIds: number[] = [];
    const salesToPersist: any[] = [];

    try {
      // 5. Fase de Ejecución: Nexudus API
      for (const accountId in tasksPerAccount) {
        const account = allAccounts.find((a: any) => a.id === accountId);
        if (!account) continue;

        for (const type in tasksPerAccount[accountId]) {
          const task = tasksPerAccount[accountId][type];
          
          const nexudusResponse = await nexudusService.createCoworkerProduct({
            BusinessId: parseInt(settings.nexudus_business_id || '0'),
            CoworkerId: parseInt(account.nexudusUserId || '0'),
            ProductId: parseInt(task.productId),
            Quantity: task.quantity,
            SaleDate: saleDate,
            Notes: customNote || periodNote,
            InvoiceThisCoworker: false
          });

          if (!nexudusResponse.WasSuccessful || !nexudusResponse.Value) {
            throw new Error(`Nexudus error for ${type} in account ${account.nexudusUserId}: ${nexudusResponse.Message || 'Unknown error'}`);
          }

          const remoteId = (nexudusResponse.Value as any).Id;
          createdNexudusIds.push(remoteId);
          salesToPersist.push({
            type,
            quantity: task.quantity,
            nexudusProductId: task.productId,
            remoteId: remoteId.toString(),
            accountId: account.id
          });
        }
      }

      // 6. Fase de Compromiso: DB Local (Transacción Síncrona)
      db.transaction((tx: any) => {
        // Guardar cada venta creada
        for (const sale of salesToPersist) {
          const localSaleId = randomUUID();
          
          tx.insert(nexudusSales).values({
            id: localSaleId,
            userId: userId,
            month: monthStr,
            type: sale.type,
            quantity: sale.quantity,
            nexudusSaleId: sale.remoteId,
            nexudusProductId: sale.nexudusProductId,
            nexudusAccountId: sale.accountId,
            saleDate: saleDate,
            createdOn: new Date().toISOString()
          }).run();

          // Vincular registros de copias originales
          const getPhysicalColumn = (type: string) => {
            if (type === 'sra3Color') return copies.a3Color;
            if (type === 'sra3Bw') return copies.a3Bw;
            return (copies as any)[type];
          };

          const column = getPhysicalColumn(sale.type);

          tx.update(copies)
            .set({ nexudusSaleId: localSaleId })
            .where(and(
              eq(copies.userId, userId),
              sql`${copies.datetime} >= ${report.period.from}`,
              sql`${copies.datetime} <= ${report.period.to}`,
              sql`${column} > 0`,
              isNull(copies.nexudusSaleId)
            )).run();
        }

        // Limpiar repartos procesados
        tx.delete(consumptionDistributions).where(and(
          eq(consumptionDistributions.userId, userId),
          eq(consumptionDistributions.month, monthStr)
        )).run();
      });

    } catch (error: any) {
      // 7. Rollback Compensatorio en Nexudus
      if (createdNexudusIds.length > 0) {
        logger.warn({ userId, count: createdNexudusIds.length }, `[ROLLBACK] Removing orphan sales from Nexudus due to failure.`);
        for (const remoteId of createdNexudusIds) {
          try {
            await nexudusService.deleteCoworkerProduct(remoteId);
          } catch (rollbackErr: any) {
            logger.error({ remoteId, err: rollbackErr.message }, `[FATAL] Failed to rollback Nexudus sale`);
          }
        }
      }
      throw error;
    }

    return { userId, salesCreated: salesToPersist.length };
  },

  /**
   * Global synchronization job.
   */
  syncMonthlyConsumption: async () => {
    const report = await reportsService.getMonthlyAccumulation();
    const results: any[] = [];
    
    for (const userData of report.data) {
      try {
        const result = await billingService.syncUserConsumption(userData.id);
        results.push({ ...result, username: userData.username, status: 'success' });
      } catch (e: any) {
        results.push({ userId: userData.id, username: userData.username, status: 'failed', error: e.message });
      }
    }

    // Log the global sync result
    await db.insert(syncLogs).values({
      id: randomUUID(),
      datetime: new Date().toISOString(),
      status: results.some(r => r.status === 'failed') ? 'partial' : 'success',
      triggerType: 'manual',
      summary: `Sync completed for ${results.length} users. ${results.filter(r => r.salesCreated > 0).length} users had new sales.`,
      details: JSON.stringify(results)
    }).run();

    return {
      period: report.period,
      results
    };
  },

  /**
   * Retrieves global statistics for billing and synchronization.
   */
  getSalesStats: async () => {
    const { fromStr, toStr } = await reportsService.getPeriodDates();
    const monthStr = fromStr.slice(0, 7);

    // 1. Total sales (pages) this billing month
    const salesVolume = await db
      .select({ total: sql<number>`SUM(${nexudusSales.quantity})` })
      .from(nexudusSales)
      .where(eq(nexudusSales.month, monthStr))
      .get();

    // 2. Users pending sync (count users in current report with total > 0)
    const pendingReport = await reportsService.getMonthlyAccumulation();
    const usersPendingSync = pendingReport.data.filter((u: any) => u.total > 0).length;

    return {
      totalSalesThisMonth: Number(salesVolume?.total || 0),
      usersPendingSync,
      period: { from: fromStr, to: toStr }
    };
  },

  /**
   * Performs an automated rollback of a synchronization event.
   * Business Logic: Deletes in Nexudus -> Reverts local copy status -> Deletes sync record.
   * If force is true, fails in Nexudus will be logged but won't stop the local cleanup.
   */
  rollbackSyncEvent: async (localId: string, force: boolean = false) => {
    // 1. Get the local sync record
    const sale = await db.select().from(nexudusSales).where(eq(nexudusSales.id, localId)).get();
    if (!sale) throw new Error('Sync record not found.');

    // 2. Delete in Nexudus
    const remoteId = parseInt(sale.nexudusSaleId);
    if (!isNaN(remoteId)) {
      try {
        await nexudusService.deleteCoworkerProduct(remoteId);
      } catch (err: any) {
        if (force) {
          console.warn(`[WARNING] Nexudus rollback failed for sale ${remoteId}, but proceeding with local cleanup due to force=true: ${err.message}`);
        } else {
          // Add context to error to inform it could be forced
          const error = new Error(`Nexudus deletion failed: ${err.message}. If the item was already deleted or invoiced in Nexudus, use the "Force" option.`);
          (error as any).statusCode = 400;
          throw error;
        }
      }
    }

    // 3. Local Transaccional Cleanup
    db.transaction((tx: any) => {
      // Release individual copies
      tx.update(copies)
        .set({ nexudusSaleId: null })
        .where(eq(copies.nexudusSaleId, localId))
        .run();

      // Delete the sync event record
      tx.delete(nexudusSales)
        .where(eq(nexudusSales.id, localId))
        .run();
    });

    return { localId, remoteId, status: 'rolled_back' };
  },

  /**
   * Performs a collective rollback of multiple sales (a 'cobro' group).
   */
  rollbackSyncGroup: async (localIds: string[], force: boolean = false) => {
    const results: any[] = [];
    for (const id of localIds) {
      const res = await billingService.rollbackSyncEvent(id, force);
      results.push(res);
    }
    return results;
  }
};
