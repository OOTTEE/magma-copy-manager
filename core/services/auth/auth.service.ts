import { FastifyInstance } from 'fastify';
import { usersRepository } from '../../repositories/users.repository';
import { sanitizeUsername } from '../../lib/string.utils';
import { authRepository } from '../../repositories/auth.repository';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';

export const authService = {
    /**
     * Authenticates user and generates initial token pair.
     */
    login: async (fastify: FastifyInstance, username: string, pass: string) => {
        const sanitizedUsername = sanitizeUsername(username);
        const user = await usersRepository.findByUsername(sanitizedUsername);
        if (!user) return null;

        const isValid = await argon2.verify(user.password, pass);
        if (!isValid) return null;

        return await authService.generateTokenPair(fastify, user.id, user.username, user.role);
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
