import { db } from '../db';
import { users, userNexudusAccounts, nexudusSales } from '../db/schema';
import { randomUUID } from 'crypto';
import { eq, isNotNull } from 'drizzle-orm';
import { logger } from '../lib/logger';

async function migrate() {
    logger.info('Starting Nexudus accounts migration...');
    
    // 1. Get all users with a nexudusUser
    const existingUsers = await db.select().from(users).where(isNotNull(users.nexudusUser)).all();
    
    logger.info(`Found ${existingUsers.length} users to migrate.`);
    
    for (const user of existingUsers) {
        if (!user.nexudusUser) continue;
        
        // 2. Create the account record
        const accountId = randomUUID();
        await db.insert(userNexudusAccounts).values({
            id: accountId,
            userId: user.id,
            nexudusUserId: user.nexudusUser,
            isDefault: 1,
            createdOn: new Date().toISOString()
        }).run();
        
        logger.info(`Migrated user ${user.username} to account ${accountId}`);
        
        // 3. Backfill sales for this user
        const result = await db.update(nexudusSales)
            .set({ nexudusAccountId: accountId })
            .where(eq(nexudusSales.userId, user.id))
            .run();
            
        logger.info(`Updated ${result.rowsAffected} sales for user ${user.username}`);
    }
    
    logger.info('Migration completed successfully.');
}

migrate().catch(err => {
    logger.error(err, 'Migration failed');
    process.exit(1);
});
