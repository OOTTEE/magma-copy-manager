import * as fs from 'node:fs';
import * as path from 'node:path';

export interface UserCopyReport {
    userName: string;
    a4Color: number;
    a4Bw: number;
    a3Color: number;
    a3Bw: number;
    sra3Color: number;
    sra3Bw: number;
}

class ReportScrapperService {
    
    /**
     * Parses the Konica Minolta CSV report (UTF-16, TAB-separated)
     * and returns an array of UserCopyReport objects.
     */
    public async parseReport(filePath: string): Promise<UserCopyReport[]> {
        if (!fs.existsSync(filePath)) {
            throw new Error(`[ReportScrapper] File not found: ${filePath}`);
        }

        // Read file as UTF-16LE
        // Note: Konica Minolta reports typically have a BOM. 
        // Read as string with proper encoding.
        const content = fs.readFileSync(filePath, 'utf16le');
        const lines = content.split(/\r?\n/);

        // Skip potential BOM and empty lines, and filter for actual user data
        // According to specification, data starts at line 8 (0-indexed 7)
        const dataLines = lines.slice(7).filter(line => line.trim().length > 0);

        const reports: UserCopyReport[] = [];

        for (const line of dataLines) {
            const columns = line.split('\t').map(c => c.trim());
            
            if (columns.length < 25) continue; // Skip malformed or insufficient rows

            const userName = columns[0];
            if (!userName || userName === 'User Name') continue;

            // Helper to parse numbers safely
            const val = (idx: number) => parseInt(columns[idx]) || 0;

            // Calculations from REPORT_SCRAPPER_SERVICE.MD mapping:
            // a4Color = (Index 8 - Index 13) + (Index 18 - Index 22)
            // a4Bw = (Index 9 - Index 14) + (Index 19 - Index 23)
            
            const copyA3A4Color = val(8);
            const copyA3A4Bw = val(9);
            const copyA3Color = val(13);
            const copyA3Bw = val(14);
            
            const printA3A4Color = val(18);
            const printA3A4Bw = val(19);
            const printA3Color = val(22);
            const printA3Bw = val(23);

            const a4Color = (copyA3A4Color - (copyA3Color * 2)) + (printA3A4Color - (printA3Color * 2));
            const a4Bw = (copyA3A4Bw - (copyA3Bw * 2)) + (printA3A4Bw - (printA3Bw * 2));

            let a3Color = 0;
            let a3Bw = 0;
            let sra3Color = 0;
            let sra3Bw = 0;

            const totalA3Color = copyA3Color + printA3Color;
            const totalA3Bw = copyA3Bw + printA3Bw;

            if (userName.toLowerCase() === 'planb') {
                sra3Color = totalA3Color;
                sra3Bw = totalA3Bw;
                a3Color = 0;
                a3Bw = 0;
            } else {
                a3Color = totalA3Color;
                a3Bw = totalA3Bw;
                sra3Color = 0;
                sra3Bw = 0;
            }

            reports.push({
                userName,
                a4Color,
                a4Bw,
                a3Color,
                a3Bw,
                sra3Color,
                sra3Bw
            });
        }

        return reports;
    }
}

export const reportScrapperService = new ReportScrapperService();
