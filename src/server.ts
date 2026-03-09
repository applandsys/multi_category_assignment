import cors from 'cors';
import express from 'express';

export const createApp = async () => {

    const app = express();
    app.use(cors());
    app.use(express.json());

    app.get('/test', (_req, res) => {
        res.json({
            success: true,
            message: 'Server is running',
        });
    });

    return app;
};
