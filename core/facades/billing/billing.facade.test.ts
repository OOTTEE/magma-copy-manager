import { describe, it, expect, vi, beforeEach } from 'vitest';
import { billingFacade } from './billing.facade';
import { billingService } from '../../services/billing/billing.service';
import { distributionsRepository } from '../../repositories/distributions.repository';

vi.mock('../../services/billing/billing.service');
vi.mock('../../repositories/distributions.repository');
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

    describe('rollbackSyncEvent and rollbackSyncGroup', () => {
        it('should allow admin to rollback a sync event', async () => {
            vi.mocked(billingService.rollbackSyncEvent).mockResolvedValue({ localId: 's1', remoteId: 123, status: 'rolled_back' } as any);
            const result = await billingFacade.rollbackSyncEvent('s1', adminUser);
            expect(result.status).toBe('rolled_back');
            expect(billingService.rollbackSyncEvent).toHaveBeenCalledWith('s1', false);
        });

        it('should deny customer to rollback a sync event', async () => {
            await expect(billingFacade.rollbackSyncEvent('s1', customerUser))
                .rejects.toThrow('Access denied. Only administrators can perform rollbacks.');
        });

        it('should allow admin to rollback a sync group', async () => {
            vi.mocked(billingService.rollbackSyncGroup).mockResolvedValue([{ localId: 's1', remoteId: 123, status: 'rolled_back' }] as any);
            const result = await billingFacade.rollbackSyncGroup(['s1'], adminUser, true);
            expect(result).toHaveLength(1);
            expect(billingService.rollbackSyncGroup).toHaveBeenCalledWith(['s1'], true);
        });

        it('should deny customer to rollback a sync group', async () => {
            await expect(billingFacade.rollbackSyncGroup(['s1'], customerUser))
                .rejects.toThrow('Access denied. Only administrators can perform rollbacks.');
        });
    });

    describe('distribution entries (Allocation Ledger)', () => {
        it('should allow customer to create distribution entry for themselves', async () => {
            vi.mocked(billingService.createDistributionEntry).mockResolvedValue({ id: 'entry-1', quantity: 20 } as any);

            const result = await billingFacade.createDistributionEntry(customerUser, {
                nexudusAccountId: 'acc-1',
                type: 'a4Color',
                quantity: 20,
                concept: 'Test Planos'
            });

            expect(result.id).toBe('entry-1');
            expect(billingService.createDistributionEntry).toHaveBeenCalledWith(expect.objectContaining({
                userId: customerUser.id,
                nexudusAccountId: 'acc-1',
                quantity: 20,
                concept: 'Test Planos'
            }));
        });

        it('should deny customer to create distribution entry for another user', async () => {
            await expect(billingFacade.createDistributionEntry(customerUser, {
                userId: 'other-user',
                nexudusAccountId: 'acc-1',
                type: 'a4Color',
                quantity: 20
            })).rejects.toThrow('Unauthorized distribution attempt.');
        });

        it('should allow admin to delete any distribution entry', async () => {
            vi.mocked(distributionsRepository.findById).mockResolvedValue({ id: 'entry-1', userId: 'user-2' } as any);
            vi.mocked(billingService.deleteDistributionEntry).mockResolvedValue({ success: true } as any);

            await billingFacade.deleteDistributionEntry(adminUser, 'entry-1');
            expect(billingService.deleteDistributionEntry).toHaveBeenCalledWith('entry-1');
        });

        it('should deny customer to delete distribution entry of another user', async () => {
            vi.mocked(distributionsRepository.findById).mockResolvedValue({ id: 'entry-1', userId: 'other-user' } as any);

            await expect(billingFacade.deleteDistributionEntry(customerUser, 'entry-1'))
                .rejects.toThrow('Unauthorized to delete this distribution entry.');
        });
    });
});
