import { createServer } from 'node:http';
import { createApp } from './server.js';
import { env } from './config/env.js';
import { closeRedis } from './config/redis.js';

const bootstrap = async (): Promise<void> => {
    const app = await createApp();
    const server = createServer(app);

    server.listen(env.port, () => {
        console.log(`Server running on http://localhost:${env.port}`);
    });

    const shutdown = async () => {
        console.log('Shutting down ...');
        await closeRedis();
        server.close(() => process.exit(0));
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
};

bootstrap().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
