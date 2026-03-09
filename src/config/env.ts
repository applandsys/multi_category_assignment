import dotenv from 'dotenv';
import {asNumber} from "../utils/typeConvert";
dotenv.config();

export const env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: asNumber(process.env.PORT, 4000),
    mongodbUri:
        process.env.MONGODB_URI ?? 'mongodb://localhost:27017/category_assignment',
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
    cacheTtlSeconds: asNumber(process.env.CACHE_TTL_SECONDS, 300),
    maxCategoryDepth: asNumber(process.env.MAX_CATEGORY_DEPTH, 4),
};

