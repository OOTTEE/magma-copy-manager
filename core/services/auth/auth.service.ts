import { FastifyInstance } from 'fastify';
import { usersRepository } from '../../repositories/users.repository';
import { sanitizeUsername } from '../../lib/string.utils';
import { authRepository } from '../../repositories/auth.repository';
import { recoveryRepository } from '../../repositories/recovery.repository';
import { emailService } from '../notifications/email.service';
import { settingsService } from '../settings/settings.service';
import { nexudusService } from '../nexudus/nexudus.service';
import { usersService } from '../users/users.service';
import { logger } from '../../lib/logger';
import * as argon2 from 'argon2';
import crypto, { randomUUID } from 'crypto';

export const authService = {
    /**
     * Authenticates user and generates initial token pair.
     * Enforces active brute-force defense and account locking.
     */
    login: async (fastify: FastifyInstance, username: string, pass: string) => {
        const sanitizedUsername = sanitizeUsername(username);
        const user = await usersRepository.findByUsername(sanitizedUsername);
        
        if (!user) {
            // Anti-enumeration: verify against a dummy hash to prevent timing attacks
            await argon2.verify('$argon2id$v=19$m=65536,t=3,p=4$dummyhashdummyhash$dummyhashdummyhashdummyhashdummyhash', pass).catch(() => false);
            return null;
        }

        if (user.isLocked === 1) {
            const error = new Error('Cuenta bloqueada por seguridad tras múltiples intentos fallidos. Utiliza la recuperación por correo.');
            (error as any).statusCode = 401;
            (error as any).errorType = 'account_locked';
            throw error;
        }

        const isValid = await argon2.verify(user.password, pass);
        if (!isValid) {
            const { isLocked, failedAttempts } = await usersRepository.incrementFailedAttempts(user.id, user.failedLoginAttempts || 0);
            
            if (isLocked) {
                logger.warn({ userId: user.id, username: user.username, failedAttempts }, 'AuthService: User account locked due to excessive failed attempts');
                const error = new Error('Cuenta bloqueada por seguridad tras múltiples intentos fallidos. Utiliza la recuperación por correo.');
                (error as any).statusCode = 401;
                (error as any).errorType = 'account_locked';
                throw error;
            }

            return null;
        }

        // On successful login, reset failed attempts
        if ((user.failedLoginAttempts || 0) > 0) {
            await usersRepository.resetFailedAttempts(user.id);
        }

        return await authService.generateTokenPair(fastify, user.id, user.username, user.role);
    },

    /**
     * Requests a single-use recovery link sent by email (anti-enumeration).
     */
    requestRecovery: async (username: string, origin?: string) => {
        const sanitizedUsername = sanitizeUsername(username);
        const user = await usersRepository.findByUsername(sanitizedUsername);

        if (user) {
            let email: string | null = user.email || null;

            if (!email && user.role === 'admin') {
                email = await settingsService.getSetting('email_recipient');
            } else if (!email && user.role === 'customer') {
                try {
                    const accounts = await usersService.getNexudusAccounts(user.id);
                    for (const acc of accounts) {
                        if (acc.nexudusUserId && !isNaN(Number(acc.nexudusUserId))) {
                            const cw = await nexudusService.getCoworkerById(Number(acc.nexudusUserId));
                            if ((cw as any)?.Email) {
                                email = (cw as any).Email;
                                await usersRepository.update(user.id, { email });
                                break;
                            }
                        }
                    }
                } catch (e: any) {
                    logger.warn({ err: e.message }, 'AuthService: Error resolving coworker email from Nexudus');
                }
            }

            if (email) {
                const token = crypto.randomBytes(32).toString('hex');
                const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

                await recoveryRepository.create({
                    id: randomUUID(),
                    userId: user.id,
                    token,
                    expiresAt,
                    used: 0,
                    createdAt: new Date().toISOString()
                });

                const baseUrl = origin || 'http://localhost:5173';
                const recoveryUrl = `${baseUrl}/login?recoveryToken=${token}`;

                await emailService.sendRecoveryEmail({
                    to: email,
                    username: user.username,
                    recoveryUrl,
                    expiresMinutes: 15
                }).catch((err) => {
                    logger.error(err, 'AuthService: Failed to dispatch recovery email');
                });
            } else {
                logger.warn({ userId: user.id, username: user.username }, 'AuthService: Recovery requested for user without email address');
            }
        }

        // Always return success for anti-enumeration
        return {
            message: 'Si la cuenta existe y tiene un correo asociado, se ha enviado un enlace de acceso.'
        };
    },

    /**
     * Verifies recovery token, unlocks account, resets attempts, and generates token pair.
     */
    verifyRecoveryToken: async (fastify: FastifyInstance, token: string) => {
        const storedToken = await recoveryRepository.findValidToken(token);
        if (!storedToken) {
            const error = new Error('El enlace de acceso es inválido o ha caducado.');
            (error as any).statusCode = 400;
            (error as any).errorType = 'invalid_token';
            throw error;
        }

        // Mark token as used
        await recoveryRepository.markAsUsed(token);

        // Fetch user
        const user = await usersRepository.findById(storedToken.userId);
        if (!user) {
            const error = new Error('Usuario no encontrado.');
            (error as any).statusCode = 404;
            throw error;
        }

        // Unlock account and reset counter
        await usersRepository.unlockUser(user.id);

        // Generate token pair
        const tokens = await authService.generateTokenPair(fastify, user.id, user.username, user.role);

        return {
            ...tokens,
            userId: user.id,
            mustResetPassword: true
        };
    },

    /**
     * Updates user password and clears lockout states.
     */
    resetPassword: async (userId: string, newPass: string) => {
        if (!newPass || newPass.length < 8) {
            const error = new Error('La contraseña debe tener al menos 8 caracteres.');
            (error as any).statusCode = 400;
            (error as any).errorType = 'validation_error';
            throw error;
        }

        const hashedPassword = await argon2.hash(newPass);
        await usersRepository.update(userId, {
            password: hashedPassword,
            failedLoginAttempts: 0,
            isLocked: 0
        });

        return { message: 'Contraseña actualizada exitosamente.' };
    },

    /**
     * Interchanges a valid Refresh Token for a new pair (Access + Refresh).
     * Implements "Rotation": Old Refresh Token is revoked, a new one is issued.
     */
    refreshAccessToken: async (fastify: FastifyInstance, refreshToken: string) => {
        const storedToken = await authRepository.findValidToken(refreshToken);
        if (!storedToken) {
            const error = new Error('Invalid or expired refresh token');
            (error as any).statusCode = 401;
            throw error;
        }

        // Check expiration
        if (new Date(storedToken.expiresAt) < new Date()) {
            await authRepository.revokeToken(refreshToken);
            const error = new Error('Refresh token expired');
            (error as any).statusCode = 401;
            throw error;
        }

        // Revoke the old token (Rotation)
        await authRepository.revokeToken(refreshToken);

        // Get user to maintain role
        const user = await usersRepository.findById(storedToken.userId);
        if (!user) throw new Error('User no longer exists');

        // Generate new pair
        return await authService.generateTokenPair(fastify, user.id, user.username, user.role);
    },

    /**
     * Revokes a refresh token to terminate a session.
     */
    logout: async (refreshToken: string) => {
        return await authRepository.revokeToken(refreshToken);
    },

    /**
     * Issues a token pair for a target user under shadow/impersonation mode.
     */
    impersonateUser: async (fastify: FastifyInstance, targetUser: { id: string; username: string; role: string }) => {
        const tokens = await authService.generateTokenPair(fastify, targetUser.id, targetUser.username, targetUser.role);
        return {
            ...tokens,
            userId: targetUser.id
        };
    },

    /**
     * Helper to generate and persist tokens.
     */
    generateTokenPair: async (fastify: FastifyInstance, userId: string, username: string, role: string) => {
        // 1. Access Token (Short-lived: 20m)
        const payload = { id: userId, username, role };
        const accessToken = fastify.jwt.sign(payload, { expiresIn: '20m' });

        // 2. Refresh Token (Long-lived: 7d)
        const refreshTokenValue = randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await authRepository.createRefreshToken({
            id: randomUUID(),
            userId,
            token: refreshTokenValue,
            expiresAt: expiresAt.toISOString(),
            createdOn: new Date().toISOString()
        });

        return { accessToken, refreshToken: refreshTokenValue, role, username };
    }
};
