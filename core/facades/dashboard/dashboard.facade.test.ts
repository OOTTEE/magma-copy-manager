import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardFacade } from './dashboard.facade';
import { billingService } from '../../services/billing/billing.service';

vi.mock('../../services/billing/billing.service');

describe('DashboardFacade', () => {
    const userId = 'user-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should aggregate dashboard data correctly from Nexudus Sales', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-03-15'));

        // Mock recent sales / history
        vi.mocked(billingService.getPaginatedSales).mockResolvedValue({
            data: [
                { month: '2024-01', quantity: 100, type: 'a4Bw' },
                { month: '2024-02', quantity: 200, type: 'a4Color' },
                { month: '2024-03', quantity: 50, type: 'a4Bw' }
            ],
            pagination: { total: 3, page: 1, limit: 100, totalPages: 1 }
        } as any);

        // Mock current month simulation
        vi.mocked(billingService.simulateInvoice).mockResolvedValue({
            lines: [{ quantity: 30 }]
        } as any);

        const result = await dashboardFacade.getDashboardSummary(userId);

        // Verification
        expect(result.currentMonthUsage.pages).toBe(30);
        expect(result.ytdTotalPages).toBe(350); // 100 + 200 + 50
        expect(result.recentSyncs).toHaveLength(3);
        
        // Months: Ene, Feb, Mar (YTD)
        expect(result.ytdMonthlyUsage).toHaveLength(3);
        expect(result.ytdMonthlyUsage[0].pages).toBe(100);
        expect(result.ytdMonthlyUsage[1].pages).toBe(200);
        expect(result.ytdMonthlyUsage[2].pages).toBe(50);

        vi.useRealTimers();
    });

    it('should handle missing consumption for current month', async () => {
        vi.mocked(billingService.getPaginatedSales).mockResolvedValue({ data: [], pagination: {} } as any);
        vi.mocked(billingService.simulateInvoice).mockRejectedValue(new Error('No consumption'));

        const result = await dashboardFacade.getDashboardSummary(userId);

        expect(result.currentMonthUsage.pages).toBe(0);
        expect(result.ytdTotalPages).toBe(0);
        expect(result.recentSyncs).toEqual([]);
    });
});
