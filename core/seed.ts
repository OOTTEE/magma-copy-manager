import { db } from './db';
import { users, copies, nexudusSales } from './db/schema';
import * as argon2 from 'argon2';
import { logger } from './lib/logger';
import { randomUUID } from 'crypto';

async function seed() {
    logger.info('Seeding...');
    
    const adminPassword = await argon2.hash('admin123');
    const customerPassword = await argon2.hash('customer123');

    const adminId = 'admin-uuid-1';
    await db.insert(users).values({
        id: adminId,
        username: 'admin',
        password: adminPassword,
        role: 'admin',
        printUser: 'admin.print',
        nexudusUser: 'admin.nexudus'
    }).run();

    const customerId = '123e4567-e89b-12d3-a456-426614174000';
    await db.insert(users).values({
        id: customerId,
        username: 'ote',
        password: customerPassword,
        role: 'customer',
        printUser: 'p.user1',
        nexudusUser: 'n.user1'
    }).run();

    const currentDate = new Date();
    const monthStr = currentDate.toISOString().slice(0, 7);

    // Seed copies
    await db.insert(copies).values({
        id: randomUUID(),
        userId: customerId,
        datetime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15).toISOString(),
        a4Color: 5,
        a4Bw: 10,
        a3Color: 2,
        a3Bw: 4,
        a4ColorTotal: 100,
        a4BwTotal: 500,
        a3ColorTotal: 50,
        a3BwTotal: 200,
    }).run();

    // Seed a Nexudus Sale for historical dashboard
    await db.insert(nexudusSales).values({
        id: randomUUID(),
        userId: customerId,
        month: monthStr,
        type: 'a4Bw',
        quantity: 25,
        nexudusSaleId: 'nex-sale-123',
        nexudusProductId: 'product-99',
        saleDate: new Date().toISOString(),
        createdOn: new Date().toISOString()
    }).run();

    logger.info('Done seeding database with Admin and Customer ote.');
    process.exit(0);
}

seed().catch(err => {
    logger.error(err, 'Seed failed');
    process.exit(1);
});
