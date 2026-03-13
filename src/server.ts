import cors from 'cors';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { connectMongo } from './config/db.js';
import { env } from './config/env.js';
import { getRedisClient } from './config/redis.js';
import { resolvers } from './graphql/resolvers.js';
import { typeDefs } from './graphql/typeDefs.js';
import { errorHandler } from './middleware/error-handler.js';
import categoryRoutes from './route/categoryRoute';

export const createApp = async () => {
    await connectMongo();
    await getRedisClient();

    const app = express();
    app.use(cors());
    app.use(express.json());

    app.get('/test', (_req, res) => {
        res.json({
            success: true,
            message: 'Server is Tested Success Walton Assignment',
            maxCategoryDepth: env.maxCategoryDepth,
        });
    });

    app.use('/api/categories', categoryRoutes);

    const apolloServer = new ApolloServer({
        typeDefs,
        resolvers,
    });

    await apolloServer.start();

    app.use(
        '/graphql',
        expressMiddleware(apolloServer, {
            context: async () => ({}),
        }),
    );

    app.use(errorHandler);
    return app;
};
