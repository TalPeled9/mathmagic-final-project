import mongoose from 'mongoose';
import { config } from './index';

export async function connectDB(): Promise<void> {
  mongoose.connection.on('error', (err) => console.error('MongoDB error:', err));
  mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));

  await mongoose.connect(config.mongoUri, { maxPoolSize: 10 });
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}
