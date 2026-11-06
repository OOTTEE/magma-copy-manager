import { billingService } from '../../services/billing/billing.service';
import { reportsService } from '../../services/reports/reports.service';
import { distributionsRepository } from '../../repositories/distributions.repository';

/**
 * Facade for Billing domain.
 * Coordinates invoice simulation and financial data visualization.
 */
export const billingFacade = {
  simulateInvoice: async (requestingUser: { id: string; role: string }, userId: string, options: { from?: string; to?: string; includeAllPending?: boolean; period?: string } = {}) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Unauthorized access to billing simulation.');
      (error as any).statusCode = 403;
      throw error;
    }

    return await billingService.simulateInvoice(userId, options);
  },

  /**
   * Retrieves current month's copy distributions for a user.
   */
  getDistributions: async (requestingUser: { id: string; role: string }, userId?: string, month?: string) => {
    // Determine target user
    const targetUserId = (requestingUser.role === 'admin' && userId) ? userId : requestingUser.id;

    if (requestingUser.role !== 'admin' && userId && userId !== requestingUser.id) {
      const error = new Error('Unauthorized access to distributions.');
      (error as any).statusCode = 403;
      throw error;
    }

    const { fromStr } = await reportsService.getPeriodDates();
    const monthStr = month || fromStr.slice(0, 7);

    return await billingService.getDistributions(targetUserId, monthStr);
  },

  /**
   * Creates a single distribution entry (Allocation Ledger).
   */
  createDistributionEntry: async (requestingUser: { id: string; role: string }, entry: {
    userId?: string;
    nexudusAccountId: string;
    month?: string;
    type: string;
    quantity: number;
    concept?: string;
  }) => {
    const targetUserId = (requestingUser.role === 'admin' && entry.userId) ? entry.userId : requestingUser.id;

    if (requestingUser.role !== 'admin' && entry.userId && entry.userId !== requestingUser.id) {
      const error = new Error('Unauthorized distribution attempt.');
      (error as any).statusCode = 403;
      throw error;
    }

    const { fromStr } = await reportsService.getPeriodDates();
    const monthStr = entry.month || fromStr.slice(0, 7);

    return await billingService.createDistributionEntry({
      userId: targetUserId,
      nexudusAccountId: entry.nexudusAccountId,
      month: monthStr,
      type: entry.type,
      quantity: entry.quantity,
      concept: entry.concept
    });
  },

  /**
   * Deletes a single distribution entry.
   */
  deleteDistributionEntry: async (requestingUser: { id: string; role: string }, id: string) => {
    const existing = await distributionsRepository.findById(id);
    if (!existing) {
      const error = new Error('Distribution entry not found.');
      (error as any).statusCode = 404;
      throw error;
    }

    if (requestingUser.role !== 'admin' && existing.userId !== requestingUser.id) {
      const error = new Error('Unauthorized to delete this distribution entry.');
      (error as any).statusCode = 403;
      throw error;
    }

    return await billingService.deleteDistributionEntry(id);
  },

  /**
   * Saves or updates consumption distributions for the current month.
   */
  saveDistributions: async (requestingUser: { id: string; role: string }, userId: string | undefined, distributions: any[]) => {
    // If not admin, the user can only save distributions for themselves
    const targetUserId = (requestingUser.role === 'admin' && userId) ? userId : requestingUser.id;

    // Safety check: Users can only distribution their OWN consumption
    if (requestingUser.role !== 'admin' && userId && userId !== requestingUser.id) {
       const error = new Error('Unauthorized distribution attempt.');
       (error as any).statusCode = 403;
       throw error;
    }

    const { fromStr } = await reportsService.getPeriodDates();
    const monthStr = fromStr.slice(0, 7);

    return await billingService.saveDistributions(targetUserId, monthStr, distributions);
  },

  getSyncStatus: async (userId: string) => {
    const { fromStr } = await reportsService.getPeriodDates();
    const monthStr = fromStr.slice(0, 7);
    return await billingService.getSyncStatus(userId, monthStr);
  },

  syncUserConsumption: async (requestingUser: { id: string; role: string }, userId: string, options: { from?: string; to?: string; includeAllPending?: boolean; note?: string; nexudusAccountId?: string; period?: string; partial?: boolean } = {}) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Only admins can trigger synchronization.');
      (error as any).statusCode = 403;
      throw error;
    }

    return await billingService.syncUserConsumption(userId, {
        from: options.from,
        to: options.to,
        includeAllPending: options.includeAllPending,
        customNote: options.note,
        nexudusAccountId: options.nexudusAccountId,
        period: options.period,
        partial: options.partial
    });
  },

  getSyncDetails: async (requestingUser: { id: string; role: string }, id: string) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Access denied to sync details.');
      (error as any).statusCode = 403;
      throw error;
    }

    const record = await billingService.getSaleWithDetails(id);

    if (!record) {
      const error = new Error('Sync record not found.');
      (error as any).statusCode = 404;
      throw error;
    }

    return record;
  },

  /**
   * Returns a paginated and filtered list of all synchronization events.
   */
  listSyncHistory: async (
    requestingUser: { id: string; role: string },
    params: { page: number; limit: number; userIds?: string[]; months?: string[] }
  ) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Access denied to sync history.');
      (error as any).statusCode = 403;
      throw error;
    }

    return await billingService.getPaginatedSales(params);
  },

  /**
   * Triggers the monthly consumption synchronization with Nexudus.
   */
  syncWithNexudus: async (requestingUser: { id: string; role: string }, options: { from?: string; to?: string; includeAllPending?: boolean; period?: string; partial?: boolean } = {}) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Only admins can trigger Nexudus synchronization.');
      (error as any).statusCode = 403;
      throw error;
    }

    return await billingService.syncMonthlyConsumption(options);
  },

  /**
   * Retrieves global sales statistics for the admin dashboard.
   */
  getSalesStats: async (requestingUser: { id: string; role: string }) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Access denied to billing statistics.');
      (error as any).statusCode = 403;
      throw error;
    }

    return await billingService.getSalesStats();
  },

  /**
   * Performs an automated rollback of a specific synchronization event.
   * Only administrators can perform this action.
   */
  rollbackSyncEvent: async (localId: string, requestingUser: { id: string; role: string }, force: boolean = false) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Access denied. Only administrators can perform rollbacks.');
      (error as any).statusCode = 403;
      throw error;
    }

    return await billingService.rollbackSyncEvent(localId, force);
  },

  /**
   * Performs a rollback of a synchronization group (multiple sales).
   */
  rollbackSyncGroup: async (localIds: string[], requestingUser: { id: string; role: string }, force: boolean = false) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Access denied. Only administrators can perform rollbacks.');
      (error as any).statusCode = 403;
      throw error;
    }

    return await billingService.rollbackSyncGroup(localIds, force);
  }
};
