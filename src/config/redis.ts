import { createClient, type RedisClientType } from 'redis';
import { env } from './env.js';

let redisClient: RedisClientType | null = null;

export const getRedisClient = async (): Promise<RedisClientType | null> => {
    if (redisClient?.isOpen) {
        return redisClient;
    }

    try {
        redisClient = createClient({ url: env.redisUrl });
        redisClient.on('error', (error) => {
            console.error('Redis error:', error.message);
        });

        await redisClient.connect();
        console.log('Redis connected');
        return redisClient;
    } catch (error) {
        console.warn('Redis no found no cache.');
        redisClient = null;
        return null;
    }
};

export const closeRedis = async (): Promise<void> => {
    if (redisClient?.isOpen) {
        await redisClient.quit();
    }
};
