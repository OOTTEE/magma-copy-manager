import { db } from '../../db';
import { users, copies, nexudusSales } from '../../db/schema';
import { eq, and, sql, gte, lte, isNull, desc } from 'drizzle-orm';
import { settingsService } from '../settings/settings.service';

/**
 * Reports Service
 * 
 * Handles complex aggregations and data processing for business reports.
 */
export const reportsService = {
  /**
   * Internal helper to calculate the current billing period dates.
   */
  getPeriodDates: async () => {
    const now = new Date();
    const cycleDay = parseInt(await settingsService.getSetting('billing_cycle_day'), 10) || 27;
    
    let startDate = new Date(now.getFullYear(), now.getMonth(), cycleDay, 0, 0, 0);
    if (now.getDate() < cycleDay) {
      startDate.setMonth(startDate.getMonth() - 1);
    }
    
    let endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setSeconds(endDate.getSeconds() - 1);

    return {
      fromStr: startDate.toISOString(),
      toStr: endDate.toISOString()
    };
  },

  /**
   * Calculates the accumulated copy counts for a given period or all pending.
   */
  getMonthlyAccumulation: async (options: { from?: string; to?: string; includeAllPending?: boolean } = {}) => {
    const { includeAllPending = false } = options;
    let { fromStr, toStr } = await reportsService.getPeriodDates();
    
    // Override with options if provided
    if (options.from) fromStr = options.from;
    if (options.to) toStr = options.to;

    // Filter construction for copies
    let copyFilters = and(
      eq(users.id, copies.userId),
      isNull(copies.nexudusSaleId)
    );

    if (!includeAllPending) {
      copyFilters = and(
        copyFilters,
        gte(copies.datetime, fromStr), 
        lte(copies.datetime, toStr)
      );
    }

    // Aggregation Query: Summing increments grouped by user
    const results = await db
      .select({
        id: users.id,
        username: users.username,
        printUser: users.printUser,
        nexudusUser: users.nexudusUser,
        a4Color: sql<number>`SUM(${copies.a4Color})`,
        a4Bw: sql<number>`SUM(${copies.a4Bw})`,
        a3Color: sql<number>`SUM(${copies.a3Color})`,
        a3Bw: sql<number>`SUM(${copies.a3Bw})`,
        a3NoPaperMode: users.a3NoPaperMode,
      })
      .from(users)
      .leftJoin(copies, copyFilters)
      .groupBy(users.id, users.a3NoPaperMode, users.nexudusUser);

    return {
      period: { from: fromStr, to: toStr, allPending: includeAllPending },
      data: results.map((r: any) => reportsService.mapAccumulationResult(r))
    };
  },

  /**
   * Calculates accumulation for a single user.
   */
  getMonthlyAccumulationForUser: async (userId: string, options: { from?: string; to?: string; includeAllPending?: boolean } = {}) => {
    const { includeAllPending = false } = options;
    let { fromStr, toStr } = await reportsService.getPeriodDates();
    
    // Override with options if provided
    if (options.from) fromStr = options.from;
    if (options.to) toStr = options.to;

    // Filter construction for copies
    let copyFilters = and(
      eq(users.id, copies.userId),
      isNull(copies.nexudusSaleId)
    );

    if (!includeAllPending) {
      copyFilters = and(
        copyFilters,
        gte(copies.datetime, fromStr), 
        lte(copies.datetime, toStr)
      );
    }

    const result = await db
      .select({
        id: users.id,
        username: users.username,
        printUser: users.printUser,
        nexudusUser: users.nexudusUser,
        a4Color: sql<number>`SUM(${copies.a4Color})`,
        a4Bw: sql<number>`SUM(${copies.a4Bw})`,
        a3Color: sql<number>`SUM(${copies.a3Color})`,
        a3Bw: sql<number>`SUM(${copies.a3Bw})`,
        a3NoPaperMode: users.a3NoPaperMode,
      })
      .from(users)
      .leftJoin(copies, copyFilters)
      .where(eq(users.id, userId))
      .groupBy(users.id, users.a3NoPaperMode, users.nexudusUser)
      .get();

    if (!result) return null;

    // Buscar información de la última vinculación en este mes
    const monthStr = fromStr.slice(0, 7);
    const latestSync = await db.select()
      .from(nexudusSales)
      .where(and(
        eq(nexudusSales.userId, userId),
        eq(nexudusSales.month, monthStr)
      ))
      .orderBy(desc(nexudusSales.saleDate))
      .get();

    return {
      period: { from: fromStr, to: toStr, allPending: includeAllPending },
      lastSyncDate: latestSync?.saleDate || null,
      data: reportsService.mapAccumulationResult(result)
    };
  },

  /**
   * Maps raw SQL aggregation results to domain reporting object.
   */
  mapAccumulationResult: (r: any) => {
    const isSRA3 = Boolean(r.a3NoPaperMode);
    const a4Color = Number(r.a4Color || 0);
    const a4Bw = Number(r.a4Bw || 0);
    const a3ColorRaw = Number(r.a3Color || 0);
    const a3BwRaw = Number(r.a3Bw || 0);

    return {
      ...r,
      userId: r.id,
      a4Color,
      a4Bw,
      a3Color: isSRA3 ? 0 : a3ColorRaw,
      a3Bw: isSRA3 ? 0 : a3BwRaw,
      sra3Color: isSRA3 ? a3ColorRaw : 0,
      sra3Bw: isSRA3 ? a3BwRaw : 0,
      a3NoPaperMode: isSRA3,
      total: a4Color + a4Bw + a3ColorRaw + a3BwRaw
    };
  }
};
