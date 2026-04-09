import { billingService } from '../../services/billing/billing.service';
import { reportsService } from '../../services/reports/reports.service';

/**
 * Facade for Billing domain.
 * Coordinates invoice simulation and financial data visualization.
 */
export const billingFacade = {
  simulateInvoice: async (requestingUser: { id: string; role: string }, userId: string) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Unauthorized access to billing simulation.');
      (error as any).statusCode = 403;
      throw error;
    }

    return await billingService.simulateInvoice(userId);
  },

  /**
   * Retrieves current month's copy distributions for a user.
   */
  getDistributions: async (requestingUser: { id: string; role: string }, userId?: string) => {
    // Determine target user
    const targetUserId = (requestingUser.role === 'admin' && userId) ? userId : requestingUser.id;
    
    const { fromStr } = await reportsService.getPeriodDates();
    const monthStr = fromStr.slice(0, 7);
    
    return await billingService.getDistributions(targetUserId, monthStr);
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

  syncUserConsumption: async (requestingUser: { id: string; role: string }, userId: string, customNote?: string, nexudusAccountId?: string) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Only admins can trigger synchronization.');
      (error as any).statusCode = 403;
      throw error;
    }

    const status = await billingFacade.getSyncStatus(userId);
    if (status.synced) {
      const error = new Error('Consumption already synchronized for this user in the current month.');
      (error as any).statusCode = 400;
      throw error;
    }

    return await billingService.syncUserConsumption(userId, customNote, nexudusAccountId);
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
  syncWithNexudus: async (requestingUser: { id: string; role: string }) => {
    if (requestingUser.role !== 'admin') {
      const error = new Error('Only admins can trigger Nexudus synchronization.');
      (error as any).statusCode = 403;
      throw error;
    }

    return await billingService.syncMonthlyConsumption();
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
