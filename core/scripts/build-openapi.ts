import { buildApp } from '../app';
import fs from 'node:fs';
import path from 'node:path';

async function generate() {
    console.log('[OpenAPI] Initializing app to generate specification...');
    
    // Build app without starting the logger to keep output clean
    const app = buildApp({
        logger: false
    });

    try {
        await app.ready();
        
        // Generate YAML from the registered routes and schemas
        const yaml = app.swagger({ yaml: true });
        
        // Save to project root (2 levels up from core/scripts)
        const outputPath = path.join(__dirname, '../../openapi.yaml');
        fs.writeFileSync(outputPath, yaml);
        
        console.log(`[OpenAPI] Success! Specification exported to: ${path.resolve(outputPath)}`);
    } catch (err) {
        console.error('[OpenAPI] Failed to generate specification:', err);
        process.exit(1);
    } finally {
        await app.close();
        process.exit(0);
    }
}

generate();
