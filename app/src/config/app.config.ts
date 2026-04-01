/**
 * Application Configuration Class
 * Centralizes the access to environment variables in the frontend.
 */
export class AppConfig {
    /**
     * Base URL for the Magma API service.
     * Loaded from VITE_SERVICE_URL environment variable.
     */
    static get serviceUrl(): string {
        const url = import.meta.env.VITE_SERVICE_URL;
        if (!url) {
            console.warn('[AppConfig] VITE_SERVICE_URL is not defined in the environment. Falling back to localhost:3000');
            return 'http://localhost:3000';
        }
        return url;
    }

    /**
     * Current application mode (development, production, test)
     */
    static get mode(): string {
        return import.meta.env.MODE;
    }

    /**
     * Helper to check if the app is running in development mode
     */
    static get isDev(): boolean {
        return import.meta.env.DEV;
    }
}
