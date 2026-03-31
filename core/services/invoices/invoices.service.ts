import { invoicesRepository } from '../../repositories/invoices.repository';

export const invoicesService = {
    getUserInvoices: async (userId: string, from?: string, to?: string) => {
        const records = await invoicesRepository.findInvoicesByUserId(userId, from, to);
        return records.map(record => ({
            from: record.from,
            to: record.to,
            total: record.total,
            _links: {
                self: `/api/v1/users/${userId}/invoices/${record.id}`,
                user: `/api/v1/users/${userId}`
            }
        }));
    },
    getInvoiceById: async (id: string, userId: string) => {
        const record = await invoicesRepository.findById(id, userId);
        if (!record) return null;
        return {
            from: record.from,
            to: record.to,
            total: record.total,
            _links: {
                self: `/api/v1/users/${userId}/invoices/${record.id}`,
                user: `/api/v1/users/${userId}`
            }
        };
    },
    createInvoice: async (userId: string, data: any) => {
        const newRecord = {
            id: require('crypto').randomUUID(),
            userId,
            from: data.from,
            to: data.to,
            total: data.total
        };
        await invoicesRepository.create(newRecord);
        return data;
    },
    updateInvoice: async (id: string, userId: string, data: any) => {
        const updateRecord: any = {};
        if (data.from) updateRecord.from = data.from;
        if (data.to) updateRecord.to = data.to;
        if (data.total !== undefined) updateRecord.total = data.total;
        
        await invoicesRepository.update(id, userId, updateRecord);
        return data;
    },
    deleteInvoice: async (id: string, userId: string) => {
        await invoicesRepository.delete(id, userId);
    }
};
