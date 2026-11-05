import { describe, it, expect, beforeAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { getTestEnv } from '../../../../testEnv';
import { usersRepository } from '../../../../repositories/users.repository';
import { recoveryRepository } from '../../../../repositories/recovery.repository';

describe('Auth Active Defense and Recovery Flow', () => {
    let app: FastifyInstance;
    let testUsername = 'security_test_user';
    let testPassword = 'initialPassword123';
    let testUserId: string;

    beforeAll(async () => {
        const env = await getTestEnv();
        app = env.app;

        // Create dedicated test user
        let existing = await usersRepository.findByUsername(testUsername);
        if (existing) {
            await usersRepository.delete(existing.id);
        }

        const created = await usersRepository.create({
            id: 'sec-user-' + Date.now(),
            username: testUsername,
            password: await (await import('argon2')).hash(testPassword),
            role: 'customer',
            printUser: 'sec-print',
            email: 'security-test@example.com',
            failedLoginAttempts: 0,
            isLocked: 0,
            a3NoPaperMode: 0,
            isIgnored: 0
        });
        testUserId = created.id;
    });

    it('should increment failed attempts and lock account on 5th failure', async () => {
        // 4 failed attempts
        for (let i = 1; i <= 4; i++) {
            const res = await app.inject({
                method: 'POST',
                url: '/api/v1/login',
                payload: { username: testUsername, password: 'wrongPassword' }
            });
            expect(res.statusCode).toBe(401);
            const body = JSON.parse(res.payload);
            expect(body.error_type).toBe('unauthorized');
        }

        const userAfter4 = await usersRepository.findById(testUserId);
        expect(userAfter4?.failedLoginAttempts).toBe(4);
        expect(userAfter4?.isLocked).toBe(0);

        // 5th failed attempt -> locks account
        const res5 = await app.inject({
            method: 'POST',
            url: '/api/v1/login',
            payload: { username: testUsername, password: 'wrongPassword' }
        });
        expect(res5.statusCode).toBe(401);
        const body5 = JSON.parse(res5.payload);
        expect(body5.error_type).toBe('account_locked');

        const userAfter5 = await usersRepository.findById(testUserId);
        expect(userAfter5?.failedLoginAttempts).toBe(5);
        expect(userAfter5?.isLocked).toBe(1);

        // Attempt login with CORRECT password while locked -> must still be rejected
        const resCorrectWhileLocked = await app.inject({
            method: 'POST',
            url: '/api/v1/login',
            payload: { username: testUsername, password: testPassword }
        });
        expect(resCorrectWhileLocked.statusCode).toBe(401);
        const bodyLocked = JSON.parse(resCorrectWhileLocked.payload);
        expect(bodyLocked.error_type).toBe('account_locked');
    });

    it('should return neutral message for recovery request whether user exists or not (anti-enumeration)', async () => {
        const resNonExistent = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/recovery',
            payload: { username: 'non_existent_random_user_9999' }
        });
        expect(resNonExistent.statusCode).toBe(200);
        const bodyNonExistent = JSON.parse(resNonExistent.payload);
        expect(bodyNonExistent.message).toContain('Si la cuenta existe');

        const resExisting = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/recovery',
            payload: { username: testUsername }
        });
        expect(resExisting.statusCode).toBe(200);
        const bodyExisting = JSON.parse(resExisting.payload);
        expect(bodyExisting.message).toBe(bodyNonExistent.message);
    });

    it('should verify recovery token, unlock account, and issue session', async () => {
        // Manually create a known recovery token for test user
        const testToken = 'valid_test_token_' + Date.now();
        await recoveryRepository.create({
            id: 'rec-' + Date.now(),
            userId: testUserId,
            token: testToken,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            used: 0,
            createdAt: new Date().toISOString()
        });

        // Test invalid token
        const resInvalid = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/recovery/verify',
            payload: { token: 'invalid_non_existent_token' }
        });
        expect(resInvalid.statusCode).toBe(400);

        // Test valid token
        const resValid = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/recovery/verify',
            payload: { token: testToken }
        });
        expect(resValid.statusCode).toBe(200);
        const bodyValid = JSON.parse(resValid.payload);
        expect(bodyValid).toHaveProperty('accessToken');
        expect(bodyValid).toHaveProperty('refreshToken');
        expect(bodyValid.mustResetPassword).toBe(true);
        expect(bodyValid.username).toBe(testUsername);

        // Account must now be unlocked in database
        const userUnlocked = await usersRepository.findById(testUserId);
        expect(userUnlocked?.isLocked).toBe(0);
        expect(userUnlocked?.failedLoginAttempts).toBe(0);

        // Reusing the same token must fail (single-use)
        const resReused = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/recovery/verify',
            payload: { token: testToken }
        });
        expect(resReused.statusCode).toBe(400);

        // Reset password with the newly obtained accessToken
        const resResetTooShort = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/reset-password',
            headers: { authorization: `Bearer ${bodyValid.accessToken}` },
            payload: { newPassword: 'short' }
        });
        expect(resResetTooShort.statusCode).toBe(400);

        const newPassword = 'brandNewSecurePassword2026!';
        const resResetValid = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/reset-password',
            headers: { authorization: `Bearer ${bodyValid.accessToken}` },
            payload: { newPassword }
        });
        expect(resResetValid.statusCode).toBe(200);

        // Verify login works with the new password
        const resNewLogin = await app.inject({
            method: 'POST',
            url: '/api/v1/login',
            payload: { username: testUsername, password: newPassword }
        });
        expect(resNewLogin.statusCode).toBe(200);
        const newLoginBody = JSON.parse(resNewLogin.payload);
        expect(newLoginBody).toHaveProperty('accessToken');
    });
});
