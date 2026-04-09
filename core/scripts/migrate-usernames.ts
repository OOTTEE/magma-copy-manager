import { db } from '../db';
import { users } from '../db/schema';
import { sanitizeUsername } from '../lib/string.utils';
import { eq, not } from 'drizzle-orm';
import { logger } from '../lib/logger';

/**
 * Migration script to normalize all usernames in the database.
 * Lowercase, no spaces, allowed: [a-z0-9._]
 */
async function migrateUsernames() {
  logger.info('--- Starting Username Migration ---');

  try {
    const allUsers = await db.select().from(users).all();
    logger.info(`Found ${allUsers.length} users to check.`);

    let updatedCount = 0;
    let collisionCount = 0;

    for (const user of allUsers) {
      const originalUsername = user.username;
      const sanitized = sanitizeUsername(originalUsername);

      if (originalUsername === sanitized) {
        continue;
      }

      logger.info(`Normalizing: "${originalUsername}" -> "${sanitized}"`);

      // Check for collision
      const collision = allUsers.find(u => u.username === sanitized && u.id !== user.id);
      
      let finalUsername = sanitized;
      if (collision) {
        collisionCount++;
        // Generate a non-colliding username by adding a small suffix
        let suffix = 1;
        while (allUsers.some(u => u.username === `${sanitized}${suffix}`)) {
          suffix++;
        }
        finalUsername = `${sanitized}${suffix}`;
        logger.warn(`Collision detected for "${sanitized}". Using "${finalUsername}" instead.`);
      }

      // Update in DB
      await db.update(users)
        .set({ username: finalUsername })
        .where(eq(users.id, user.id))
        .run();
      
      updatedCount++;
      
      // Update our local cache to avoid collisions with already processed users in the same loop
      user.username = finalUsername;
    }

    logger.info('--- Migration Complete ---');
    logger.info(`Users updated: ${updatedCount}`);
    logger.info(`Collisions handled: ${collisionCount}`);

  } catch (error) {
    logger.error(error, 'Error during username migration');
    process.exit(1);
  }
}

migrateUsernames().then(() => {
  process.exit(0);
});
