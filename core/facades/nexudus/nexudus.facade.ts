import { nexudusService } from '../../services/nexudus/nexudus.service';
import { usersService } from '../../services/users/users.service';
import { logger } from '../../lib/logger';

/**
 * Facade for Nexudus domain.
 * Orchestrates external API calls and ensures authorization.
 */
export const nexudusFacade = {
  /**
   * Tests the connection with Nexudus using provided credentials.
   * Business Rule: Only admins can perform connection tests.
   */
  testConnection: async (
    requestingUser: { id: string; role: string },
    credentials: { email?: string; password?: string }
  ) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Unauthorized: Only administrators can test Nexudus connection.');
      (error as any).statusCode = 403;
      throw error;
    }

    logger.info({ email: credentials.email }, 'Nexudus: Testing connection...');

    try {
      // If the frontend sends the mask '********', it means the password wasn't changed.
      // In that case, we pass undefined to nexudusService.login so it fallbacks to the stored/decrypted one.
      const finalPassword = credentials.password === '********' ? undefined : credentials.password;
      const finalEmail = credentials.email === '' ? undefined : credentials.email;

      const token = await nexudusService.login(finalEmail, finalPassword);
      
      if (token) {
        return {
          wasSuccessful: true,
          message: 'Conexión establecida correctamente con Nexudus.'
        };
      }
      
      return {
        wasSuccessful: false,
        message: 'No se pudo obtener el token de acceso.'
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Nexudus: Connection test failed');
      return {
        wasSuccessful: false,
        message: error.message || 'Error desconocido al conectar con Nexudus.'
      };
    }
  },

  /**
   * Returns a list of businesses (locations) using the current configuration.
   */
  getBusinesses: async (requestingUser: { id: string; role: string }) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Unauthorized');
      (error as any).statusCode = 403;
      throw error;
    }

    const records = await nexudusService.getBusinesses();
    return records.map((r: any) => ({
      id: r.Id,
      name: r.Name || r.FullName
    }));
  },

  /**
   * Returns a list of available currencies.
   */
  getCurrencies: async (requestingUser: { id: string; role: string }) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Unauthorized');
      (error as any).statusCode = 403;
      throw error;
    }

    const records = await nexudusService.getCurrencies();
    return records.map((r: any) => ({
      id: r.Id,
      name: r.Name || r.FullName,
      code: r.Code
    }));
  },

  /**
   * Returns a list of available products.
   */
  getProducts: async (requestingUser: { id: string; role: string }) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Unauthorized');
      (error as any).statusCode = 403;
      throw error;
    }

    const records = await nexudusService.getProducts();
    return records.map((r: any) => ({
      id: r.Id,
      name: r.Name || r.FullName
    }));
  },

  /**
   * Returns a list of coworkers matching the search term.
   */
  getCoworkers: async (requestingUser: { id: string; role: string }, search: string) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Unauthorized');
      (error as any).statusCode = 403;
      throw error;
    }

    const records = await nexudusService.searchCoworkers(search);
    return records.map((r: any) => ({
      id: r.Id,
      fullName: r.FullName || r.ToStringText,
      email: r.Email
    }));
  },

  /**
   * Returns a single coworker by ID.
   */
  getCoworkerById: async (requestingUser: { id: string; role: string }, id: number) => {
    // 1. Authorization Check
    if (requestingUser.role !== 'admin') {
      const linkedAccounts = await usersService.getNexudusAccounts(requestingUser.id);
      const isOwner = linkedAccounts.some(acc => acc.nexudusUserId === id.toString());
      
      if (!isOwner) {
        logger.warn({ userId: requestingUser.id, targetId: id }, 'Unauthorized access attempt to Nexudus coworker data');
        const error = new Error('No tienes permiso para ver los detalles de esta cuenta de Nexudus.');
        (error as any).statusCode = 403;
        throw error;
      }
    }

    const r = await nexudusService.getCoworkerById(id);
    return {
      id: r.Id,
      fullName: r.FullName || r.ToStringText,
      email: r.Email
    };
  }
};
