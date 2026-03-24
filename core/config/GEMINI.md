# Server Configuration

Here is the list of configuration that will be used in the application:

## Environment Variables
- LOG_LEVEL: INFO, DEBUG, ERROR, WARN, TRACE
- DATABASE_URL: sqlite.db

## Implementation

- Use dotenv to load the configuration from the .env file.
- Centralize the server configuration in a single `server.config.ts`
- `serverConfig` will a static resourece where all configuration will accesible.
- Use the configuration to configure the server and utils (database, logger, etc)
- Define default values for each configuration properties
- dotenv can NOT be used directly, only via `serverConfig`

