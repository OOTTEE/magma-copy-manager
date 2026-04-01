import { db } from '../../db';
import { users, copies } from '../../db/schema';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { settingsService } from '../settings/settings.service';

/**
 * Reports Service
 * 
 * Handles complex aggregations and data processing for business reports.
 */
export const reportsService = {
  /**
   * Calculates the accumulated copy counts for the current billing period (27th to 27th).
   */
  getMonthlyAccumulation: async () => {
    const now = new Date();
    const cycleDay = parseInt(await settingsService.getSetting('billing_cycle_day'), 10) || 27;
    
    // Period Logic: From the Nth of the previous month to the Nth of the current (or next) month.
    // If today is April 1st and cycleDay is 27, start is March 27th, end is April 27th.
    let startDate = new Date(now.getFullYear(), now.getMonth(), cycleDay, 0, 0, 0);
    if (now.getDate() < cycleDay) {
      startDate.setMonth(startDate.getMonth() - 1);
    }
    
    let endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setSeconds(endDate.getSeconds() - 1);

    const fromStr = startDate.toISOString();
    const toStr = endDate.toISOString();

    // Aggregation Query: Summing increments grouped by user
    const results = await db
      .select({
        id: users.id,
        username: users.username,
        printUser: users.printUser,
        a4Color: sql<number>`SUM(${copies.a4Color})`,
        a4Bw: sql<number>`SUM(${copies.a4Bw})`,
        a3Color: sql<number>`SUM(${copies.a3Color})`,
        a3Bw: sql<number>`SUM(${copies.a3Bw})`,
      })
      .from(users)
      .leftJoin(copies, eq(users.id, copies.userId))
      .where(and(gte(copies.datetime, fromStr), lte(copies.datetime, toStr)))
      .groupBy(users.id);

    return {
      period: {
        from: fromStr,
        to: toStr
      },
      data: results.map(r => ({
        ...r,
        a4Color: Number(r.a4Color || 0),
        a4Bw: Number(r.a4Bw || 0),
        a3Color: Number(r.a3Color || 0),
        a3Bw: Number(r.a3Bw || 0),
        total: Number(r.a4Color || 0) + Number(r.a4Bw || 0) + Number(r.a3Color || 0) + Number(r.a3Bw || 0)
      }))
    };
  }
};
