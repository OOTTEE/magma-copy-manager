import { FastifyInstance } from 'fastify';
import { authService } from '../../services/auth/auth.service';

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
    }
};
