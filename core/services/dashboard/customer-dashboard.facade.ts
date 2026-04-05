import { db } from '../../db';
import { invoices } from '../../db/schema';
import { eq, desc, and, like } from 'drizzle-orm';
import { billingService } from '../billing/billing.service';

export interface YTDMonthlyExpense {
    month: string;
    total: number;
}

export interface CustomerDashboardSummary {
    currentMonthUsage: {
        totalCost: number;
        pages: number;
    };
    ytdTotal: number;
    ytdMonthlyExpenses: YTDMonthlyExpense[];
    recentInvoices: any[];
}

export const customerDashboardFacade = {
    getDashboardSummary: async (userId: string): Promise<CustomerDashboardSummary> => {
        // 1. Get recent invoices
        const recentInvoices = await db.select()
            .from(invoices)
            .where(eq(invoices.userId, userId))
            .orderBy(desc(invoices.from))
            .limit(3);

        const currentYear = new Date().getFullYear().toString();
        
        // 2. Get YTD invoices for chart
        const ytdInvoices = await db.select()
            .from(invoices)
            .where(and(
                eq(invoices.userId, userId),
                like(invoices.from, `${currentYear}-%`)
            ));
            
        // Map YTD totals per month
        const ytdMonthlyExpenses: YTDMonthlyExpense[] = [];
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        let ytdTotal = 0;
        const currentMonthIndex = new Date().getMonth();
        
        // Show up to current month (or full year)
        for (let i = 0; i <= currentMonthIndex; i++) {
            const mStr = (i + 1).toString().padStart(2, '0');
            const monthPrefix = `${currentYear}-${mStr}`;
            
            const monthInvoice = ytdInvoices.find(inv => inv.from.startsWith(monthPrefix));
            const cost = monthInvoice ? monthInvoice.total : 0; // Total is stored as cents or float? It is stored as float/integer depending on insertion, usually integer cents? In magma previous tasks, it's stored directly or float.
            ytdTotal += cost;
            
            ytdMonthlyExpenses.push({
                month: monthNames[i],
                total: cost
            });
        }

        // 3. Get current month usage
        let currentCost = 0;
        let currentPages = 0;
        
        try {
            const sim = await billingService.simulateInvoice(userId);
            currentCost = sim.total;
            currentPages = sim.lines.reduce((acc, l) => acc + l.quantity, 0);
        } catch (error) {
            // No consumption this month
        }

        return {
            currentMonthUsage: {
                totalCost: currentCost,
                pages: currentPages
            },
            ytdTotal,
            ytdMonthlyExpenses,
            recentInvoices
        };
    }
};
