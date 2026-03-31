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
    addCopies: async (userId: string, data: any) => {
        const newRecord = {
            id: require('crypto').randomUUID(),
            userId,
            datetime: data.datetime,
            a4Color: data.count?.a4Color || 0,
            a4Bw: data.count?.a4Bw || 0,
            a3Color: data.count?.a3Color || 0,
            a3Bw: data.count?.a3Bw || 0,
            a4ColorTotal: data.total?.a4Color || 0,
            a4BwTotal: data.total?.a4Bw || 0,
            a3ColorTotal: data.total?.a3Color || 0,
            a3BwTotal: data.total?.a3Bw || 0
        };
        await copiesRepository.create(newRecord);
        return data;
    },
    updateCopies: async (id: string, userId: string, data: any) => {
        const updateRecord: any = {};
        if (data.datetime) updateRecord.datetime = data.datetime;
        if (data.count) {
            if (data.counta4Color !== undefined) updateRecord.a4Color = data.counta4Color;
            if (data.counta4Bw !== undefined) updateRecord.a4Bw = data.counta4Bw;
            if (data.counta3Color !== undefined) updateRecord.a3Color = data.counta3Color;
            if (data.counta3Bw !== undefined) updateRecord.a3Bw = data.counta3Bw;
        }
        if (data.total) {
            if (data.totala4Color !== undefined) updateRecord.a4ColorTotal = data.totala4Color;
            if (data.totala4Bw !== undefined) updateRecord.a4BwTotal = data.totala4Bw;
            if (data.totala3Color !== undefined) updateRecord.a3ColorTotal = data.totala3Color;
            if (data.totala3Bw !== undefined) updateRecord.a3BwTotal = data.totala3Bw;
        }
        await copiesRepository.update(id, userId, updateRecord);
        return data;
    },
    deleteCopies: async (id: string, userId: string) => {
        await copiesRepository.delete(id, userId);
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
            id: require('crypto').randomUUID(),
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
