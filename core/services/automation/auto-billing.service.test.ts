import { describe, it, expect, vi, beforeEach } from 'vitest';
import { autoBillingService } from './auto-billing.service';
import { copiesFacade } from '../../facades/copies/copies.facade';
import { billingFacade } from '../../facades/billing/billing.facade';
import { db } from '../../db';
import { users, syncLogs } from '../../db/schema';

vi.mock('../../facades/copies/copies.facade', () => ({
    copiesFacade: {
        syncPrinterCopies: vi.fn(),
    }
}));

vi.mock('../../facades/billing/billing.facade', () => ({
    billingFacade: {
        syncUserConsumption: vi.fn(),
        syncWithNexudus: vi.fn(),
    }
}));

const mockAll = vi.fn();
const mockRun = vi.fn();

vi.mock('../../db', () => ({
    db: {
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                all: mockAll,
            }))
        })),
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                run: mockRun,
            }))
        })),
    }
}));

describe('AutoBillingService', () => {
    const adminUser = { id: 'admin-id', role: 'admin' };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should retry print sync up to 3 times on failure', async () => {
        vi.mocked(copiesFacade.syncPrinterCopies).mockRejectedValue(new Error('Printer Offline'));
        mockAll.mockResolvedValue([]);

        // Mock setTimeout to speed up test
        vi.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
            if (typeof fn === 'function') fn();
            return {} as any;
        });

        const result = await autoBillingService.runJob(adminUser);

        expect(copiesFacade.syncPrinterCopies).toHaveBeenCalledTimes(3);
        expect(result.status).toBe('failed');
    });

    it('should orchestrate full flow for customers', async () => {
        vi.mocked(copiesFacade.syncPrinterCopies).mockResolvedValue({ 
            status: 'success',
            syncedCount: 1,
            errors: [],
            reportPath: '/fake/path'
        });
        mockAll.mockResolvedValue([
            { id: 'u1', username: 'user1', role: 'customer', nexudusUser: '123' },
            { id: 'u2', username: 'user2', role: 'customer', nexudusUser: null },
            { id: 'a1', username: 'admin', role: 'admin' }
        ] as any);

        vi.mocked(billingFacade.syncUserConsumption).mockResolvedValue({ userId: 'uX', salesCreated: 1 } as any);
        vi.mocked(billingFacade.syncWithNexudus).mockResolvedValue({ results: [] } as any);

        const result = await autoBillingService.runJob(adminUser);

        expect(result.status).toBe('success');
        expect(result.results).toHaveLength(2); // Only customers
        
        // Users: Sincronización directa
        expect(billingFacade.syncUserConsumption).toHaveBeenCalledWith(adminUser, 'u1');
        expect(billingFacade.syncUserConsumption).toHaveBeenCalledWith(adminUser, 'u2');
        
        // Nexudus Batch Sync
        expect(billingFacade.syncWithNexudus).toHaveBeenCalledWith(adminUser);
    });

    it('should handle partial failures (one user fails, others continue)', async () => {
        vi.mocked(copiesFacade.syncPrinterCopies).mockResolvedValue({ 
            status: 'success',
            syncedCount: 1,
            errors: [],
            reportPath: '/fake/path'
        });
        mockAll.mockResolvedValue([
            { id: 'u1', username: 'user1', role: 'customer' },
            { id: 'u2', username: 'user2', role: 'customer' }
        ] as any);

        vi.mocked(billingFacade.syncUserConsumption)
            .mockRejectedValueOnce(new Error('Sync Error'))
            .mockResolvedValueOnce({ userId: 'u2', salesCreated: 1 } as any);
        
        vi.mocked(billingFacade.syncWithNexudus).mockResolvedValue({ results: [] } as any);

        const result = await autoBillingService.runJob(adminUser);

        expect(result.status).toBe('partial');
        expect(result.results[0].billing).toBe('failed');
        expect(result.results[1].billing).toBe('success');
    });
});
