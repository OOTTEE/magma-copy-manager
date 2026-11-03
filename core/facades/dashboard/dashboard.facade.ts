import { db } from '../../db';
import { nexudusSales, syncLogs, systemNotifications, users, consumptionDistributions } from '../../db/schema';
import { sql, desc, eq, and } from 'drizzle-orm';
import { autoSyncService } from '../../services/automation/auto-sync.service';
import { billingJobService } from '../../services/billing/billing-job.service';
import { reportsService } from '../../services/reports/reports.service';
import { usersService } from '../../services/users/users.service';
import { randomUUID } from 'crypto';

/**
 * Dashboard Facade
 * 
 * Orchestrates technical and business data for the Administrator Dashboard.
 * Focuses on high-level orchestration of stats, logs, and manual triggers.
 */
export const dashboardFacade = {
    /**
     * Aggregates historical copy volume by month.
     */
    getMonthlyStats: async () => {
        // Get last 6 months of sales to show evolution
        const stats = await db
            .select({
                month: nexudusSales.month,
                total: sql<number>`SUM(${nexudusSales.quantity})`
            })
            .from(nexudusSales)
            .groupBy(nexudusSales.month)
            .orderBy(desc(nexudusSales.month))
            .limit(6);

        return stats.reverse(); // Chronological order
    },

    /**
     * Retrieves the latest synchronization and billing events.
     */
    getActivityLog: async () => {
        const syncEvents = await db
            .select({
                id: syncLogs.id,
                datetime: syncLogs.datetime,
                type: sql<string>`'sync'`,
                status: syncLogs.status,
                message: syncLogs.summary
            })
            .from(syncLogs)
            .orderBy(desc(syncLogs.datetime))
            .limit(10);

        return syncEvents;
    },

    /**
     * Manually triggers the printer scraping process.
     */
    runManualSync: async (user: { id: string, role: string }) => {
        return await autoSyncService.runJob(user, 'manual');
    },

    /**
     * Manually triggers the global billing process via async Job.
     */
    runManualBilling: async (user: { id: string; role: string }) => {
        return await billingJobService.runManualBilling(user);
    },

    /**
     * Retrieves unread notifications for a user.
     */
    getPendingNotifications: async (userId: string) => {
        return await db
            .select()
            .from(systemNotifications)
            .where(and(
                eq(systemNotifications.userId, userId),
                eq(systemNotifications.read, 0)
            ))
            .orderBy(desc(systemNotifications.createdAt));
    },

    /**
     * Marks a specific notification as read.
     */
    markNotificationAsRead: async (id: string) => {
        return await db
            .update(systemNotifications)
            .set({ read: 1 })
            .where(eq(systemNotifications.id, id))
            .run();
    },

    /**
     * Aggregates dashboard data for a specific customer.
     */
    getCustomerDashboardData: async (userId: string) => {
        const now = new Date();
        const year = now.getFullYear().toString();
        const nowMonthStr = `${year}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

        // 1. Pending consumption and current period info
        const pendingReport = await reportsService.getMonthlyAccumulationForUser(userId);
        const currentMonth = pendingReport?.period?.month || nowMonthStr;

        // 2. Multi-account detection
        const userAccounts = await usersService.getNexudusAccounts(userId);
        const accountsCount = userAccounts.length;
        const isMultiAccount = accountsCount > 1;

        // 3. Current period usage object
        const userData = pendingReport?.data;
        const currentPeriod = {
            month: currentMonth,
            from: pendingReport?.period?.from || `${currentMonth}-01`,
            to: pendingReport?.period?.to || `${currentMonth}-28`,
            total: userData?.total || 0,
            a4Bw: userData?.a4Bw || 0,
            a4Color: userData?.a4Color || 0,
            a3Bw: userData?.a3Bw || 0,
            a3Color: userData?.a3Color || 0,
            sra3Bw: userData?.sra3Bw || 0,
            sra3Color: userData?.sra3Color || 0,
            isOverAllocated: Boolean(userData?.isOverAllocated),
            syncedCopies: userData?.copies?.synced || 0,
            pendingCopies: userData?.copies?.pending || 0
        };

        // 4. Monthly evolution (YTD) - Consolidates total quantity per month
        const ytdMonthlyExpenses = await db
            .select({
                month: nexudusSales.month,
                total: sql<number>`SUM(${nexudusSales.quantity})`
            })
            .from(nexudusSales)
            .where(and(
                eq(nexudusSales.userId, userId),
                sql`${nexudusSales.month} LIKE ${year + '-%'}`
            ))
            .groupBy(nexudusSales.month)
            .orderBy(nexudusSales.month);

        // 5. Current Month Usage
        const currentMonthUsageRes = await db
            .select({ count: sql<number>`SUM(${nexudusSales.quantity})` })
            .from(nexudusSales)
            .where(and(
                eq(nexudusSales.userId, userId),
                eq(nexudusSales.month, currentMonth)
            ))
            .get();

        // 6. YTD Total
        const ytdTotalRes = await db
            .select({ total: sql<number>`SUM(${nexudusSales.quantity})` })
            .from(nexudusSales)
            .where(and(
                eq(nexudusSales.userId, userId),
                sql`${nexudusSales.month} LIKE ${year + '-%'}`
            ))
            .get();

        // 7. Recent "Invoices" (sessions of sales)
        const recentSessions = await db.all(sql`
            SELECT 
                ns.month as month,
                ns.sale_date as date,
                SUM(ns.quantity) as total,
                json_group_array(ns.type) as types
            FROM nexudus_sales ns
            WHERE ns.user_id = ${userId}
            GROUP BY ns.sale_date
            ORDER BY ns.sale_date DESC
            LIMIT 5
        `);

        const recentInvoices = (recentSessions || []).map((s: any) => ({
            id: s.date,
            from: s.month,
            to: s.date,
            total: s.total,
            status: 'paid'
        }));

        // 8. Historical Closed Cycles: All past sales grouped by month and account
        const pastSales = await db
            .select({
                month: nexudusSales.month,
                type: nexudusSales.type,
                quantity: nexudusSales.quantity,
                nexudusAccountId: nexudusSales.nexudusAccountId,
                saleDate: nexudusSales.saleDate
            })
            .from(nexudusSales)
            .where(and(
                eq(nexudusSales.userId, userId),
                sql`${nexudusSales.month} != ${currentMonth}`
            ))
            .orderBy(desc(nexudusSales.month))
            .all();

        const pastDistributions = await db
            .select({
                month: consumptionDistributions.month,
                nexudusAccountId: consumptionDistributions.nexudusAccountId,
                concept: consumptionDistributions.concept
            })
            .from(consumptionDistributions)
            .where(and(
                eq(consumptionDistributions.userId, userId),
                sql`${consumptionDistributions.month} != ${currentMonth}`
            ))
            .all();

        // Map accounts for quick metadata resolution
        const accountMetadata = new Map<string, { id: string; nexudusUserId: string; accountName: string; isDefault: number }>();
        for (const acc of userAccounts) {
            accountMetadata.set(acc.id, {
                id: acc.id,
                nexudusUserId: acc.nexudusUserId,
                accountName: acc.accountName || `Cuenta ${acc.nexudusUserId}`,
                isDefault: acc.isDefault
            });
        }

        // Group past sales by month
        const cyclesMap = new Map<string, {
            month: string;
            saleDate: string;
            totalCopies: number;
            accounts: Map<string, {
                accountId: string;
                nexudusUserId: string;
                accountName: string;
                isDefault: number;
                totalCopies: number;
                a4Bw: number;
                a4Color: number;
                a3Bw: number;
                a3Color: number;
                sra3Bw: number;
                sra3Color: number;
                concepts: Set<string>;
            }>;
        }>();

        for (const s of (pastSales || [])) {
            if (!cyclesMap.has(s.month)) {
                cyclesMap.set(s.month, {
                    month: s.month,
                    saleDate: s.saleDate,
                    totalCopies: 0,
                    accounts: new Map()
                });
            }
            const cycle = cyclesMap.get(s.month)!;
            cycle.totalCopies += s.quantity;
            if (s.saleDate > cycle.saleDate) cycle.saleDate = s.saleDate;

            const accId = s.nexudusAccountId || 'default';
            if (!cycle.accounts.has(accId)) {
                const meta = accountMetadata.get(accId);
                cycle.accounts.set(accId, {
                    accountId: accId,
                    nexudusUserId: meta?.nexudusUserId || accId,
                    accountName: meta?.accountName || (meta?.nexudusUserId ? `Cuenta ${meta.nexudusUserId}` : 'Cuenta Principal'),
                    isDefault: meta ? meta.isDefault : 1,
                    totalCopies: 0,
                    a4Bw: 0,
                    a4Color: 0,
                    a3Bw: 0,
                    a3Color: 0,
                    sra3Bw: 0,
                    sra3Color: 0,
                    concepts: new Set<string>()
                });
            }
            const accEntry = cycle.accounts.get(accId)!;
            accEntry.totalCopies += s.quantity;
            if (s.type === 'a4Bw') accEntry.a4Bw += s.quantity;
            else if (s.type === 'a4Color') accEntry.a4Color += s.quantity;
            else if (s.type === 'a3Bw') accEntry.a3Bw += s.quantity;
            else if (s.type === 'a3Color') accEntry.a3Color += s.quantity;
            else if (s.type === 'sra3Bw') accEntry.sra3Bw += s.quantity;
            else if (s.type === 'sra3Color') accEntry.sra3Color += s.quantity;
        }

        // Attach concepts from distributions
        for (const dist of (pastDistributions || [])) {
            const cycle = cyclesMap.get(dist.month);
            if (cycle && dist.concept) {
                const accEntry = cycle.accounts.get(dist.nexudusAccountId);
                if (accEntry) {
                    accEntry.concepts.add(dist.concept);
                }
            }
        }

        const formatMonthName = (m: string) => {
            const [y, mon] = m.split('-');
            const d = new Date(parseInt(y, 10), parseInt(mon, 10) - 1, 1);
            const str = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            return str.charAt(0).toUpperCase() + str.slice(1);
        };

        const historicalCycles = Array.from(cyclesMap.values()).map(c => ({
            month: c.month,
            periodName: formatMonthName(c.month),
            saleDate: c.saleDate,
            totalCopies: c.totalCopies,
            accountsCount: c.accounts.size,
            accounts: Array.from(c.accounts.values()).map(a => ({
                accountId: a.accountId,
                nexudusUserId: a.nexudusUserId,
                accountName: a.accountName,
                isDefault: a.isDefault,
                totalCopies: a.totalCopies,
                a4Bw: a.a4Bw,
                a4Color: a.a4Color,
                a3Bw: a.a3Bw,
                a3Color: a.a3Color,
                sra3Bw: a.sra3Bw,
                sra3Color: a.sra3Color,
                concepts: Array.from(a.concepts)
            }))
        }));

        return {
            userId,
            isMultiAccount,
            accountsCount,
            currentPeriod,
            historicalCycles,
            ytdMonthlyExpenses,
            currentMonthUsage: { count: Number(currentMonthUsageRes?.count || 0) },
            ytdTotal: Number(ytdTotalRes?.total || 0),
            recentInvoices,
            pendingConsumption: pendingReport?.data || null
        };
    }
};
