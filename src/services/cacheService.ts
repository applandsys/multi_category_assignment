import { env } from '../config/env.js';
import { getRedisClient } from '../config/redis.js';

const CACHE_NAMESPACE = 'categories';
const CACHE_VERSION_KEY = `${CACHE_NAMESPACE}:version`;

const getCacheVersion = async (): Promise<number> => {
    const client = await getRedisClient();
    if (!client) {
        return 1;
    }

    const current = await client.get(CACHE_VERSION_KEY);
    if (!current) {
        await client.set(CACHE_VERSION_KEY, '1');
        return 1;
    }

    return Number(current) || 1;
};

export const invalidateCategoryCache = async (): Promise<void> => {
    const client = await getRedisClient();
    if (!client) {
        return;
    }

    await client.incr(CACHE_VERSION_KEY);
};

export const getOrSetCache = async <T>(
    keyParts: Array<string | number | boolean>,
    supplier: () => Promise<T>,
    ttlSeconds = env.cacheTtlSeconds,
): Promise<T> => {
    const client = await getRedisClient();
    if (!client) {
        return supplier();
    }

    const version = await getCacheVersion();
    const key = `${CACHE_NAMESPACE}:v${version}:${keyParts.join(':')}`;

    const cached = await client.get(key);
    if (cached) {
        return JSON.parse(cached) as T;
    }

    const value = await supplier();
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
    return value;
};
