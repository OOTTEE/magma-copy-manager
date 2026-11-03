import * as argon2 from 'argon2';
import crypto from 'node:crypto';
import { usersRepository } from '../../repositories/users.repository';
import { logger } from '../../lib/logger';
import { sanitizeUsername } from '../../lib/string.utils';
import { sqlite } from '../../db';

/**
 * Service to ensure the database is correctly initialized with essential data.
 */
export const initializeDbService = {
    /**
     * Verifies if the database has been initialized with an admin user.
     * If not, creates the default "admin" user with credentials.
     */
    initialize: async () => {
        try {
            // Self-healing schema migration: ensure newer columns exist before querying
            try {
                const userCols = sqlite.prepare("PRAGMA table_info(users)").all();
                if (userCols.length > 0 && !userCols.some((col: any) => col.name === 'is_ignored')) {
                    sqlite.prepare("ALTER TABLE users ADD COLUMN is_ignored INTEGER NOT NULL DEFAULT 0").run();
                    logger.info('InitializeDB: Applied auto-migration: Added is_ignored column to users table.');
                }

                const syncCols = sqlite.prepare("PRAGMA table_info(sync_logs)").all();
                if (syncCols.length > 0 && !syncCols.some((col: any) => col.name === 'process_type')) {
                    sqlite.prepare("ALTER TABLE sync_logs ADD COLUMN process_type TEXT DEFAULT 'sync'").run();
                    sqlite.prepare("UPDATE sync_logs SET process_type = 'billing' WHERE summary LIKE '%Facturación%' OR summary LIKE '%Cobro%' OR summary LIKE '%Procesados%'").run();
                    logger.info('InitializeDB: Applied auto-migration: Added process_type column to sync_logs table.');
                }

                const distCols = sqlite.prepare("PRAGMA table_info(consumption_distributions)").all();
                if (distCols.length > 0 && !distCols.some((col: any) => col.name === 'concept')) {
                    sqlite.prepare("ALTER TABLE consumption_distributions ADD COLUMN concept TEXT").run();
                    logger.info('InitializeDB: Applied auto-migration: Added concept column to consumption_distributions table.');
                }

                // Data patch: normalize sales created on 2026-10-29 that fell back to month '2026-09'
                try {
                    const res = sqlite.prepare("UPDATE nexudus_sales SET month = '2026-10' WHERE sale_date LIKE '2026-10-29%' AND month = '2026-09'").run();
                    if (res.changes > 0) {
                        logger.info(`InitializeDB: Normalized ${res.changes} sales from 2026-10-29 to month 2026-10.`);
                    }
                } catch {
                    // Ignore if nexudus_sales table does not exist yet
                }
            } catch (schemaErr: any) {
                logger.warn({ err: schemaErr.message }, 'InitializeDB: Schema check warning');
            }

            const admin = await usersRepository.findByUsername('admin');

            if (admin) {
                logger.info('InitializeDB: Database already initialized. Admin user detected.');
                return;
            }

            logger.info('InitializeDB: First initialization. Creating default admin user...');

            const hashedPassword = await argon2.hash('m4gm4');
            const adminUser = {
                id: crypto.randomUUID(),
                username: sanitizeUsername('admin'),
                password: hashedPassword,
                role: 'admin',
                printUser: 'admin',
                nexudusUser: 'admin'
            };

            await usersRepository.create(adminUser);
            logger.info('InitializeDB: Default admin user created successfully.');
        } catch (error) {
            logger.error(error, 'InitializeDB: Error during database initialization');
            throw error;
        }
    }
};
