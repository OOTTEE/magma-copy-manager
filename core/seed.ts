import { db } from './db';
import { users, copies, invoices, invoiceItems } from './db/schema';

async function seed() {
    console.log('Seeding...');
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    await db.insert(users).values({
        id: userId,
        printUser: 'p.user1',
        nexudusUser: 'n.user1'
    });

    const currentDate = new Date();
    await db.insert(copies).values({
        id: '987e6543-e21b-12d3-a456-426614174000',
        userId,
        datetime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15).toISOString(),
        a4Color: 5,
        a4Bw: 10,
        a3Color: 2,
        a3Bw: 4,
        sra3Color: 1,
        sra3Bw: 2,
        a4ColorTotal: 5,
        a4BwTotal: 10,
        a3ColorTotal: 2,
        a3BwTotal: 4,
        sra3ColorTotal: 1,
        sra3BwTotal: 2
    });

    await db.insert(invoices).values({
        id: 'inv-1',
        userId,
        from: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(),
        to: new Date(currentDate.getFullYear(), currentDate.getMonth(), 28).toISOString(),
        total: 100
    });

    await db.insert(invoiceItems).values({
        id: 'inv-item-1',
        invoiceId: 'inv-1',
        concept: 'Color Copies',
        quantity: 5,
        unitPrice: 20,
        total: 100
    });

    console.log('Done seeding.');
    process.exit(0);
}
seed();
