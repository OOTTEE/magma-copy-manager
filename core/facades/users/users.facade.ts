import { usersService } from '../../services/users/users.service';

/**
 * Internal mapper for consistent User API responses.
 */
const _mapUser = (user: any) => ({
    id: user.id,
    username: user.username,
    printUser: user.printUser,
    nexudusUser: user.nexudusUser,
    role: user.role,
    a3NoPaperMode: user.a3NoPaperMode,
    _links: { 
        self: `/api/v1/users/${user.id}`, 
        copies: `/api/v1/users/${user.id}/copies` 
    }
});

/**
 * Facade for Users domain.
 * Orchestrates user management and handles administrative access rules.
 */
export const usersFacade = {
    /**
     * Retrieves all users with metadata mapping.
     */
    getAllUsers: async (requestingUser: { id: string; role: string }) => {
        if (requestingUser.role !== 'admin') {
            const error = new Error('Unauthorized access to user list.');
            (error as any).statusCode = 403;
            throw error;
        }

        const users = await usersService.getAll();
        return users.map((u: any) => _mapUser(u));
    },

    /**
     * Retrieves a single user by ID.
     */
    getUserById: async (requestingUser: { id: string; role: string }, targetId: string) => {
        if (requestingUser.role !== 'admin' && requestingUser.id !== targetId) {
            const error = new Error('Unauthorized access to user profile.');
            (error as any).statusCode = 403;
            throw error;
        }

        const user = await usersService.getById(targetId);
        if (!user) {
            const error = new Error('User not found');
            (error as any).statusCode = 404;
            throw error;
        }

        return _mapUser(user);
    },

    /**
     * Creates a new user.
     */
    createUser: async (requestingUser: { id: string; role: string }, data: any) => {
        if (requestingUser.role !== 'admin') {
            const error = new Error('Only admins can create users.');
            (error as any).statusCode = 403;
            throw error;
        }

        const user = await usersService.create(data);
        return _mapUser(user);
    },

    /**
     * Updates an existing user.
     */
    updateUser: async (requestingUser: { id: string; role: string }, targetId: string, data: any) => {
        if (requestingUser.role !== 'admin' && requestingUser.id !== targetId) {
            const error = new Error('Unauthorized update of user profile.');
            (error as any).statusCode = 403;
            throw error;
        }

        const user = await usersService.update(targetId, data);
        if (!user) {
            const error = new Error('User not found');
            (error as any).statusCode = 404;
            throw error;
        }

        return _mapUser(user);
    },

    /**
     * Deletes a user.
     */
    deleteUser: async (requestingUser: { id: string; role: string }, targetId: string) => {
        if (requestingUser.role !== 'admin') {
            const error = new Error('Only admins can delete users.');
            (error as any).statusCode = 403;
            throw error;
        }

        await usersService.delete(targetId);
    },

    /**
     * Gets all Nexudus accounts for a user.
     */
    getNexudusAccounts: async (requestingUser: { id: string; role: string }, userId: string) => {
        if (requestingUser.role !== 'admin' && requestingUser.id !== userId) {
            const error = new Error('Unauthorized access to Nexudus accounts.');
            (error as any).statusCode = 403;
            throw error;
        }

        return await usersService.getNexudusAccounts(userId);
    },

    /**
     * Adds a new Nexudus account to a user.
     */
    addNexudusAccount: async (requestingUser: { id: string; role: string }, userId: string, nexudusUserId: string) => {
        if (requestingUser.role !== 'admin') {
            const error = new Error('Only admins can link Nexudus accounts.');
            (error as any).statusCode = 403;
            throw error;
        }

        return await usersService.addNexudusAccount(userId, nexudusUserId);
    },

    /**
     * Deletes a Nexudus account.
     */
    deleteNexudusAccount: async (requestingUser: { id: string; role: string }, accountId: string) => {
        if (requestingUser.role !== 'admin') {
            const error = new Error('Only admins can delete linked accounts.');
            (error as any).statusCode = 403;
            throw error;
        }

        await usersService.deleteNexudusAccount(accountId);
    },

    /**
     * Sets a Nexudus account as default.
     */
    setDefaultNexudusAccount: async (requestingUser: { id: string; role: string }, userId: string, accountId: string) => {
        if (requestingUser.role !== 'admin') {
            const error = new Error('Only admins can change the default account.');
            (error as any).statusCode = 403;
            throw error;
        }

        await usersService.setDefaultNexudusAccount(userId, accountId);
    }
};
