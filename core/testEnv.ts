import { FastifyInstance } from 'fastify';
import { buildApp } from './app';
import { usersService } from './services/users/users.service';
import { authService } from './services/auth/auth.service';
import { db } from './db';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { join } from 'path';

let appInstance: FastifyInstance | null = null;
let adminToken: string | null = null;
let customerToken: string | null = null;
let initPromise: Promise<void> | null = null;

export const getTestEnv = async () => {
    if (appInstance) return { app: appInstance, adminToken, customerToken };

    if (!initPromise) {
        initPromise = (async () => {
            try {
                appInstance = buildApp();
                await appInstance.ready();

                // Run migrations
                console.log('TestEnv: Running migrations...');
                await migrate(db, { migrationsFolder: join(__dirname, 'drizzle') });
                console.log('TestEnv: Migrations complete.');

                // create default users
                const users = await usersService.getAll();
                const usersArray = Array.isArray(users) ? users : [];
                const hasAdmin = usersArray.find((u: any) => u.username === 'admin');
                const hasCustomer = usersArray.find((u: any) => u.username === 'customer');

                if (!hasAdmin) {
                    await usersService.create({
                        username: 'admin',
                        password: 'adminPassword',
                        role: 'admin',
                        printUser: 'print-admin',
                        nexudusUser: 'nex-admin'
                    });
                } else {
                    await usersService.update(hasAdmin.id, { password: 'adminPassword' });
                }
                
                if (!hasCustomer) {
                    await usersService.create({
                        username: 'customer',
                        password: 'customerPassword',
                        role: 'customer',
                        printUser: 'print-cust',
                        nexudusUser: 'nex-cust'
                    });
                } else {
                    await usersService.update(hasCustomer.id, { password: 'customerPassword' });
                }

                const adminResult = await authService.login(appInstance, 'admin', 'adminPassword');
                const customerResult = await authService.login(appInstance, 'customer', 'customerPassword');
                adminToken = adminResult?.accessToken || null;
                customerToken = customerResult?.accessToken || null;
                console.log('TestEnv: Initialization successful.');
            } catch (error) {
                console.error('TestEnv: Initialization failed!', error);
                initPromise = null; // Allow retry
                throw error;
            }
        })();
    }

    await initPromise;
    return { app: appInstance!, adminToken, customerToken };
};

export const teardownTestEnv = async () => {
    // We will let vitest close it or keep it open for multiple files if isolate=false
    // but typically we can just hook into vitest afterAll if we wanted to.
};
