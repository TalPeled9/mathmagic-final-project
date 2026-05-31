import mongoose from 'mongoose';
import { config } from './index';
import { logger } from '../lib/logger';

export async function connectDB(): Promise<void> {
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB error'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  await mongoose.connect(config.mongoUri, { maxPoolSize: 10 });
  logger.info(`MongoDB connected: ${mongoose.connection.host}`);
}
