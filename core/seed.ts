import { db } from './db';
import { users, copies } from './db/schema';

async function seed() {
    console.log('Seeding...');
    const userId = 'user-1';
    await db.insert(users).values({
        id: userId,
        printUser: 'p.user1',
        nexudusUser: 'n.user1'
    });

    const currentDate = new Date();
    await db.insert(copies).values({
        id: 'copy-1',
        userId,
        from: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(),
        to: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15).toISOString(),
        a4Copies: 10,
        a3Copies: 2,
        sra3Copies: 0,
        colorCopies: 5,
        bwCopies: 7,
        totalCopies: 12
    });

    console.log('Done seeding.');
    process.exit(0);
}
seed();
