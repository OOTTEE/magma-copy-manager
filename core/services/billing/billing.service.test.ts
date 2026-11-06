import { describe, it, expect, vi } from 'vitest';
import { isPeriodClosed, billingService } from './billing.service';
import { reportsService } from '../reports/reports.service';
import { settingsService } from '../settings/settings.service';
import { distributionsRepository } from '../../repositories/distributions.repository';
import { emailService } from '../notifications/email.service';
import { nexudusService } from '../nexudus/nexudus.service';
import { db } from '../../db';

vi.mock('../reports/reports.service');
vi.mock('../settings/settings.service');
vi.mock('../../repositories/distributions.repository');
vi.mock('../notifications/email.service');
vi.mock('../nexudus/nexudus.service');
vi.mock('../../db', () => ({
    db: {
        select: vi.fn(),
        transaction: vi.fn((cb: any) => cb({
            update: vi.fn().mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({ run: vi.fn() })
                })
            }),
            delete: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({ run: vi.fn() })
            })
        }))
    }
}));

describe('isPeriodClosed (Time-Bound Shield)', () => {
    it('should return false for invalid or missing period strings', () => {
        expect(isPeriodClosed('')).toBe(false);
        expect(isPeriodClosed('invalid-format')).toBe(false);
    });

    it('should return false when current date is within the same natural month', () => {
        // Example: Period is 2026-11. Reference date is 2026-11-28.
        const refDate = new Date('2026-11-28T14:00:00Z');
        expect(isPeriodClosed('2026-11', refDate)).toBe(false);
    });

    it('should return false on the very last day of the natural month', () => {
        // November has 30 days. Reference date is 2026-11-30 20:00:00 local time
        const refDate = new Date(2026, 10, 30, 20, 0, 0); // Month 10 is November
        expect(isPeriodClosed('2026-11', refDate)).toBe(false);
    });

    it('should return true on the first day of the next month (month has elapsed)', () => {
        // December 1st 00:00:01 for November period
        const refDate = new Date(2026, 11, 1, 0, 0, 1); // Month 11 is December
        expect(isPeriodClosed('2026-11', refDate)).toBe(true);
    });

    it('should return true for historical periods from previous years or months', () => {
        const refDate = new Date('2026-11-02T12:00:00Z');
        expect(isPeriodClosed('2026-10', refDate)).toBe(true);
        expect(isPeriodClosed('2025-12', refDate)).toBe(true);
    });

    it('should return false for future periods', () => {
        const refDate = new Date('2026-11-02T12:00:00Z');
        expect(isPeriodClosed('2026-12', refDate)).toBe(false);
        expect(isPeriodClosed('2027-01', refDate)).toBe(false);
    });
});

describe('syncUserConsumption (Over-Allocation Safety Protocol)', () => {
    it('should block sync, send notification email, and throw error when allocated copies exceed printer copies', async () => {
        vi.mocked(reportsService.getMonthlyAccumulationForUser).mockResolvedValue({
            period: { month: '2026-11', from: '2026-11-01', to: '2026-11-30' },
            data: {
                username: 'alice',
                total: 40,
                a4Color: 20,
                a4Bw: 20,
                a3Color: 0,
                a3Bw: 0,
                sra3Color: 0,
                sra3Bw: 0
            }
        } as any);

        vi.mocked(settingsService.getAllSettings).mockResolvedValue({} as any);

        vi.mocked(db.select).mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([
                    { id: 'acc-1', isDefault: 1, nexudusUserId: '111' },
                    { id: 'acc-2', isDefault: 0, nexudusUserId: '222' }
                ])
            })
        } as any);

        // 65 copies declared in ledger vs 40 physical copies
        vi.mocked(distributionsRepository.findByUserAndMonth).mockResolvedValue([
            { id: 'dist-1', nexudusAccountId: 'acc-2', type: 'a4Color', quantity: 65, concept: 'Dossier oversize' }
        ] as any);

        await expect(billingService.syncUserConsumption('user-alice', { period: '2026-11' }))
            .rejects.toThrow('Sobreasignación de copias');

        expect(emailService.sendNotification).toHaveBeenCalledWith(expect.objectContaining({
            type: 'warning',
            title: 'Cierre Bloqueado por Sobreasignación',
            subject: expect.stringContaining('Alerta de Sobreasignación')
        }));
    });
});

describe('simulateInvoice (Contextual & Historical Isolation)', () => {
    it('should forward period option to reportsService and identify closed periods', async () => {
        vi.mocked(reportsService.getMonthlyAccumulationForUser).mockResolvedValue({
            period: { month: '2026-01', from: '2026-01-01', to: '2026-01-31' },
            data: {
                username: 'historical_user',
                total: 10,
                a4Color: 5,
                a4Bw: 5,
                a3Color: 0,
                a3Bw: 0,
                sra3Color: 0,
                sra3Bw: 0
            }
        } as any);

        vi.mocked(settingsService.getAllSettings).mockResolvedValue({} as any);

        const result = await billingService.simulateInvoice('user-1', { period: '2026-01' });

        expect(reportsService.getMonthlyAccumulationForUser).toHaveBeenCalledWith('user-1', { period: '2026-01' });
        expect(result.isClosedPeriod).toBe(true);
        expect(result.targetPeriod).toBe('2026-01');
        expect(result.lines).toHaveLength(2);
    });
});

describe('rollbackSyncEvent (Operational Living Window)', () => {
    it('should allow rollback of a regularized historical period if executed within current open month', async () => {
        // Today is within current open month
        const currentMonth = new Date().toISOString().slice(0, 7);
        const todayIso = new Date().toISOString();

        vi.mocked(db.select).mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    get: vi.fn().mockResolvedValue({
                        id: 'sale-1',
                        userId: 'u1',
                        month: '2026-01', // Historical closed period
                        nexudusSaleId: '999',
                        saleDate: todayIso,
                        createdOn: todayIso
                    })
                })
            })
        } as any);

        vi.mocked(nexudusService.deleteCoworkerProduct).mockResolvedValue({ WasSuccessful: true } as any);

        const result = await billingService.rollbackSyncEvent('sale-1');
        expect(result).toEqual({ localId: 'sale-1', remoteId: 999, status: 'rolled_back' });
        expect(nexudusService.deleteCoworkerProduct).toHaveBeenCalledWith(999);
    });

    it('should block rollback if the execution month has already closed', async () => {
        // Executed in an ancient month
        vi.mocked(db.select).mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    get: vi.fn().mockResolvedValue({
                        id: 'sale-old',
                        userId: 'u1',
                        month: '2025-01',
                        nexudusSaleId: '888',
                        saleDate: '2025-01-10T10:00:00Z',
                        createdOn: '2025-01-10T10:00:00Z'
                    })
                })
            })
        } as any);

        await expect(billingService.rollbackSyncEvent('sale-old'))
            .rejects.toThrow('el mes de ejecución 2025-01 ha finalizado. La facturación es inmutable tras el cierre de mes natural.');
    });
});
