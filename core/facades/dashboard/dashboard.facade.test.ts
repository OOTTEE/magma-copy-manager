import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardFacade } from './dashboard.facade';
import { db } from '../../db';

const { mockDb } = vi.hoisted(() => {
    const chain = {
        select: vi.fn(() => chain),
        from: vi.fn(() => chain),
        where: vi.fn(() => chain),
        groupBy: vi.fn(() => chain),
        orderBy: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        innerJoin: vi.fn(() => chain),
        leftJoin: vi.fn(() => chain),
        get: vi.fn(),
        all: vi.fn(),
        values: vi.fn(() => chain),
        run: vi.fn(),
        then: vi.fn(), // Handle direct await
    };
    return { mockDb: chain as any };
});

vi.mock('../../db', () => ({
    db: mockDb
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
        mockDb.orderBy.mockResolvedValueOnce([
            { month: '2024-01', total: 100 },
            { month: '2024-02', total: 200 },
            { month: '2024-03', total: 50 }
        ]);

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
        // Mock YTD monthly usage empty
        mockDb.orderBy.mockResolvedValueOnce([]);
        vi.mocked(db.all).mockResolvedValue([]);

        const result = await dashboardFacade.getCustomerDashboardData(userId);

        expect(result.currentMonthUsage.count).toBe(0);
        expect(result.ytdTotal).toBe(0);
        expect(result.recentInvoices).toEqual([]);
    });
});
