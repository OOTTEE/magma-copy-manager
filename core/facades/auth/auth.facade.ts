import { FastifyInstance } from 'fastify';
import { authService } from '../../services/auth/auth.service';
import { usersRepository } from '../../repositories/users.repository';

/**
 * Facade for Authentication domain.
 * Orchestrates login process and handles initial security abstractions.
 */
export const authFacade = {
    /**
     * Authenticates a user and returns a token and role.
     * Throws an error if credentials are invalid to be caught by the route or global handler.
     */
    login: async (fastify: FastifyInstance, username: string, pass: string) => {
        const result = await authService.login(fastify, username, pass);
        
        if (!result) {
            const error = new Error('Invalid credentials');
            (error as any).statusCode = 401;
            (error as any).errorType = 'unauthorized';
            throw error;
        }

        return result;
    },

    /**
     * Refreshes an access token using a valid refresh token.
     */
    refreshAccessToken: async (fastify: FastifyInstance, refreshToken: string) => {
        return await authService.refreshAccessToken(fastify, refreshToken);
    },

    /**
     * Terminate session by revoking the refresh token.
     */
    logout: async (refreshToken: string) => {
        return await authService.logout(refreshToken);
    },

    /**
     * Impersonates a target user by issuing credentials for that user.
     * Only administrators can impersonate non-admin users.
     */
    impersonateUser: async (
        fastify: FastifyInstance,
        requestingUser: { id: string; role: string },
        targetUserId: string
    ) => {
        if (!requestingUser || requestingUser.role !== 'admin') {
            const error = new Error('Forbidden: Only administrators can impersonate users');
            (error as any).statusCode = 403;
            (error as any).errorType = 'forbidden';
            throw error;
        }

        const targetUser = await usersRepository.findById(targetUserId);
        if (!targetUser) {
            const error = new Error('User not found');
            (error as any).statusCode = 404;
            (error as any).errorType = 'not_found';
            throw error;
        }

        if (targetUser.role === 'admin') {
            const error = new Error('Cannot impersonate an administrator');
            (error as any).statusCode = 400;
            (error as any).errorType = 'bad_request';
            throw error;
        }

        return await authService.impersonateUser(fastify, {
            id: targetUser.id,
            username: targetUser.username,
            role: targetUser.role
        });
    }
};
