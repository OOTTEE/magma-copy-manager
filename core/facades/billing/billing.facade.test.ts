import { describe, it, expect, vi, beforeEach } from 'vitest';
import { billingFacade } from './billing.facade';
import { billingService } from '../../services/billing/billing.service';

vi.mock('../../services/billing/billing.service');
vi.mock('../../services/reports/reports.service', () => ({
    reportsService: {
        getPeriodDates: vi.fn().mockResolvedValue({ fromStr: '2024-01-01', toStr: '2024-01-31' }),
    }
}));

describe('BillingFacade', () => {
    const adminUser = { id: 'admin-id', role: 'admin' };
    const customerUser = { id: 'customer-id', role: 'customer' };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('simulateInvoice', () => {
        it('should allow admin to simulate invoice', async () => {
            vi.mocked(billingService.simulateInvoice).mockResolvedValue({ lines: [] } as any);
            const result = await billingFacade.simulateInvoice(adminUser, 'user-1');
            expect(result.lines).toBeInstanceOf(Array);
            expect(billingService.simulateInvoice).toHaveBeenCalledWith('user-1');
        });

        it('should deny customer to simulate invoice', async () => {
            await expect(billingFacade.simulateInvoice(customerUser, 'user-1'))
                .rejects.toThrow('Unauthorized access to billing simulation.');
        });
    });

    describe('syncUserConsumption', () => {
        it('should allow admin to trigger sync for a user', async () => {
            vi.mocked(billingService.getSyncStatus).mockResolvedValue({ synced: false } as any);
            vi.mocked(billingService.syncUserConsumption).mockResolvedValue({ userId: 'u1', salesCreated: 1 } as any);

            const result = await billingFacade.syncUserConsumption(adminUser, 'user-1');
            
            expect(result.salesCreated).toBe(1);
            expect(billingService.syncUserConsumption).toHaveBeenCalledWith('user-1', undefined, undefined);
        });

        it('should throw error if already synced', async () => {
            vi.mocked(billingService.getSyncStatus).mockResolvedValue({ synced: true } as any);

            await expect(billingFacade.syncUserConsumption(adminUser, 'user-1'))
                .rejects.toThrow('Consumption already synchronized');
        });
    });

    describe('syncWithNexudus', () => {
        it('should allow admin to trigger global sync', async () => {
            vi.mocked(billingService.syncMonthlyConsumption).mockResolvedValue({ results: [] } as any);
            
            const result = await billingFacade.syncWithNexudus(adminUser);
            
            expect(result.results).toBeInstanceOf(Array);
            expect(billingService.syncMonthlyConsumption).toHaveBeenCalled();
        });
    });
});
