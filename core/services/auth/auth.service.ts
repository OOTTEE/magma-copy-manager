import { FastifyInstance } from 'fastify';
import { usersRepository } from '../../repositories/users.repository';
import * as argon2 from 'argon2';

export const authService = {
    login: async (fastify: FastifyInstance, username: string, pass: string) => {
        const user = await usersRepository.findByUsername(username);
        if (!user) {
            return null;
        }

        const isValid = await argon2.verify(user.password, pass);
        if (!isValid) {
            return null;
        }

        const payload = { id: user.id, role: user.role };
        const token = fastify.jwt.sign(payload, { expiresIn: '8h' });
        return { token, role: user.role };
    }
};
