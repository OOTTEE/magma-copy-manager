import { db } from '../../db';
import { invoices, invoiceItems, copies, users } from '../../db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { billingService } from '../../services/billing/billing.service';
import { reportsService } from '../../services/reports/reports.service';
import { invoicesRepository } from '../../repositories/invoices.repository';
import { randomUUID } from 'crypto';

/**
 * Facade for Billing domain.
 * Coordinates invoice simulation and financial data visualization.
 */
export const billingFacade = {
  // ... (simulateInvoice, getInvoiceStatus, persistInvoice, deleteInvoice, getInvoice stay the same except for getInvoice details if needed)
  
  simulateInvoice: async (requestingUser: { id: string; role: string }, userId: string) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Unauthorized access to billing simulation.');
      (error as any).statusCode = 403;
      throw error;
    }

    return await billingService.simulateInvoice(userId);
  },

  getInvoiceStatus: async (userId: string) => {
    const { fromStr, toStr } = await reportsService.getPeriodDates();
    
    const existing = await db
      .select()
      .from(invoices)
      .where(and(
        eq(invoices.userId, userId),
        eq(invoices.from, fromStr),
        eq(invoices.to, toStr)
      ))
      .get();

    return existing || null;
  },

  persistInvoice: async (requestingUser: { id: string; role: string }, userId: string) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Only admins can persist invoices.');
      (error as any).statusCode = 403;
      throw error;
    }

    const simulation = await billingService.simulateInvoice(userId);
    const { fromStr, toStr } = await reportsService.getPeriodDates();

    const status = await billingFacade.getInvoiceStatus(userId);
    if (status) {
      const error = new Error('Invoice already exists for the current period.');
      (error as any).statusCode = 400;
      throw error;
    }

    return db.transaction((tx) => {
      const invoiceId = randomUUID();
      
      tx.insert(invoices).values({
        id: invoiceId,
        userId,
        from: fromStr,
        to: toStr,
        total: Math.round(simulation.total * 100) 
      }).run();

      for (const line of simulation.lines) {
        tx.insert(invoiceItems).values({
          id: randomUUID(),
          invoiceId,
          concept: line.concept,
          quantity: line.quantity,
          unitPrice: Math.round(line.unitPrice * 100),
          total: Math.round(line.total * 100)
        }).run();
      }

      tx.update(copies)
        .set({ invoiceId })
        .where(and(
          eq(copies.userId, userId),
          sql`${copies.datetime} >= ${fromStr}`,
          sql`${copies.datetime} <= ${toStr}`,
          sql`${copies.invoiceId} IS NULL`
        )).run();

      return { invoiceId };
    });
  },

  deleteInvoice: async (requestingUser: { id: string; role: string }, id: string) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Only admins can delete invoices.');
      (error as any).statusCode = 403;
      throw error;
    }

    return db.transaction((tx) => {
      tx.update(copies)
        .set({ invoiceId: null })
        .where(eq(copies.invoiceId, id))
        .run();

      tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id)).run();
      tx.delete(invoices).where(eq(invoices.id, id)).run();
      
      return true;
    });
  },

  getInvoice: async (requestingUser: { id: string; role: string }, id: string) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Access denied to invoice details.');
      (error as any).statusCode = 403;
      throw error;
    }

    const header = await db
      .select({
        id: invoices.id,
        userId: invoices.userId,
        username: users.username,
        from: invoices.from,
        to: invoices.to,
        total: invoices.total
      })
      .from(invoices)
      .innerJoin(users, eq(invoices.userId, users.id))
      .where(eq(invoices.id, id))
      .get();

    if (!header) {
      const error = new Error('Invoice not found.');
      (error as any).statusCode = 404;
      throw error;
    }

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id))
      .all();

    return {
      ...header,
      total: header.total / 100, 
      lines: items.map(item => ({
        concept: item.concept,
        quantity: item.quantity,
        unitPrice: item.unitPrice / 100,
        total: item.total / 100
      }))
    };
  },

  /**
   * Returns a paginated and filtered list of all persisted invoices.
   */
  listInvoices: async (
    requestingUser: { id: string; role: string }, 
    params: { page: number; limit: number; userIds?: string[]; months?: string[] }
  ) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Access denied to invoice listing.');
      (error as any).statusCode = 403;
      throw error;
    }

    const { page, limit, userIds, months } = params;
    const offset = (page - 1) * limit;

    const [list, totalRecords] = await Promise.all([
      invoicesRepository.findAllPaginated({ limit, offset, userIds, months }),
      invoicesRepository.countAll({ userIds, months })
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    return {
      data: list.map(item => ({
        ...item,
        total: item.total / 100 // Convert cents to decimals
      })),
      pagination: {
        total_records: totalRecords,
        current_page: page,
        total_pages: totalPages,
        limit: limit
      }
    };
  }
};
