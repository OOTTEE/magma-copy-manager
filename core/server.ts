import { buildApp } from './app';
import { loggerConfig } from './middleware/logger';
import { serverConfig } from './config/server.config';

import { initializeDbService } from './services/initialize-db/initialize-db.service';
import { autoBillingService } from './services/automation/auto-billing.service';
import { autoSyncService } from './services/automation/auto-sync.service';

const server = buildApp({
    logger: loggerConfig
});

const start = async () => {
    try {
        await initializeDbService.initialize();
        await autoBillingService.init();
        await autoSyncService.init();
        await server.listen({ port: serverConfig.port, host: '0.0.0.0' });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
