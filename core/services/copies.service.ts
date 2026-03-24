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
    }
};
