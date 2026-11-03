import { describe, it, expect, beforeAll } from 'vitest';
import { getTestEnv } from '../../testEnv';
import { db } from '../../db';
import { users, copies, nexudusSales } from '../../db/schema';
import { reportsService } from './reports.service';
import { copiesRepository } from '../../repositories/copies.repository';
import { randomUUID } from 'crypto';

describe('Reports & Copies Period Attribution', () => {
  let testUserId: string;
  let octSaleId: string;
  let octBilledCopyId: string;
  let octNormalCopyId: string;
  let novPendingCopyId: string;

  beforeAll(async () => {
    await getTestEnv();

    testUserId = randomUUID();
    octSaleId = randomUUID();
    octBilledCopyId = randomUUID();
    octNormalCopyId = randomUUID();
    novPendingCopyId = randomUUID();

    // 1. Create a test user
    await db.insert(users).values({
      id: testUserId,
      username: `test-attrib-${Date.now()}`,
      password: 'hashed-password',
      role: 'customer',
      printUser: `print-attrib-${Date.now()}`,
      nexudusUser: `nex-attrib-${Date.now()}`,
      a3NoPaperMode: 0,
      isIgnored: 0,
    });

    // 2. Insert October sale record (month = '2026-10')
    await db.insert(nexudusSales).values({
      id: octSaleId,
      userId: testUserId,
      nexudusAccountId: null,
      type: 'a4Bw',
      quantity: 25,
      month: '2026-10',
      nexudusSaleId: 'nex-sale-99991',
      nexudusProductId: 'nex-prod-1',
      saleDate: '2026-10-28T10:00:00.000Z',
      createdOn: '2026-10-28T10:00:00.000Z',
    });

    // 3. Insert normal copy in October physical range (Oct 15)
    await db.insert(copies).values({
      id: octNormalCopyId,
      userId: testUserId,
      datetime: '2026-10-15T12:00:00.000Z',
      a4Bw: 10,
      a4Color: 0,
      a3Bw: 0,
      a3Color: 0,
      a4BwTotal: 10,
      a4ColorTotal: 0,
      a3BwTotal: 0,
      a3ColorTotal: 0,
      nexudusSaleId: octSaleId,
    });

    // 4. Insert copy on Oct 28 linked to the October sale
    // (Physical datetime falls into Nov billing period range when cycle day is 27/28)
    await db.insert(copies).values({
      id: octBilledCopyId,
      userId: testUserId,
      datetime: '2026-10-28T12:00:00.000Z',
      a4Bw: 15,
      a4Color: 0,
      a3Bw: 0,
      a3Color: 0,
      a4BwTotal: 25,
      a4ColorTotal: 0,
      a3BwTotal: 0,
      a3ColorTotal: 0,
      nexudusSaleId: octSaleId,
    });

    // 5. Insert November unbilled/pending copy
    await db.insert(copies).values({
      id: novPendingCopyId,
      userId: testUserId,
      datetime: '2026-11-05T12:00:00.000Z',
      a4Bw: 5,
      a4Color: 0,
      a3Bw: 0,
      a3Color: 0,
      a4BwTotal: 30,
      a4ColorTotal: 0,
      a3BwTotal: 0,
      a3ColorTotal: 0,
      nexudusSaleId: null,
    });
  });

  it('attributes both physical October copies and Oct 28 edge copies to October (2026-10)', async () => {
    const reportOct = await reportsService.getMonthlyAccumulation({
      period: '2026-10',
      filter: 'all',
      includeIgnored: true
    });

    const userOct = reportOct.data.find(u => u.id === testUserId);
    expect(userOct).toBeDefined();
    // Total should reflect both the normal copy (10) and the edge copy (15) = 25
    expect(userOct?.status).toBe('billed');
    expect(userOct?.total).toBe(25);
    expect(userOct?.copies?.synced).toBe(25);
    expect(userOct?.copies?.byType?.a4Bw?.total).toBe(25);
    expect(userOct?.copies?.byType?.a4Bw?.billed).toBe(25);
  });

  it('excludes the Oct 28 billed copy from November (2026-11) accumulation', async () => {
    const reportNov = await reportsService.getMonthlyAccumulation({
      period: '2026-11',
      filter: 'all',
      includeIgnored: true
    });

    const userNov = reportNov.data.find(u => u.id === testUserId);
    expect(userNov).toBeDefined();
    // Billed should be 0 in November; only the pending copy from Nov 5 is present
    expect(userNov?.status).toBe('pending');
    expect(userNov?.total).toBe(5);
    expect(userNov?.copies?.synced).toBe(0);
    expect(userNov?.copies?.byType?.a4Bw?.total).toBe(5);
    expect(userNov?.copies?.byType?.a4Bw?.billed).toBe(0);
  });

  it('copiesRepository.findCopiesByUserId filters copies by period correctly', async () => {
    const datesOct = await reportsService.getPeriodDates('2026-10');
    const octCopies = await copiesRepository.findCopiesByUserId(
      testUserId,
      datesOct.fromStr,
      datesOct.toStr,
      '2026-10'
    );
    expect(octCopies.length).toBe(2);
    expect(octCopies.some(c => c.id === octBilledCopyId)).toBe(true);
    expect(octCopies.some(c => c.id === octNormalCopyId)).toBe(true);

    const datesNov = await reportsService.getPeriodDates('2026-11');
    const novCopies = await copiesRepository.findCopiesByUserId(
      testUserId,
      datesNov.fromStr,
      datesNov.toStr,
      '2026-11'
    );
    expect(novCopies.length).toBe(1);
    expect(novCopies[0].id).toBe(novPendingCopyId);
  });
});
