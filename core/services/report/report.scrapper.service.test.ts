import { describe, it, expect, vi } from 'vitest';
import { reportScrapperService } from './report.scrapper.service';
import * as fs from 'node:fs';

const { mockFs } = vi.hoisted(() => ({
    mockFs: {
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
    }
}));

vi.mock('node:fs', () => mockFs);

describe('ReportScrapperService', () => {
    it('should parse a Konica Minolta report correctly', async () => {
        const mockFilePath = 'mock_report.txt';
        
        // Row 9: Planb
        const mockContent = [
            "Machine Name\tC224e",
            "Serial No.\tA5C4021034327",
            "Date\t31/3/2026 10:36",
            "Headers 1",
            "Headers 2",
            "Headers 3",
            "Spacer",
            "Antonio Moom\t29\t2\t29\t29\t0\t29\t0\t10\t20\t0\t0\t0\t2\t5\t0\t0\t0\t15\t30\t0\t0\t3\t6\t0\t0",
            "Planb\t13\t0\t13\t11\t2\t13\t2\t5\t10\t0\t0\t0\t1\t2\t0\t0\t0\t4\t8\t0\t0\t2\t4\t0\t0"
        ].join('\n');

        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(mockContent);

        const results = await reportScrapperService.parseReport(mockFilePath);

        expect(results).toHaveLength(2);

        // Antonio Moom calculation:
        // a4Color = (Idx 8 - (Idx 13 * 2)) + (Idx 18 - (Idx 22 * 2)) => (10-4) + (15-6) = 6 + 9 = 15
        // a4Bw = (Idx 9 - (Idx 14 * 2)) + (Idx 19 - (Idx 23 * 2))    => (20-10) + (30-12) = 10 + 18 = 28
        // a3Color = Idx 13 + Idx 22 = 2 + 3 = 5
        // a3Bw = Idx 14 + Idx 23 = 5 + 6 = 11
        expect(results[0]).toEqual({
            userName: 'Antonio Moom',
            a4Color: 15,
            a4Bw: 28,
            a3Color: 5,
            a3Bw: 11
        });

        // Planb (Special case: A3 becomes SRA3)
        // a4Color = (Idx 8 - (Idx 13 * 2)) + (Idx 18 - (Idx 22 * 2)) => (5-2) + (4-4) = 3 + 0 = 3
        // a4Bw = (Idx 9 - (Idx 14 * 2)) + (Idx 19 - (Idx 23 * 2))    => (10-4) + (8-8) = 6 + 0 = 6
        // a3Color = Idx 13 + Idx 22 = 1 + 2 = 3
        // a3Bw = Idx 14 + Idx 23 = 2 + 4 = 6
        expect(results[1]).toEqual({
            userName: 'Planb',
            a4Color: 3,
            a4Bw: 6,
            a3Color: 3,
            a3Bw: 6
        });
    });
});
