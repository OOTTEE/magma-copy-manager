import { describe, it, expect, vi, beforeEach } from 'vitest';
import { autoSyncService } from './auto-sync.service';
import { copiesFacade } from '../../facades/copies/copies.facade';
import { settingsService } from '../settings/settings.service';

vi.mock('../../facades/copies/copies.facade', () => ({
    copiesFacade: {
        syncPrinterCopies: vi.fn(),
    }
}));

vi.mock('../settings/settings.service', () => ({
    settingsService: {
        getSetting: vi.fn(),
        updateSetting: vi.fn(),
    }
}));

const mockRun = vi.fn();
vi.mock('../../db', () => ({
    db: {
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                run: mockRun,
            }))
        })),
    }
}));

describe('AutoSyncService', () => {
    const adminUser = { id: 'admin-id', role: 'admin' };

    beforeEach(() => {
        vi.clearAllMocks();
        // Speed up retries
        vi.spyOn(global, 'setTimeout').mockImplementation((fn: any) => fn() as any);
    });

    it('should retry up to 3 times on printer error and persist last error', async () => {
        vi.mocked(copiesFacade.syncPrinterCopies).mockRejectedValue(new Error('Connection Timed Out'));

        const result = await autoSyncService.runJob(adminUser);

        expect(copiesFacade.syncPrinterCopies).toHaveBeenCalledTimes(3);
        expect(result?.status).toBe('failed');
        expect(settingsService.updateSetting).toHaveBeenCalledWith('auto_sync_last_error', 'Connection Timed Out');
    });

    it('should clear last error on successful sync', async () => {
        vi.mocked(copiesFacade.syncPrinterCopies).mockResolvedValue({ 
            status: 'success',
            syncedCount: 5,
            errors: [],
            reportPath: '/fake/path'
        });

        const result = await autoSyncService.runJob(adminUser);

        expect(result?.status).toBe('success');
        expect(result?.summary).toContain('5 usuarios');
        expect(settingsService.updateSetting).toHaveBeenCalledWith('auto_sync_last_error', '');
    });

    it('should respect the "isRunning" lock', async () => {
        vi.mocked(copiesFacade.syncPrinterCopies).mockImplementation(() => new Promise(resolve => 
            setTimeout(() => resolve({ 
                status: 'success',
                syncedCount: 1, 
                errors: [], 
                reportPath: '' 
            }), 100)
        ));
        
        // Start one
        const promise1 = autoSyncService.runJob(adminUser, 'manual');
        // Start second immediately
        const promise2 = autoSyncService.runJob(adminUser, 'manual');

        await expect(promise2).rejects.toThrow(/already running/);
        await promise1;
    });
});
