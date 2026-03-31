import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initializeDbService } from './initialize-db.service';
import { usersRepository } from '../../repositories/users.repository';
import * as argon2 from 'argon2';

vi.mock('../../repositories/users.repository', () => ({
    usersRepository: {
        findByUsername: vi.fn(),
        create: vi.fn(),
    }
}));

vi.mock('argon2', () => ({
    hash: vi.fn(),
}));

describe('InitializeDbService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not create an admin user if it already exists', async () => {
        vi.mocked(usersRepository.findByUsername).mockResolvedValue({ username: 'admin' } as any);
        
        await initializeDbService.initialize();

        expect(usersRepository.findByUsername).toHaveBeenCalledWith('admin');
        expect(usersRepository.create).not.toHaveBeenCalled();
    });

    it('should create an admin user if it does not exist', async () => {
        vi.mocked(usersRepository.findByUsername).mockResolvedValue(null);
        vi.mocked(argon2.hash).mockResolvedValue('hashed_pass');

        await initializeDbService.initialize();

        expect(usersRepository.findByUsername).toHaveBeenCalledWith('admin');
        expect(argon2.hash).toHaveBeenCalledWith('m4gm4');
        expect(usersRepository.create).toHaveBeenCalledWith(expect.objectContaining({
            username: 'admin',
            password: 'hashed_pass',
            role: 'admin'
        }));
    });
});
