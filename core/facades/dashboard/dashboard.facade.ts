import { db } from '../../db';
import { nexudusSales, syncLogs, systemNotifications } from '../../db/schema';
import { sql, desc, eq, and } from 'drizzle-orm';
import { autoSyncService } from '../../services/automation/auto-sync.service';
import { billingJobService } from '../../services/billing/billing-job.service';
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
        const month = `${year}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

        // 1. Monthly evolution (YTD) - Consolidates total quantity per month
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

        // 2. Current Month Usage
        const currentMonthUsageRes = await db
            .select({ count: sql<number>`SUM(${nexudusSales.quantity})` })
            .from(nexudusSales)
            .where(and(
                eq(nexudusSales.userId, userId),
                eq(nexudusSales.month, month)
            ))
            .get();

        // 3. YTD Total
        const ytdTotalRes = await db
            .select({ total: sql<number>`SUM(${nexudusSales.quantity})` })
            .from(nexudusSales)
            .where(and(
                eq(nexudusSales.userId, userId),
                sql`${nexudusSales.month} LIKE ${year + '-%'}`
            ))
            .get();

        // 4. Recent "Invoices" (sessions of sales)
        // We use the same grouping logic as the admin billing history
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

        // Map sessions to the format expected by RecentInvoicesWidget
        const recentInvoices = recentSessions.map((s: any) => ({
            id: s.date,
            from: s.month,
            to: s.date,
            total: s.total, // Pages for now
            status: 'paid'
        }));

        return {
            ytdMonthlyExpenses,
            currentMonthUsage: { count: Number(currentMonthUsageRes?.count || 0) },
            ytdTotal: Number(ytdTotalRes?.total || 0),
            recentInvoices
        };
    }
};
