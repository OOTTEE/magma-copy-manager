import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

const { mockDb } = vi.hoisted(() => ({
    mockDb: {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        run: vi.fn(),
    }
}));

vi.mock('../../db', () => ({
    db: mockDb
}));

describe('AutoSyncService', () => {
    const adminUser = { id: 'admin-id', role: 'admin' };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        autoSyncService.resetState();
        
        // Setup default DB chain
        mockDb.insert.mockReturnThis();
        mockDb.values.mockReturnThis();
        mockDb.run.mockReturnValue({ changes: 1 });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should retry up to 3 times on printer error and persist last error', async () => {
        vi.mocked(copiesFacade.syncPrinterCopies).mockRejectedValue(new Error('Connection Timed Out'));

        const promise = autoSyncService.runJob(adminUser);
        
        // Advance timers for 3 retries
        await vi.advanceTimersByTimeAsync(30000);
        await vi.advanceTimersByTimeAsync(30000);
        
        const result = await promise;

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
        
        // Advance timers to resolve promise1
        vi.advanceTimersByTime(100);
        await promise1;
    });
});
