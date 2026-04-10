import { vi } from 'vitest';

// Global mock for PrinterScraperService to prevent any network/playwright calls
vi.mock('./services/printer/printer.scraper.service', () => ({
    printerScraperService: {
        downloadMonthlyCopies: vi.fn(async () => {
            console.log('--- GLOBAL MOCK: PrinterScraperService.downloadMonthlyCopies ---');
            return '/tmp/mock_printer_report.csv';
        })
    }
}));

// Mock EmailService to prevent real SMTP connections
vi.mock('./services/notifications/email.service', () => ({
    emailService: {
        sendNotification: vi.fn(async () => {
            console.log('--- GLOBAL MOCK: EmailService.sendNotification ---');
            return { success: true };
        }),
        init: vi.fn()
    }
}));
