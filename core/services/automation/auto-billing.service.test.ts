import { describe, it, expect, vi, beforeEach } from 'vitest';
import { autoBillingService } from './auto-billing.service';
import { copiesFacade } from '../../facades/copies/copies.facade';
import { billingFacade } from '../../facades/billing/billing.facade';
import { nexudusService } from '../nexudus/nexudus.service';
import { db } from '../../db';

vi.mock('../nexudus/nexudus.service', () => ({
    nexudusService: {
        ensureAuthenticated: vi.fn().mockResolvedValue('mock-token'),
    }
}));

vi.mock('../../facades/copies/copies.facade', () => ({
    copiesFacade: {
        syncPrinterCopies: vi.fn(),
    }
}));

vi.mock('../../facades/billing/billing.facade', () => ({
    billingFacade: {
        syncUserConsumption: vi.fn(),
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

    it('should retry print sync up to 3 times on failure and proceed with billing (non-fatal)', async () => {
        vi.mocked(copiesFacade.syncPrinterCopies).mockRejectedValue(new Error('Printer Offline'));
        mockAll.mockResolvedValue([
            { id: 'u1', username: 'user1', role: 'customer' }
        ] as any);
        vi.mocked(billingFacade.syncUserConsumption).mockResolvedValue({ userId: 'u1', salesCreated: 1 } as any);

        // Mock setTimeout for fast testing without breaking thread workers
        const originalSetTimeout = global.setTimeout;
        vi.spyOn(global, 'setTimeout').mockImplementation((fn: any, ms?: number, ...args: any[]) => {
            if (ms === 3000) {
                return originalSetTimeout(fn, 0, ...args);
            }
            return originalSetTimeout(fn, ms, ...args);
        });

        const result = await autoBillingService.runJob(adminUser);

        expect(copiesFacade.syncPrinterCopies).toHaveBeenCalledTimes(3);
        expect(nexudusService.ensureAuthenticated).toHaveBeenCalledTimes(1);
        // Scraper was offline, so printer warning marks status as partial, but billing still ran!
        expect(result.status).toBe('partial');
        expect(billingFacade.syncUserConsumption).toHaveBeenCalledWith(adminUser, 'u1');
        expect(result.results[0].salesCreated).toBe(1);
    });

    it('should orchestrate full billing flow for customers without redundant batch loop', async () => {
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

        vi.mocked(billingFacade.syncUserConsumption).mockResolvedValue({ userId: 'uX', salesCreated: 2 } as any);

        const result = await autoBillingService.runJob(adminUser);

        expect(result.status).toBe('success');
        expect(result.results).toHaveLength(2); // Only customers
        
        // Users: Sincronización directa y atómica
        expect(billingFacade.syncUserConsumption).toHaveBeenCalledWith(adminUser, 'u1');
        expect(billingFacade.syncUserConsumption).toHaveBeenCalledWith(adminUser, 'u2');
    });

    it('should handle partial failures with individual user retry (one user fails, others continue)', async () => {
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
            .mockRejectedValueOnce(new Error('Sync Error 1'))
            .mockRejectedValueOnce(new Error('Sync Error 2'))
            .mockResolvedValueOnce({ userId: 'u2', salesCreated: 1 } as any);

        const result = await autoBillingService.runJob(adminUser);

        expect(result.status).toBe('partial');
        expect(result.results[0].billing).toBe('failed');
        expect(result.results[1].billing).toContain('success');
    });
});
