import { describe, it, expect, vi, beforeEach } from 'vitest';
import { autoBillingService } from './auto-billing.service';
import { billingFacade } from '../../facades/billing/billing.facade';
import { nexudusService } from '../nexudus/nexudus.service';
import { db } from '../../db';

vi.mock('../nexudus/nexudus.service', () => ({
    nexudusService: {
        ensureAuthenticated: vi.fn().mockResolvedValue('mock-token'),
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

    it('should proactively authenticate and bill customers based purely on accumulated db copies', async () => {
        mockAll.mockResolvedValue([
            { id: 'u1', username: 'user1', role: 'customer', nexudusUser: '123' },
            { id: 'u2', username: 'user2', role: 'customer', nexudusUser: null },
            { id: 'a1', username: 'admin', role: 'admin' }
        ] as any);

        vi.mocked(billingFacade.syncUserConsumption).mockResolvedValue({ userId: 'uX', salesCreated: 2 } as any);

        const result = await autoBillingService.runJob(adminUser);

        expect(nexudusService.ensureAuthenticated).toHaveBeenCalledTimes(1);
        expect(result.status).toBe('success');
        expect(result.results).toHaveLength(2); // Only customers
        
        // Users: Sincronización directa y atómica
        expect(billingFacade.syncUserConsumption).toHaveBeenCalledWith(adminUser, 'u1');
        expect(billingFacade.syncUserConsumption).toHaveBeenCalledWith(adminUser, 'u2');
    });

    it('should handle partial failures with individual user retry (one user fails, others continue)', async () => {
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

    it('should handle skipped users when no consumption or already synced', async () => {
        mockAll.mockResolvedValue([
            { id: 'u1', username: 'user1', role: 'customer' },
            { id: 'u2', username: 'user2', role: 'customer' }
        ] as any);

        vi.mocked(billingFacade.syncUserConsumption)
            .mockRejectedValueOnce(new Error('No consumption for user (0 copies)'))
            .mockRejectedValueOnce(new Error('Consumption already synced for period'));

        const result = await autoBillingService.runJob(adminUser);

        expect(result.status).toBe('success');
        expect(result.results[0].billing).toBe('skipped (no activity)');
        expect(result.results[1].billing).toBe('skipped (already synced)');
    });
});
