import { describe, it, expect, vi, beforeEach } from 'vitest';
import { autoBillingService } from './auto-billing.service';
import { copiesFacade } from '../../facades/copies/copies.facade';
import { billingFacade } from '../../facades/billing/billing.facade';
import { nexudusFacade } from '../../facades/billing/nexudus.facade';
import { db } from '../../db';
import { users, autoBillingLogs } from '../../db/schema';

vi.mock('../../facades/copies/copies.facade', () => ({
    copiesFacade: {
        syncPrinterCopies: vi.fn(),
    }
}));

vi.mock('../../facades/billing/billing.facade', () => ({
    billingFacade: {
        persistInvoice: vi.fn(),
    }
}));

vi.mock('../../facades/billing/nexudus.facade', () => ({
    nexudusFacade: {
        createInvoice: vi.fn(),
    }
}));

const mockAll = vi.fn();
const mockRun = vi.fn();

vi.mock('../../db', () => ({
    db: {
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                orderBy: vi.fn(() => ({
                    limit: vi.fn(() => ({
                        offset: vi.fn(() => ({
                            all: mockAll,
                        }))
                    }))
                })),
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
        vi.spyOn(global, 'setTimeout').mockImplementation((fn: any) => fn());

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

        vi.mocked(billingFacade.persistInvoice).mockResolvedValue({ invoiceId: 'inv1' } as any);
        vi.mocked(nexudusFacade.createInvoice).mockResolvedValue({ id: 'nex1' } as any);

        const result = await autoBillingService.runJob(adminUser);

        expect(result.status).toBe('success');
        expect(result.results).toHaveLength(2); // Only customers
        
        // User 1: Local + Nexudus
        expect(billingFacade.persistInvoice).toHaveBeenCalledWith(adminUser, 'u1');
        expect(nexudusFacade.createInvoice).toHaveBeenCalledWith(adminUser, 'u1', 1, { Draft: true });

        // User 2: Only Local
        expect(billingFacade.persistInvoice).toHaveBeenCalledWith(adminUser, 'u2');
        expect(nexudusFacade.createInvoice).not.toHaveBeenCalledWith(adminUser, 'u2', expect.anything(), expect.anything());
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

        vi.mocked(billingFacade.persistInvoice)
            .mockRejectedValueOnce(new Error('DB Error'))
            .mockResolvedValueOnce({ invoiceId: 'inv2' } as any);

        const result = await autoBillingService.runJob(adminUser);

        expect(result.status).toBe('partial');
        expect(result.results[0].billing).toBe('failed');
        expect(result.results[1].billing).toBe('success');
    });
});
