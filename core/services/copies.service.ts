import { copiesRepository } from '../repositories/copies.repository';

export const copiesService = {
    getUserCopies: async (userId: string, from?: string, to?: string) => {
        const records = await copiesRepository.findCopiesByUserId(userId, from, to);
        return records.map(record => ({
            datetime: record.datetime,
            count: {
                "a4-color": record.a4Color,
                "a4-bw": record.a4Bw,
                "a3-color": record.a3Color,
                "a3-bw": record.a3Bw,
                "sra3-color": record.sra3Color,
                "sra3-bw": record.sra3Bw
            },
            total: {
                "a4-color": record.a4ColorTotal,
                "a4-bw": record.a4BwTotal,
                "a3-color": record.a3ColorTotal,
                "a3-bw": record.a3BwTotal,
                "sra3-color": record.sra3ColorTotal,
                "sra3-bw": record.sra3BwTotal
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
            a4Color: data.count?.["a4-color"] || 0,
            a4Bw: data.count?.["a4-bw"] || 0,
            a3Color: data.count?.["a3-color"] || 0,
            a3Bw: data.count?.["a3-bw"] || 0,
            sra3Color: data.count?.["sra3-color"] || 0,
            sra3Bw: data.count?.["sra3-bw"] || 0,
            a4ColorTotal: data.total?.["a4-color"] || 0,
            a4BwTotal: data.total?.["a4-bw"] || 0,
            a3ColorTotal: data.total?.["a3-color"] || 0,
            a3BwTotal: data.total?.["a3-bw"] || 0,
            sra3ColorTotal: data.total?.["sra3-color"] || 0,
            sra3BwTotal: data.total?.["sra3-bw"] || 0,
        };
        await copiesRepository.create(newRecord);
        return data;
    },
    updateCopies: async (id: string, userId: string, data: any) => {
        const updateRecord: any = {};
        if (data.datetime) updateRecord.datetime = data.datetime;
        if (data.count) {
            if (data.count["a4-color"] !== undefined) updateRecord.a4Color = data.count["a4-color"];
            if (data.count["a4-bw"] !== undefined) updateRecord.a4Bw = data.count["a4-bw"];
            if (data.count["a3-color"] !== undefined) updateRecord.a3Color = data.count["a3-color"];
            if (data.count["a3-bw"] !== undefined) updateRecord.a3Bw = data.count["a3-bw"];
            if (data.count["sra3-color"] !== undefined) updateRecord.sra3Color = data.count["sra3-color"];
            if (data.count["sra3-bw"] !== undefined) updateRecord.sra3Bw = data.count["sra3-bw"];
        }
        if (data.total) {
            if (data.total["a4-color"] !== undefined) updateRecord.a4ColorTotal = data.total["a4-color"];
            if (data.total["a4-bw"] !== undefined) updateRecord.a4BwTotal = data.total["a4-bw"];
            if (data.total["a3-color"] !== undefined) updateRecord.a3ColorTotal = data.total["a3-color"];
            if (data.total["a3-bw"] !== undefined) updateRecord.a3BwTotal = data.total["a3-bw"];
            if (data.total["sra3-color"] !== undefined) updateRecord.sra3ColorTotal = data.total["sra3-color"];
            if (data.total["sra3-bw"] !== undefined) updateRecord.sra3BwTotal = data.total["sra3-bw"];
        }
        await copiesRepository.update(id, userId, updateRecord);
        return data;
    },
    deleteCopies: async (id: string, userId: string) => {
        await copiesRepository.delete(id, userId);
    }
};
