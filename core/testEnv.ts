import { FastifyInstance } from 'fastify';
import { buildApp } from './app';
import { usersService } from './services/users/users.service';
import { authService } from './services/auth/auth.service';

let appInstance: FastifyInstance | null = null;
let adminToken: string | null = null;
let customerToken: string | null = null;
let initPromise: Promise<void> | null = null;

export const getTestEnv = async () => {
    if (appInstance) return { app: appInstance, adminToken, customerToken };

    if (!initPromise) {
        initPromise = (async () => {
            appInstance = buildApp();
            await appInstance.ready();

            // create default users
            const users = await usersService.getAll();
            const hasAdmin = users.find(u => u.username === 'admin');
            const hasCustomer = users.find(u => u.username === 'customer');

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

            adminToken = await authService.login(appInstance, 'admin', 'adminPassword');
            customerToken = await authService.login(appInstance, 'customer', 'customerPassword');
        })();
    }

    await initPromise;
    return { app: appInstance!, adminToken, customerToken };
};

export const teardownTestEnv = async () => {
    // We will let vitest close it or keep it open for multiple files if isolate=false
    // but typically we can just hook into vitest afterAll if we wanted to.
};
