import { reportsService } from '../reports/reports.service';
import { settingsService } from '../settings/settings.service';
import { nexudusService } from '../nexudus/nexudus.service';
import { db } from '../../db';
import { copies, nexudusSales, syncLogs, users, userNexudusAccounts } from '../../db/schema';
import { eq, and, sql, isNull, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { logger } from '../../lib/logger';

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
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${d.getFullYear()}`;
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
        na.nex_user_id as nexudusCoworkerId,
        ns.month as month,
        ns.sale_date as saleDate,
        SUM(ns.quantity) as totalQuantity,
        json_group_array(json_object(
          'id', ns.id,
          'type', ns.type,
          'quantity', ns.quantity,
          'nexudusSaleId', ns.nexudus_sale_id
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
   * Synchronizes consumption to Nexudus for a single user.
   */
  syncUserConsumption: async (userId: string, customNote?: string, nexudusAccountId?: string) => {
    const report = await reportsService.getMonthlyAccumulationForUser(userId);
    if (!report) throw new Error('No report data found for user');

    // Identificar cuenta nexudus a utilizar
    let account;
    if (nexudusAccountId) {
      account = await db.select().from(userNexudusAccounts).where(eq(userNexudusAccounts.id, nexudusAccountId)).get();
    } else {
      // 1. Intentar buscar la cuenta predeterminada
      account = await db.select().from(userNexudusAccounts).where(and(
        eq(userNexudusAccounts.userId, userId),
        eq(userNexudusAccounts.isDefault, 1)
      )).get();

      // 2. Fallback: Si no hay predeterminada, tomar la primera de la lista
      if (!account) {
        account = await db.select().from(userNexudusAccounts).where(eq(userNexudusAccounts.userId, userId)).get();
        if (account) {
          logger.warn({ userId, username: report.data.username }, 'Billing: No default Nexudus account found. Using first available as fallback.');
        }
      }
    }

    if (!account) {
      throw new Error(`User ${report.data.username} has no valid Nexudus account configured.`);
    }
    
    const settings = await settingsService.getAllSettings();
    const monthStr = report.period.from.slice(0, 7);
    
    const typeToProductIdMap: Record<string, string> = {
      'a4Bw': settings.nexudus_product_id_a4bw,
      'a4Color': settings.nexudus_product_id_a4color,
      'a3Bw': settings.nexudus_product_id_a3bw,
      'a3Color': settings.nexudus_product_id_a3color,
      'sra3Bw': settings.nexudus_product_id_sra3bw,
      'sra3Color': settings.nexudus_product_id_sra3color,
    };

    const copyTypes = ['a4Bw', 'a4Color', 'a3Bw', 'a3Color', 'sra3Bw', 'sra3Color'];
    const pendingSales = [];

    // 1. Identificar consumos pendientes
    for (const type of copyTypes) {
      const quantity = report.data[type];
      const nexudusProductId = typeToProductIdMap[type];

      if (quantity > 0 && nexudusProductId) {
        const existingSync = await db.select().from(nexudusSales).where(and(
          eq(nexudusSales.userId, userId),
          eq(nexudusSales.month, monthStr),
          eq(nexudusSales.type, type)
        )).get();

        if (!existingSync) {
          pendingSales.push({ type, quantity, nexudusProductId });
        }
      }
    }

    if (pendingSales.length === 0) return { userId, salesCreated: 0 };

    // 2. Calcular Periodo para la Nota
    const latestSync = await db.select()
      .from(nexudusSales)
      .where(and(
        eq(nexudusSales.userId, userId),
        eq(nexudusSales.month, monthStr)
      ))
      .orderBy(desc(nexudusSales.saleDate))
      .get();

    const inicioPeriodo = latestSync ? latestSync.saleDate : report.period.from;
    const fechaActual = new Date().toISOString();
    const periodNote = `Periodo: ${billingService.formatDate(inicioPeriodo)} - ${billingService.formatDate(fechaActual)}`;

    const createdNexudusIds: number[] = [];
    const salesToPersist: any[] = [];
    const saleDate = fechaActual;

    try {
      // 3. Ejecutar cobros en Nexudus (Fase de Cobro)
      for (const sale of pendingSales) {
        const nexudusResponse = await nexudusService.createCoworkerProduct({
          BusinessId: parseInt(settings.nexudus_business_id || '0'),
          CoworkerId: parseInt(account.nexudusUserId || '0'),
          ProductId: parseInt(sale.nexudusProductId),
          Quantity: sale.quantity,
          SaleDate: saleDate,
          Notes: customNote || periodNote,
          InvoiceThisCoworker: false
        });

        if (!nexudusResponse.WasSuccessful || !nexudusResponse.Value) {
          throw new Error(`Nexudus error for ${sale.type}: ${nexudusResponse.Message || 'Unknown error'}`);
        }

        const remoteId = (nexudusResponse.Value as any).Id;
        createdNexudusIds.push(remoteId);
        salesToPersist.push({
          ...sale,
          remoteId: remoteId.toString()
        });
      }

          // 3. Persistir localmente en una única transacción (Fase de Compromiso)
          try {
            db.transaction((tx) => {
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
                  nexudusAccountId: account.id,
                  saleDate: saleDate,
                  createdOn: new Date().toISOString()
                }).run();

                // Mapeo de columnas: sra3Color -> a3Color, sra3Bw -> a3Bw
                const getPhysicalColumn = (type: string) => {
                  if (type === 'sra3Color') return copies.a3Color;
                  if (type === 'sra3Bw') return copies.a3Bw;
                  return copies[type as keyof typeof copies];
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
            });
          } catch (dbError: any) {
        console.error(`[CRITICAL] DB Transaction failed for user ${userId}. Rolling back Nexudus sales.`);
        throw dbError; // Capturado por el bloque catch exterior para compensar en Nexudus
      }

    } catch (error: any) {
      // 4. Rollback Compensatorio en Nexudus (Todo o Nada)
      if (createdNexudusIds.length > 0) {
        console.warn(`[ROLLBACK] Removing ${createdNexudusIds.length} orphan sales from Nexudus for user ${userId}`);
        for (const remoteId of createdNexudusIds) {
          try {
            await nexudusService.deleteCoworkerProduct(remoteId);
          } catch (rollbackErr: any) {
            console.error(`[FATAL] Failed to rollback Nexudus sale ${remoteId}: ${rollbackErr.message}`);
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
    const usersPendingSync = pendingReport.data.filter(u => u.total > 0).length;

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
    db.transaction((tx) => {
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
    const results = [];
    for (const id of localIds) {
      const res = await billingService.rollbackSyncEvent(id, force);
      results.push(res);
    }
    return results;
  }
};
