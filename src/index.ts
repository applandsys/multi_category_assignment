import { createServer } from 'node:http';
import { createApp } from './server.js';
import { env } from './config/env.js';

const bootstrappingAll = async (): Promise<void> => {
    const app = await createApp();
    const server = createServer(app);

    server.listen(env.port, () => {
        console.log(`Server running on PORT ${env.port}`);
    });

    const shutdown = async () => {
        console.log('Shutting down gracefully...');
        server.close(() => process.exit(0));
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
};

bootstrappingAll().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
