import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copiesFacade } from './copies.facade';
import { copiesService } from '../../services/copies/copies.service';
import { usersService } from '../../services/users/users.service';
import { printerScraperService } from '../../services/printer/printer.scraper.service';
import { reportScrapperService } from '../../services/report/report.scrapper.service';
import * as fs from 'node:fs';

vi.mock('../../services/copies/copies.service', () => ({
    copiesService: {
        getUserCopies: vi.fn(),
        addCopies: vi.fn(),
        updateCopies: vi.fn(),
        deleteCopies: vi.fn(),
        syncReportRecord: vi.fn(),
    }
}));

vi.mock('../../services/users/users.service', () => ({
    usersService: {
        getByPrintUser: vi.fn(),
        create: vi.fn(),
    }
}));

vi.mock('../../services/printer/printer.scraper.service', () => ({
    printerScraperService: {
        downloadMonthlyCopies: vi.fn(),
    }
}));

vi.mock('../../services/report/report.scrapper.service', () => ({
    reportScrapperService: {
        parseReport: vi.fn(),
    }
}));

vi.mock('node:fs', () => ({
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    copyFileSync: vi.fn(),
}));

describe('CopiesFacade', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getUserCopies', () => {
        it('should allow admin to see any user copies', async () => {
            const adminUser = { id: 'admin-id', role: 'admin' };
            const targetUserId = 'customer-id';
            
            vi.mocked(copiesService.getUserCopies).mockResolvedValue([] as any);

            await copiesFacade.getUserCopies(adminUser, targetUserId);

            expect(copiesService.getUserCopies).toHaveBeenCalledWith(targetUserId, undefined, undefined);
        });

        it('should allow customer to see their own copies', async () => {
            const customerUser = { id: 'customer-id', role: 'customer' };
            const targetUserId = 'customer-id';
            
            vi.mocked(copiesService.getUserCopies).mockResolvedValue([] as any);

            await copiesFacade.getUserCopies(customerUser, targetUserId);

            expect(copiesService.getUserCopies).toHaveBeenCalledWith(targetUserId, undefined, undefined);
        });

        it('should forbid customer from seeing other user copies', async () => {
            const customerUser = { id: 'customer-id', role: 'customer' };
            const targetUserId = 'other-customer-id';

            await expect(copiesFacade.getUserCopies(customerUser, targetUserId))
                .rejects.toThrow('Unauthorized access to resource.');
            
            expect(copiesService.getUserCopies).not.toHaveBeenCalled();
        });
    });

    describe('syncPrinterCopies', () => {
        it('should forbid non-admin users from syncing', async () => {
            const customerUser = { id: 'customer-id', role: 'customer' };
            await expect(copiesFacade.syncPrinterCopies(customerUser)).rejects.toThrow('Only administrators can trigger printer sync.');
        });

        it('should orchestrate sync successfully', async () => {
            const adminUser = { id: 'admin-id', role: 'admin' };
            
            vi.mocked(printerScraperService.downloadMonthlyCopies).mockResolvedValue('/tmp/report.csv');
            vi.mocked(reportScrapperService.parseReport).mockResolvedValue([
                { userName: 'user1', a4Color: 10, a4Bw: 5, a3Color: 0, a3Bw: 0 }
            ]);
            vi.mocked(usersService.getByPrintUser).mockResolvedValue({ id: 'u1' } as any);
            vi.mocked(copiesService.syncReportRecord).mockResolvedValue({ id: 'rec1' } as any);
            vi.mocked(fs.existsSync).mockReturnValue(true);

            const result = await copiesFacade.syncPrinterCopies(adminUser);

            expect(result.status).toBe('success');
            expect(result.syncedCount).toBe(1);
            expect(copiesService.syncReportRecord).toHaveBeenCalled();
        });

        it('should auto-create users when not found in local DB', async () => {
            const adminUser = { id: 'admin-id', role: 'admin' };
            
            vi.mocked(printerScraperService.downloadMonthlyCopies).mockResolvedValue('/tmp/report.csv');
            vi.mocked(reportScrapperService.parseReport).mockResolvedValue([
                { userName: 'new-user', a4Color: 10, a4Bw: 5, a3Color: 0, a3Bw: 0 }
            ]);
            
            vi.mocked(usersService.getByPrintUser).mockResolvedValue(null);
            vi.mocked(usersService.create).mockResolvedValue({ id: 'new-u1' } as any);
            vi.mocked(copiesService.syncReportRecord).mockResolvedValue({ id: 'new-rec1' } as any);
            vi.mocked(fs.existsSync).mockReturnValue(true);

            const result = await copiesFacade.syncPrinterCopies(adminUser);

            expect(result.status).toBe('success');
            expect(result.syncedCount).toBe(1);
            expect(usersService.create).toHaveBeenCalledWith(expect.objectContaining({
                username: 'new-user',
                printUser: 'new-user'
            }));
            expect(copiesService.syncReportRecord).toHaveBeenCalledWith('new-u1', expect.anything(), expect.anything());
        });

        it('should handle errors when auto-creation fails', async () => {
            const adminUser = { id: 'admin-id', role: 'admin' };
            
            vi.mocked(printerScraperService.downloadMonthlyCopies).mockResolvedValue('/tmp/report.csv');
            vi.mocked(reportScrapperService.parseReport).mockResolvedValue([
                { userName: 'failed-user', a4Color: 10, a4Bw: 5, a3Color: 0, a3Bw: 0 }
            ]);
            
            vi.mocked(usersService.getByPrintUser).mockResolvedValue(null);
            vi.mocked(usersService.create).mockRejectedValue(new Error('DB Error'));

            const result = await copiesFacade.syncPrinterCopies(adminUser);

            expect(result.status).toBe('error');
            expect(result.syncedCount).toBe(0);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].message).toBe('DB Error');
        });
    });
});
