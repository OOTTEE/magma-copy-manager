import { usersRepository } from '../repositories/users.repository';
import * as argon2 from 'argon2';
import crypto from 'crypto';

export const usersService = {
  getAll: async () => await usersRepository.findAll(),
  getById: async (id: string) => await usersRepository.findById(id),
  create: async (data: any) => {
    const hashedPassword = await argon2.hash(data.password);
    const newUser = {
      id: crypto.randomUUID(),
      ...data,
      password: hashedPassword
    };
    return await usersRepository.create(newUser);
  },
  update: async (id: string, data: any) => {
    if (data.password) {
      data.password = await argon2.hash(data.password);
    }
    return await usersRepository.update(id, data);
  },
  delete: async (id: string) => {
    await usersRepository.delete(id);
  }
};
