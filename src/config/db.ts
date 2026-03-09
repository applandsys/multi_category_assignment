import mongoose from 'mongoose';
import { env } from './env.js';

export const connectMongo = async (): Promise<void> => {
    await mongoose.connect(env.mongodbUri);
    console.log('MongoDB Database connected');
};
