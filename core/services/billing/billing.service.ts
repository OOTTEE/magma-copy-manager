import { reportsService } from '../reports/reports.service';
import { settingsService } from '../settings/settings.service';
import { nexudusService } from '../nexudus/nexudus.service';
import { db } from '../../db';
import { copies, nexudusSales, syncLogs } from '../../db/schema';
import { eq, and, sql, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * Billing Service
 * 
 * Handles invoice generation and simulation logic.
 */
export const billingService = {
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
   * Retrieves paginated synchronization history from Nexudus sales.
   */
  getPaginatedSales: async (params: { 
    page: number; 
    limit: number; 
    userIds?: string[]; 
    months?: string[] 
  }) => {
    const { page, limit, userIds, months } = params;
    const offset = (page - 1) * limit;

    let query = db
      .select({
        id: nexudusSales.id,
        userId: nexudusSales.userId,
        username: sql<string>`users.username`,
        month: nexudusSales.month,
        type: nexudusSales.type,
        quantity: nexudusSales.quantity,
        nexudusSaleId: nexudusSales.nexudusSaleId,
        createdOn: nexudusSales.createdOn,
      })
      .from(nexudusSales)
      .innerJoin(sql`users`, sql`users.id = ${nexudusSales.userId}`);

    const conditions = [];
    if (userIds && userIds.length > 0) {
      conditions.push(sql`${nexudusSales.userId} IN ${userIds}`);
    }
    if (months && months.length > 0) {
      conditions.push(sql`${nexudusSales.month} IN ${months}`);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const data = await (query.limit(limit).offset(offset) as any);
    
    // Count total for pagination
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(nexudusSales);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions)) as any;
    }
    const totalResult = await countQuery.get();
    const total = totalResult?.count || 0;

    return {
      data,
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
        nexudusProductId: nexudusSales.nexudusProductId,
        saleDate: nexudusSales.saleDate,
        createdOn: nexudusSales.createdOn,
      })
      .from(nexudusSales)
      .innerJoin(sql`users`, sql`users.id = ${nexudusSales.userId}`)
      .where(eq(nexudusSales.id, id))
      .get();
  },

  /**
   * Synchronizes consumption to Nexudus for a single user.
   */
  syncUserConsumption: async (userId: string) => {
    const report = await reportsService.getMonthlyAccumulationForUser(userId);
    if (!report) throw new Error('No report data found for user');
    
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
    let salesCreated = 0;

    for (const type of copyTypes) {
      const quantity = report.data[type];
      const nexudusProductId = typeToProductIdMap[type];

      if (quantity > 0 && nexudusProductId) {
        // Check local sync
        const existingSync = await db.select().from(nexudusSales).where(and(
          eq(nexudusSales.userId, userId),
          eq(nexudusSales.month, monthStr),
          eq(nexudusSales.type, type)
        )).get();

        if (existingSync) continue;

        // Create in Nexudus
        const saleDate = new Date().toISOString();
        const nexudusResponse = await nexudusService.createCoworkerProduct({
          CoworkerId: parseInt(report.data.nexudusUser || '0'),
          ProductId: parseInt(nexudusProductId),
          Quantity: quantity,
          SaleDate: saleDate,
          Notes: `Sync Magma - ${monthStr} - ${type}`,
          InvoiceThisCoworker: false
        });

        if (nexudusResponse.WasSuccessful && nexudusResponse.Value) {
          const remoteSaleId = (nexudusResponse.Value as any).Id?.toString() || 'unknown';
          const localSaleId = randomUUID();

          await db.transaction(async (tx) => {
            tx.insert(nexudusSales).values({
              id: localSaleId,
              userId: userId,
              month: monthStr,
              type: type,
              quantity: quantity,
              nexudusSaleId: remoteSaleId,
              nexudusProductId: nexudusProductId,
              saleDate: saleDate,
              createdOn: new Date().toISOString()
            }).run();

            // Link individual copies
            tx.update(copies)
              .set({ nexudusSaleId: localSaleId })
              .where(and(
                eq(copies.userId, userId),
                sql`${copies.datetime} >= ${report.period.from}`,
                sql`${copies.datetime} <= ${report.period.to}`,
                sql`${copies[type as keyof typeof copies]} > 0`,
                isNull(copies.nexudusSaleId)
              )).run();
          });
          salesCreated++;
        }
      }
    }

    return { userId, salesCreated };
  },

  /**
   * Global synchronization job.
   */
  syncMonthlyConsumption: async () => {
    const report = await reportsService.getMonthlyAccumulation();
    const results: any[] = [];
    
    for (const userData of report.data) {
      if (!userData.nexudusUser) continue;
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
  }
};
