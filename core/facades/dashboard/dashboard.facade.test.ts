import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardFacade } from './dashboard.facade';
import { db } from '../../db';

vi.mock('../../db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn(),
        all: vi.fn()
    }
}));

describe('DashboardFacade', () => {
    const userId = 'user-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should aggregate customer dashboard data correctly', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-03-15'));

        // Mock current month usage
        vi.mocked(db.get).mockResolvedValueOnce({ count: 30 }); // for currentMonthUsage
        vi.mocked(db.get).mockResolvedValueOnce({ total: 350 }); // for ytdTotal
        
        // Mock YTD monthly usage
        vi.mocked(db.select).mockReturnValue({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            groupBy: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockResolvedValue([
                { month: '2024-01', total: 100 },
                { month: '2024-02', total: 200 },
                { month: '2024-03', total: 50 }
            ])
        } as any);

        // Mock recent sessions
        vi.mocked(db.all).mockResolvedValue([]);

        const result = await dashboardFacade.getCustomerDashboardData(userId);

        // Verification
        expect(result.currentMonthUsage.count).toBe(30);
        expect(result.ytdTotal).toBe(350);
        expect(result.ytdMonthlyExpenses).toHaveLength(3);
        
        vi.useRealTimers();
    });

    it('should handle missing consumption for customer', async () => {
        vi.mocked(db.get).mockResolvedValue(null);
        vi.mocked(db.select).mockReturnValue({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            groupBy: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockResolvedValue([])
        } as any);
        vi.mocked(db.all).mockResolvedValue([]);

        const result = await dashboardFacade.getCustomerDashboardData(userId);

        expect(result.currentMonthUsage.count).toBe(0);
        expect(result.ytdTotal).toBe(0);
        expect(result.recentInvoices).toEqual([]);
    });
});
