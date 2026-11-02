import { describe, it, expect } from 'vitest';
import { isPeriodClosed } from './billing.service';

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
