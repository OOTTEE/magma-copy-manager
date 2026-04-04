import { reportsService } from '../reports/reports.service';
import { settingsService } from '../settings/settings.service';

/**
 * Billing Service
 * 
 * Handles invoice generation and simulation logic.
 */
export const billingService = {
  /**
   * Simulates an invoice for a specific user based on current consumption.
   * Business Rule: No persistence, pure calculation.
   */
  simulateInvoice: async (userId: string) => {
    const report = await reportsService.getMonthlyAccumulationForUser(userId);
    if (!report || report.data.total === 0) {
      const error = new Error('No consumption data found for this user in the current period.');
      (error as any).statusCode = 400;
      throw error;
    }

    const settings = await settingsService.getAllSettings();
    const data = report.data;
    const isSRA3 = data.a3NoPaperMode;

    const lines: Array<{ concept: string; quantity: number; unitPrice: number; total: number }> = [];

    // A4 BW
    if (data.a4Bw > 0) {
      const price = parseFloat(settings.price_a4_bw || '0.05');
      lines.push({
        concept: 'Copias A4 B/N (con papel)',
        quantity: data.a4Bw,
        unitPrice: price,
        total: Number((data.a4Bw * price).toFixed(2))
      });
    }

    // A4 Color
    if (data.a4Color > 0) {
      const price = parseFloat(settings.price_a4_color || '0.15');
      lines.push({
        concept: 'Copias A4 Color (con papel)',
        quantity: data.a4Color,
        unitPrice: price,
        total: Number((data.a4Color * price).toFixed(2))
      });
    }

    // A3 BW / SRA3 BW
    const a3BwCount = isSRA3 ? data.sra3Bw : data.a3Bw;
    if (a3BwCount > 0) {
      const priceKey = isSRA3 ? 'price_a3_bw_no_paper' : 'price_a3_bw';
      const price = parseFloat(settings[priceKey] || '0.10');
      lines.push({
        concept: isSRA3 ? 'Copias SRA3 B/N (sin papel)' : 'Copias A3 B/N (con papel)',
        quantity: a3BwCount,
        unitPrice: price,
        total: Number((a3BwCount * price).toFixed(2))
      });
    }

    // A3 Color / SRA3 Color
    const a3ColorCount = isSRA3 ? data.sra3Color : data.a3Color;
    if (a3ColorCount > 0) {
      const priceKey = isSRA3 ? 'price_a3_color_no_paper' : 'price_a3_color';
      const price = parseFloat(settings[priceKey] || '0.30');
      lines.push({
        concept: isSRA3 ? 'Copias SRA3 Color (sin papel)' : 'Copias A3 Color (con papel)',
        quantity: a3ColorCount,
        unitPrice: price,
        total: Number((a3ColorCount * price).toFixed(2))
      });
    }

    const total = Number(lines.reduce((acc, curr) => acc + curr.total, 0).toFixed(2));

    return {
      userId,
      username: data.username,
      period: report.period,
      lines,
      total
    };
  }
};
