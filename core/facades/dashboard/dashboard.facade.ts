import { billingService } from '../../services/billing/billing.service';

export interface YTDMonthlyUsage {
    month: string;
    pages: number;
}

export interface CustomerDashboardSummary {
    currentMonthUsage: {
        pages: number;
    };
    ytdTotalPages: number;
    ytdMonthlyUsage: YTDMonthlyUsage[];
    recentSyncs: any[];
}

/**
 * Facade for Customer Dashboard.
 * Orchestrates usage statistics, YTD pages and recent syncs.
 */
export const dashboardFacade = {
    getDashboardSummary: async (userId: string): Promise<CustomerDashboardSummary> => {
        // 1. Get recent syncs (delegated to service)
        const salesResponse = await billingService.getPaginatedSales({ 
            page: 1, 
            limit: 100, 
            userIds: [userId] 
        });
        
        const fullYearSyncs = salesResponse.data;
        const recentSyncs = fullYearSyncs.slice(0, 3);

        const currentYear = new Date().getFullYear().toString();
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const currentMonthIndex = new Date().getMonth();
        
        const ytdMonthlyUsage: YTDMonthlyUsage[] = [];
        let ytdTotalPages = 0;

        for (let i = 0; i <= currentMonthIndex; i++) {
            const monthName = monthNames[i];
            const monthNum = (i + 1).toString().padStart(2, '0');
            const monthPrefix = `${currentYear}-${monthNum}`;

            // Aggregate pages for this month from sync history
            const monthPages = fullYearSyncs
                .filter((s: any) => s.month === monthPrefix)
                .reduce((acc: number, s: any) => acc + (Number(s.quantity) || 0), 0);

            ytdMonthlyUsage.push({
                month: monthName,
                pages: monthPages
            });
            
            ytdTotalPages += monthPages;
        }

        // 3. Get current month un-synced consumption
        let currentPages = 0;
        try {
            const sim = await billingService.simulateInvoice(userId);
            currentPages = sim.lines.reduce((acc, l) => acc + l.quantity, 0);
        } catch (error) {
            // No consumption this month
        }

        return {
            currentMonthUsage: {
                pages: currentPages
            },
            ytdTotalPages,
            ytdMonthlyUsage,
            recentSyncs
        };
    }
};
