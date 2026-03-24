import { copiesRepository } from '../repositories/copies.repository';

export const copiesService = {
    getUserCopies: async (userId: string, from?: string, to?: string) => {
        const records = await copiesRepository.findCopiesByUserId(userId, from, to);
        return records.map(record => ({
            datetime: record.datetime,
            count: {
                a4Color: record.a4Color,
                a4Bw: record.a4Bw,
                a3Color: record.a3Color,
                a3Bw: record.a3Bw,
                sra3Color: record.sra3Color,
                sra3Bw: record.sra3Bw
            },
            total: {
                a4Color: record.a4ColorTotal,
                a4Bw: record.a4BwTotal,
                a3Color: record.a3ColorTotal,
                a3Bw: record.a3BwTotal,
                sra3Color: record.sra3ColorTotal,
                sra3Bw: record.sra3BwTotal
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
            sra3Color: data.count?.sra3Color || 0,
            sra3Bw: data.count?.sra3Bw || 0,
            a4ColorTotal: data.total?.a4Color || 0,
            a4BwTotal: data.total?.a4Bw || 0,
            a3ColorTotal: data.total?.a3Color || 0,
            a3BwTotal: data.total?.a3Bw || 0,
            sra3ColorTotal: data.total?.sra3Color || 0,
            sra3BwTotal: data.total?.sra3Bw || 0,
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
            if (data.countsra3Color !== undefined) updateRecord.sra3Color = data.countsra3Color;
            if (data.countsra3Bw !== undefined) updateRecord.sra3Bw = data.countsra3Bw;
        }
        if (data.total) {
            if (data.totala4Color !== undefined) updateRecord.a4ColorTotal = data.totala4Color;
            if (data.totala4Bw !== undefined) updateRecord.a4BwTotal = data.totala4Bw;
            if (data.totala3Color !== undefined) updateRecord.a3ColorTotal = data.totala3Color;
            if (data.totala3Bw !== undefined) updateRecord.a3BwTotal = data.totala3Bw;
            if (data.totalsra3Color !== undefined) updateRecord.sra3ColorTotal = data.totalsra3Color;
            if (data.totalsra3Bw !== undefined) updateRecord.sra3BwTotal = data.totalsra3Bw;
        }
        await copiesRepository.update(id, userId, updateRecord);
        return data;
    },
    deleteCopies: async (id: string, userId: string) => {
        await copiesRepository.delete(id, userId);
    }
};
