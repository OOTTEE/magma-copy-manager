import { reportScrapperService } from '../services/report.scrapper.service';
import * as path from 'node:path';

async function main() {
    const reportPath = process.argv[2];

    if (!reportPath) {
        console.error('Usage: npx tsx core/scripts/parse-report.ts <PATH_TO_REPORT_FILE>');
        process.exit(1);
    }

    const absolutePath = path.resolve(reportPath);
    console.log(`[CLI] Parsing report: ${absolutePath}`);

    try {
        const results = await reportScrapperService.parseReport(absolutePath);
        console.log(`[CLI] Successfully parsed ${results.length} users.`);
        console.table(results);
        
        // Final summary
        const totals = results.reduce((acc, curr) => {
            acc.a4Color += curr.a4Color;
            acc.a4Bw += curr.a4Bw;
            acc.a3Color += curr.a3Color;
            acc.a3Bw += curr.a3Bw;
            acc.sra3Color += curr.sra3Color;
            acc.sra3Bw += curr.sra3Bw;
            return acc;
        }, { a4Color: 0, a4Bw: 0, a3Color: 0, a3Bw: 0, sra3Color: 0, sra3Bw: 0 });

        console.log('\n[CLI] TOTALS SUMMARY:');
        console.table([totals]);

    } catch (error: any) {
        console.error(`[CLI] Error parsing report: ${error.message}`);
        process.exit(1);
    }
}

main();
