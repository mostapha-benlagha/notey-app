import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export async function connectToDatabase() {
  if (!env.MONGODB_URI) {
    logger.warn('MONGODB_URI is not set. Starting API without a database connection.');
    return;
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI);
  logger.info('MongoDB connected');
}
