import { db } from '../../db';
import { users, copies, nexudusSales, userNexudusAccounts, consumptionDistributions } from '../../db/schema';
import { eq, and, sql, gte, lte, isNull, desc } from 'drizzle-orm';
import { settingsService } from '../settings/settings.service';

/**
 * Reports Service
 *
 * Handles complex aggregations, period discovery, and data processing for business reports.
 */
export const reportsService = {
  /**
   * Internal helper to calculate period dates.
   * Supports offset in months (number) or explicit month format "YYYY-MM" (string).
   */
  getPeriodDates: async (offsetOrMonth: number | string = 0) => {
    const cycleDay = parseInt(await settingsService.getSetting('billing_cycle_day'), 10) || 27;

    if (typeof offsetOrMonth === 'string' && /^\d{4}-\d{2}$/.test(offsetOrMonth)) {
      const [yearStr, monthStr] = offsetOrMonth.split('-');
      const year = parseInt(yearStr, 10);
      const monthIndex = parseInt(monthStr, 10) - 1; // 0-indexed month of endDate

      const startDate = new Date(year, monthIndex - 1, cycleDay, 0, 0, 0);
      const endDate = new Date(year, monthIndex, cycleDay, 0, 0, 0);
      endDate.setSeconds(endDate.getSeconds() - 1);

      return {
        fromStr: startDate.toISOString(),
        toStr: endDate.toISOString(),
        periodMonth: offsetOrMonth
      };
    }

    const offsetMonths = typeof offsetOrMonth === 'number' ? offsetOrMonth : 0;
    const now = new Date();
    if (offsetMonths !== 0) {
      now.setMonth(now.getMonth() + offsetMonths);
    }

    let startDate = new Date(now.getFullYear(), now.getMonth(), cycleDay, 0, 0, 0);
    if (now.getDate() < cycleDay) {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    let endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setSeconds(endDate.getSeconds() - 1);

    const periodMonth = endDate.toISOString().slice(0, 7);

    return {
      fromStr: startDate.toISOString(),
      toStr: endDate.toISOString(),
      periodMonth
    };
  },

  /**
   * Discovers all monthly periods with activity and returns summary KPIs.
   */
  getAvailablePeriods: async (limit = 12) => {
    const currentPeriod = await reportsService.getPeriodDates(0);
    const prevPeriod = await reportsService.getPeriodDates(-1);

    const monthSet = new Set<string>();
    monthSet.add(currentPeriod.periodMonth);
    monthSet.add(prevPeriod.periodMonth);

    // Query distinct months from copies and nexudus_sales
    try {
      const copyMonths = await db.select({
        month: sql<string>`DISTINCT substr(${copies.datetime}, 1, 7)`
      }).from(copies);
      for (const r of copyMonths) {
        if (r.month) monthSet.add(r.month);
      }
    } catch {
      // Ignored if table empty
    }

    try {
      const saleMonths = await db.select({
        month: sql<string>`DISTINCT ${nexudusSales.month}`
      }).from(nexudusSales);
      for (const r of saleMonths) {
        if (r.month) monthSet.add(r.month);
      }
    } catch {
      // Ignored if table empty
    }

    const sortedMonths = Array.from(monthSet).sort().reverse().slice(0, limit);

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const periods = [];
    for (const m of sortedMonths) {
      const dates = await reportsService.getPeriodDates(m);
      const [year, monthNum] = m.split('-');
      const name = `${monthNames[parseInt(monthNum, 10) - 1]} ${year}`;

      const accumulation = await reportsService.getMonthlyAccumulation({ period: m, filter: 'all' });

      let totalCopies = 0;
      let linkedCopies = 0;
      let pendingCopies = 0;
      let syncedCopies = 0;
      let unlinkedUsersCount = 0;
      let totalUsersCount = 0;

      for (const item of accumulation.data) {
        if (item.isIgnored) continue;
        totalUsersCount++;
        if (!item.hasLinkedAccount && item.total > 0) {
          unlinkedUsersCount++;
        }
        totalCopies += item.total;
        linkedCopies += (item.copies?.linked ?? item.total);
        pendingCopies += (item.copies?.pending ?? 0);
        syncedCopies += (item.copies?.synced ?? 0);
      }

      let status: 'billed' | 'partial' | 'pending' = 'pending';
      if (totalCopies > 0 && syncedCopies >= totalCopies) {
        status = 'billed';
      } else if (syncedCopies > 0) {
        status = 'partial';
      }

      periods.push({
        period: m,
        name,
        from: dates.fromStr,
        to: dates.toStr,
        isCurrent: m === currentPeriod.periodMonth,
        status,
        metrics: {
          totalCopies,
          linkedCopies,
          pendingCopies,
          syncedCopies,
          unlinkedUsersCount,
          totalUsersCount
        }
      });
    }

    return periods;
  },

  /**
   * Calculates the accumulated copy counts for a given period or all pending.
   * Categorizes copies into linked vs pending, filters ignored and unlinked users by default.
   */
  getMonthlyAccumulation: async (options: {
    period?: string;
    from?: string;
    to?: string;
    includeAllPending?: boolean;
    filter?: 'linked' | 'unlinked' | 'all';
    includeIgnored?: boolean;
  } = {}) => {
    const {
      period,
      includeAllPending = false,
      filter = 'linked',
      includeIgnored = false
    } = options;

    let { fromStr, toStr, periodMonth } = await reportsService.getPeriodDates(period || 0);
    if (options.from) fromStr = options.from;
    if (options.to) toStr = options.to;
    const currentMonthStr = period || periodMonth || fromStr.slice(0, 7);

    // 1. Get users
    let allUsers = await db.select().from(users);
    if (!includeIgnored) {
      allUsers = allUsers.filter((u: any) => !u.isIgnored);
    }

    // 2. Get user accounts
    const allAccounts = await db.select().from(userNexudusAccounts);
    const accountsByUser: Record<string, any[]> = {};
    for (const acc of allAccounts) {
      if (!accountsByUser[acc.userId]) accountsByUser[acc.userId] = [];
      accountsByUser[acc.userId].push(acc);
    }

    // 3. Get distributions for this month
    const allDistributions = await db.select().from(consumptionDistributions)
      .where(eq(consumptionDistributions.month, currentMonthStr));
    const distributionsByUser: Record<string, any[]> = {};
    for (const d of allDistributions) {
      if (!distributionsByUser[d.userId]) distributionsByUser[d.userId] = [];
      distributionsByUser[d.userId].push(d);
    }

    // 4. Query copy aggregates per user
    let copyDateFilter = and(
      gte(copies.datetime, fromStr),
      lte(copies.datetime, toStr)
    );
    if (includeAllPending) {
      copyDateFilter = undefined;
    }

    const copyQuery = copyDateFilter
      ? db.select({
          userId: copies.userId,
          a4Color: sql<number>`SUM(${copies.a4Color})`,
          a4Bw: sql<number>`SUM(${copies.a4Bw})`,
          a3Color: sql<number>`SUM(${copies.a3Color})`,
          a3Bw: sql<number>`SUM(${copies.a3Bw})`,
          unbilledA4Color: sql<number>`SUM(CASE WHEN ${copies.nexudusSaleId} IS NULL THEN ${copies.a4Color} ELSE 0 END)`,
          unbilledA4Bw: sql<number>`SUM(CASE WHEN ${copies.nexudusSaleId} IS NULL THEN ${copies.a4Bw} ELSE 0 END)`,
          unbilledA3Color: sql<number>`SUM(CASE WHEN ${copies.nexudusSaleId} IS NULL THEN ${copies.a3Color} ELSE 0 END)`,
          unbilledA3Bw: sql<number>`SUM(CASE WHEN ${copies.nexudusSaleId} IS NULL THEN ${copies.a3Bw} ELSE 0 END)`,
          billedA4Color: sql<number>`SUM(CASE WHEN ${copies.nexudusSaleId} IS NOT NULL THEN ${copies.a4Color} ELSE 0 END)`,
          billedA4Bw: sql<number>`SUM(CASE WHEN ${copies.nexudusSaleId} IS NOT NULL THEN ${copies.a4Bw} ELSE 0 END)`,
          billedA3Color: sql<number>`SUM(CASE WHEN ${copies.nexudusSaleId} IS NOT NULL THEN ${copies.a3Color} ELSE 0 END)`,
          billedA3Bw: sql<number>`SUM(CASE WHEN ${copies.nexudusSaleId} IS NOT NULL THEN ${copies.a3Bw} ELSE 0 END)`,
        }).from(copies).where(copyDateFilter).groupBy(copies.userId)
      : db.select({
          userId: copies.userId,
          a4Color: sql<number>`SUM(${copies.a4Color})`,
          a4Bw: sql<number>`SUM(${copies.a4Bw})`,
          a3Color: sql<number>`SUM(${copies.a3Color})`,
          a3Bw: sql<number>`SUM(${copies.a3Bw})`,
          unbilledA4Color: sql<number>`SUM(CASE WHEN ${copies.nexudusSaleId} IS NULL THEN ${copies.a4Color} ELSE 0 END)`,
          unbilledA4Bw: sql<number>`SUM(CASE WHEN ${copies.nexudusSaleId} IS NULL THEN ${copies.a4Bw} ELSE 0 END)`,
          unbilledA3Color: sql<number>`SUM(CASE WHEN ${copies.nexudusSaleId} IS NULL THEN ${copies.a3Color} ELSE 0 END)`,
          unbilledA3Bw: sql<number>`SUM(CASE WHEN ${copies.nexudusSaleId} IS NULL THEN ${copies.a3Bw} ELSE 0 END)`,
          billedA4Color: sql<number>`SUM(CASE WHEN ${copies.nexudusSaleId} IS NOT NULL THEN ${copies.a4Color} ELSE 0 END)`,
          billedA4Bw: sql<number>`SUM(CASE WHEN ${copies.nexudusSaleId} IS NOT NULL THEN ${copies.a4Bw} ELSE 0 END)`,
          billedA3Color: sql<number>`SUM(CASE WHEN ${copies.nexudusSaleId} IS NOT NULL THEN ${copies.a3Color} ELSE 0 END)`,
          billedA3Bw: sql<number>`SUM(CASE WHEN ${copies.nexudusSaleId} IS NOT NULL THEN ${copies.a3Bw} ELSE 0 END)`,
        }).from(copies).groupBy(copies.userId);

    const copyResults = await copyQuery;
    const copiesByUser: Record<string, any> = {};
    for (const c of copyResults) {
      copiesByUser[c.userId] = c;
    }

    const mappedResults = [];
    for (const user of allUsers) {
      const userAccs = accountsByUser[user.id] || [];
      const hasLinkedAccount = userAccs.length > 0 || Boolean(user.nexudusUser);

      // Filtering rule
      if (filter === 'linked' && !hasLinkedAccount) continue;
      if (filter === 'unlinked' && hasLinkedAccount) continue;

      const rawCopies = copiesByUser[user.id] || {
        a4Color: 0, a4Bw: 0, a3Color: 0, a3Bw: 0,
        unbilledA4Color: 0, unbilledA4Bw: 0, unbilledA3Color: 0, unbilledA3Bw: 0,
        billedA4Color: 0, billedA4Bw: 0, billedA3Color: 0, billedA3Bw: 0
      };

      const userDistributions = distributionsByUser[user.id] || [];

      const isSRA3 = Boolean(user.a3NoPaperMode);

      const a4Color = Number(rawCopies.a4Color || 0);
      const a4Bw = Number(rawCopies.a4Bw || 0);
      const a3ColorRaw = Number(rawCopies.a3Color || 0);
      const a3BwRaw = Number(rawCopies.a3Bw || 0);
      const total = a4Color + a4Bw + a3ColorRaw + a3BwRaw;

      const billedA4Color = Number(rawCopies.billedA4Color || 0);
      const billedA4Bw = Number(rawCopies.billedA4Bw || 0);
      const billedA3ColorRaw = Number(rawCopies.billedA3Color || 0);
      const billedA3BwRaw = Number(rawCopies.billedA3Bw || 0);
      const syncedTotal = billedA4Color + billedA4Bw + billedA3ColorRaw + billedA3BwRaw;

      let distributedUnbilledTotal = 0;
      for (const d of userDistributions) {
        distributedUnbilledTotal += d.quantity;
      }

      let linkedTotal = syncedTotal;
      let pendingTotal = 0;
      if (hasLinkedAccount) {
        if (userDistributions.length > 0) {
          linkedTotal = syncedTotal + distributedUnbilledTotal;
          pendingTotal = Math.max(0, total - linkedTotal);
        } else {
          linkedTotal = total;
          pendingTotal = 0;
        }
      } else {
        linkedTotal = 0;
        pendingTotal = total;
      }

      let userStatus: 'billed' | 'partial' | 'pending' = 'pending';
      if (total > 0 && syncedTotal >= total) {
        userStatus = 'billed';
      } else if (syncedTotal > 0) {
        userStatus = 'partial';
      }

      mappedResults.push({
        id: user.id,
        userId: user.id,
        username: user.username,
        printUser: user.printUser,
        nexudusUser: user.nexudusUser,
        role: user.role,
        isIgnored: Boolean(user.isIgnored),
        hasLinkedAccount,
        accountsCount: userAccs.length,
        status: userStatus,
        a4Color,
        a4Bw,
        a3Color: isSRA3 ? 0 : a3ColorRaw,
        a3Bw: isSRA3 ? 0 : a3BwRaw,
        sra3Color: isSRA3 ? a3ColorRaw : 0,
        sra3Bw: isSRA3 ? a3BwRaw : 0,
        a3NoPaperMode: isSRA3,
        total,
        copies: {
          total,
          linked: linkedTotal,
          pending: pendingTotal,
          synced: syncedTotal,
          byType: {
            a4Color: { total: a4Color, billed: billedA4Color },
            a4Bw: { total: a4Bw, billed: billedA4Bw },
            a3Color: { total: isSRA3 ? 0 : a3ColorRaw, billed: isSRA3 ? 0 : billedA3ColorRaw },
            a3Bw: { total: isSRA3 ? 0 : a3BwRaw, billed: isSRA3 ? 0 : billedA3BwRaw },
            sra3Color: { total: isSRA3 ? a3ColorRaw : 0, billed: isSRA3 ? billedA3ColorRaw : 0 },
            sra3Bw: { total: isSRA3 ? a3BwRaw : 0, billed: isSRA3 ? billedA3BwRaw : 0 },
          }
        },
        accounts: userAccs.map((acc: any) => ({
          id: acc.id,
          nexudusUserId: acc.nexudusUserId,
          isDefault: acc.isDefault === 1,
          createdOn: acc.createdOn
        }))
      });
    }

    return {
      period: {
        month: currentMonthStr,
        from: fromStr,
        to: toStr,
        allPending: includeAllPending
      },
      data: mappedResults
    };
  },

  /**
   * Calculates accumulation for a single user.
   */
  getMonthlyAccumulationForUser: async (userId: string, options: {
    period?: string;
    from?: string;
    to?: string;
    includeAllPending?: boolean;
  } = {}) => {
    const report = await reportsService.getMonthlyAccumulation({
      ...options,
      filter: 'all',
      includeIgnored: true
    });

    const userData = report.data.find(u => u.id === userId);
    if (!userData) return null;

    const latestSync = await db.select()
      .from(nexudusSales)
      .where(and(
        eq(nexudusSales.userId, userId),
        eq(nexudusSales.month, report.period.month)
      ))
      .orderBy(desc(nexudusSales.saleDate))
      .get();

    return {
      period: report.period,
      lastSyncDate: latestSync?.saleDate || null,
      data: userData
    };
  },

  /**
   * Retrieves summary of unlinked orphan users with copy activity.
   */
  getUnlinkedOrphansSummary: async (period?: string) => {
    const accumulation = await reportsService.getMonthlyAccumulation({
      period,
      filter: 'unlinked',
      includeIgnored: false
    });

    return accumulation.data
      .filter((u: any) => u.total > 0)
      .map((u: any) => ({
        id: u.id,
        username: u.username,
        printUser: u.printUser,
        totalCopies: u.total,
        a4Color: u.a4Color,
        a4Bw: u.a4Bw,
        a3Color: u.a3Color,
        a3Bw: u.a3Bw,
        sra3Color: u.sra3Color,
        sra3Bw: u.sra3Bw
      }));
  },

  /**
   * Maps raw SQL aggregation results to domain reporting object.
   * Kept for unit test compatibility.
   */
  mapAccumulationResult: (r: any) => {
    const isSRA3 = Boolean(r.a3NoPaperMode);
    const a4Color = Number(r.a4Color || 0);
    const a4Bw = Number(r.a4Bw || 0);
    const a3ColorRaw = Number(r.a3Color || 0);
    const a3BwRaw = Number(r.a3Bw || 0);
    const accountsCount = Number(r.accountsCount || 0);
    const hasLinkedAccount = accountsCount > 0 || Boolean(r.nexudusUser);

    return {
      ...r,
      userId: r.id,
      hasLinkedAccount,
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
