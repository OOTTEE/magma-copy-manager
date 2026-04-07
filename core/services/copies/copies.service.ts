import { randomUUID } from 'crypto';
import { copiesRepository } from '../../repositories/copies.repository';

export const copiesService = {
    getUserCopies: async (userId: string, from?: string, to?: string) => {
        const records = await copiesRepository.findCopiesByUserId(userId, from, to);
        return records.map(record => ({
            datetime: record.datetime,
            count: {
                a4Color: record.a4Color,
                a4Bw: record.a4Bw,
                a3Color: record.a3Color,
                a3Bw: record.a3Bw
            },
            total: {
                a4Color: record.a4ColorTotal,
                a4Bw: record.a4BwTotal,
                a3Color: record.a3ColorTotal,
                a3Bw: record.a3BwTotal
            },
            _links: {
                self: `/api/v1/users/${userId}/copies`,
                user: `/api/v1/users/${userId}`
            }
        }));
    },
    syncReportRecord: async (userId: string, reportData: { a4Color: number, a4Bw: number, a3Color: number, a3Bw: number }, datetime: string) => {
        const lastRecord = await copiesRepository.findLatestByUserId(userId);
        
        const calculateIncrement = (currentTotal: number, lastTotal: number) => {
            if (!lastRecord || currentTotal < lastTotal) {
                return currentTotal; // Reset or first record
            }
            return currentTotal - lastTotal;
        };

        const newRecord = {
            id: randomUUID(),
            userId,
            datetime,
            a4Color: calculateIncrement(reportData.a4Color, lastRecord?.a4ColorTotal || 0),
            a4Bw: calculateIncrement(reportData.a4Bw, lastRecord?.a4BwTotal || 0),
            a3Color: calculateIncrement(reportData.a3Color, lastRecord?.a3ColorTotal || 0),
            a3Bw: calculateIncrement(reportData.a3Bw, lastRecord?.a3BwTotal || 0),
            a4ColorTotal: reportData.a4Color,
            a4BwTotal: reportData.a4Bw,
            a3ColorTotal: reportData.a3Color,
            a3BwTotal: reportData.a3Bw
        };

        await copiesRepository.create(newRecord);
        return newRecord;
    }
};
