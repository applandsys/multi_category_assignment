import cors from 'cors';
import express from 'express';
import { connectMongo } from './config/db.js';
import categoryRoutes from './route/categoryRoute.js';

export const createApp = async () => {
    await connectMongo();

    const app = express();
    app.use(cors());
    app.use(express.json());

    app.get('/test', (_req, res) => {
        res.json({
            success: true,
            message: 'Server is running',
        });
    });

    app.use('/api/categories', categoryRoutes);

    return app;
};
