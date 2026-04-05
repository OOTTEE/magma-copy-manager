import { nexudusService } from '../../services/nexudus/nexudus.service';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Nexudus Facade
 * 
 * Orchestrates operations between Magma's domain and the Nexudus API.
 * Ensures security and data mapping.
 */
export const nexudusFacade = {
  /**
   * Verifies if the Nexudus API is correctly configured and reachable.
   * Restricted to admin users.
   */
  testConnection: async (requestingUser: { role: string }) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Unauthorized: Only admins can test API connection.');
      (error as any).statusCode = 403;
      throw error;
    }

    return await nexudusService.authenticate();
  },

  /**
   * Creates a draft invoice in Nexudus for a specific user.
   * Maps Magma User to Nexudus Coworker.
   */
  createInvoice: async (requestingUser: { role: string }, magmaUserId: string, businessId: number, options: any = {}) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Unauthorized: Only admins can manage Nexudus invoices.');
      (error as any).statusCode = 403;
      throw error;
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, magmaUserId))
      .get();

    if (!user || !user.nexudusUser) {
      const error = new Error(`User ${magmaUserId} does not have a linked Nexudus account.`);
      (error as any).statusCode = 400;
      throw error;
    }

    const nexudusCoworkerId = parseInt(user.nexudusUser, 10);
    if (isNaN(nexudusCoworkerId)) {
      const error = new Error(`Invalid Nexudus User ID: ${user.nexudusUser}`);
      (error as any).statusCode = 400;
      throw error;
    }

    return await nexudusService.createInvoice(businessId, nexudusCoworkerId, options);
  },

  /**
   * Deletes an invoice from Nexudus.
   */
  deleteInvoice: async (requestingUser: { role: string }, nexudusInvoiceId: number) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Unauthorized: Only admins can manage Nexudus invoices.');
      (error as any).statusCode = 403;
      throw error;
    }

    return await nexudusService.deleteInvoice(nexudusInvoiceId);
  }
};
