import { buildApp } from './app';
import { logger } from './lib/logger';
import { serverConfig } from './config/server.config';

import { initializeDbService } from './services/initialize-db/initialize-db.service';
import { autoBillingService } from './services/automation/auto-billing.service';
import { autoSyncService } from './services/automation/auto-sync.service';

const server = buildApp({
    loggerInstance: logger,
    disableRequestLogging: serverConfig.disableRequestLogging,
});

const start = async () => {
    try {
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`Database: ${serverConfig.databaseUrl}`);
        await initializeDbService.initialize();
        await autoBillingService.init();
        await autoSyncService.init();
        const address = await server.listen({ port: serverConfig.port, host: '0.0.0.0' });
        logger.info(`🚀 Magma Server listening on ${address}`);
    } catch (err) {
        logger.error(err, 'Failed to start server');
        process.exit(1);
    }
};

start();
