import { buildApp } from './app';
import dotenv from 'dotenv';
dotenv.config();

const server = buildApp({
    logger: true
});

const start = async () => {
    try {
        await server.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
        console.log(`Server listening on ${server.server.address()}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
