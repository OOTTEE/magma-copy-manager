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
        it('should allow admin to simulate invoice with options', async () => {
            vi.mocked(billingService.simulateInvoice).mockResolvedValue({ lines: [] } as any);
            const options = { from: '2024-01-01', to: '2024-01-10', includeAllPending: true };
            const result = await billingFacade.simulateInvoice(adminUser, 'user-1', options);
            expect(result.lines).toBeInstanceOf(Array);
            expect(billingService.simulateInvoice).toHaveBeenCalledWith('user-1', options);
        });

        it('should deny customer to simulate invoice', async () => {
            await expect(billingFacade.simulateInvoice(customerUser, 'user-1'))
                .rejects.toThrow('Unauthorized access to billing simulation.');
        });
    });

    describe('syncUserConsumption', () => {
        it('should allow admin to trigger sync with options', async () => {
            vi.mocked(billingService.getSyncStatus).mockResolvedValue({ synced: false } as any);
            vi.mocked(billingService.syncUserConsumption).mockResolvedValue({ userId: 'u1', salesCreated: 1 } as any);

            const options = { from: '2024-01-01', includeAllPending: true, note: 'Test note' };
            const result = await billingFacade.syncUserConsumption(adminUser, 'user-1', options);
            
            expect(result.salesCreated).toBe(1);
            expect(billingService.syncUserConsumption).toHaveBeenCalledWith('user-1', {
                from: options.from,
                to: undefined,
                includeAllPending: options.includeAllPending,
                customNote: options.note,
                nexudusAccountId: undefined
            });
        });

        it('should allow sync if using custom options even if status is synced', async () => {
             // In current implementation, we allow sync if options are provided (to allow catch-up)
             vi.mocked(billingService.getSyncStatus).mockResolvedValue({ synced: true } as any);
             vi.mocked(billingService.syncUserConsumption).mockResolvedValue({ userId: 'u1', salesCreated: 1 } as any);

             const options = { includeAllPending: true };
             const result = await billingFacade.syncUserConsumption(adminUser, 'user-1', options);
             expect(result.salesCreated).toBe(1);
        });
    });

    describe('syncWithNexudus', () => {
        it('should allow admin to trigger global sync with options', async () => {
            vi.mocked(billingService.syncMonthlyConsumption).mockResolvedValue({ results: [] } as any);
            
            const options = { from: '2024-01-01', to: '2024-01-31' };
            const result = await billingFacade.syncWithNexudus(adminUser, options);
            
            expect(result.results).toBeInstanceOf(Array);
            expect(billingService.syncMonthlyConsumption).toHaveBeenCalledWith(options);
        });
    });
});
