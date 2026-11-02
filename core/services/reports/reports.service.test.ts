import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportsService } from './reports.service';
import { settingsService } from '../settings/settings.service';
import { db } from '../../db';

vi.mock('../settings/settings.service', () => ({
  settingsService: {
    getSetting: vi.fn().mockResolvedValue('27'),
  }
}));

const mockAll = vi.fn();
const mockGet = vi.fn();

vi.mock('../../db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        leftJoin: vi.fn(() => ({
          groupBy: vi.fn(() => ({
            all: mockAll,
          })),
          where: vi.fn(() => ({
            groupBy: vi.fn(() => ({
              get: mockGet,
            }))
          }))
        }))
      }))
    }))
  }
}));

describe('ReportsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate current and previous period dates based on cycle day', async () => {
    const currentPeriod = await reportsService.getPeriodDates(0);
    const previousPeriod = await reportsService.getPeriodDates(-1);

    expect(currentPeriod.fromStr).toBeDefined();
    expect(currentPeriod.toStr).toBeDefined();
    expect(previousPeriod.fromStr).toBeDefined();
    expect(previousPeriod.toStr).toBeDefined();

    const currStart = new Date(currentPeriod.fromStr);
    const prevStart = new Date(previousPeriod.fromStr);

    expect(currStart.getTime()).toBeGreaterThan(prevStart.getTime());
  });

  it('should map aggregation result and calculate hasLinkedAccount correctly', () => {
    const userWithAccount = reportsService.mapAccumulationResult({
      id: 'u1',
      username: 'user1',
      printUser: 'p1',
      nexudusUser: null,
      a4Color: 5,
      a4Bw: 10,
      a3Color: 2,
      a3Bw: 1,
      a3NoPaperMode: false,
      accountsCount: 1,
    });

    expect(userWithAccount.hasLinkedAccount).toBe(true);
    expect(userWithAccount.total).toBe(18);

    const userWithoutAccount = reportsService.mapAccumulationResult({
      id: 'u2',
      username: 'user2',
      printUser: 'p2',
      nexudusUser: null,
      a4Color: 0,
      a4Bw: 0,
      a3Color: 0,
      a3Bw: 0,
      a3NoPaperMode: false,
      accountsCount: 0,
    });

    expect(userWithoutAccount.hasLinkedAccount).toBe(false);
    expect(userWithoutAccount.total).toBe(0);
  });
});
