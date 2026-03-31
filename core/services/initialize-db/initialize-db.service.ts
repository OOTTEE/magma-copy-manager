import * as argon2 from 'argon2';
import crypto from 'node:crypto';
import { usersRepository } from '../../repositories/users.repository';

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
            const admin = await usersRepository.findByUsername('admin');
            
            if (admin) {
                console.log('[InitializeDB] Database already initialized. Admin user detected.');
                return;
            }

            console.log('[InitializeDB] First initialization: Creating default admin user...');
            
            const hashedPassword = await argon2.hash('m4gm4');
            const adminUser = {
                id: crypto.randomUUID(),
                username: 'admin',
                password: hashedPassword,
                role: 'admin',
                printUser: 'admin',
                nexudusUser: 'admin'
            };

            await usersRepository.create(adminUser);
            console.log('[InitializeDB] Default admin user created successfully (username: admin / pass: m4gm4).');
        } catch (error) {
            console.error('[InitializeDB] Error during database initialization:', error);
            throw error;
        }
    }
};
