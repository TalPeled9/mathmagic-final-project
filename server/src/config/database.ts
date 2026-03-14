import mongoose from 'mongoose';
import { config } from './index';

export async function connectDB(): Promise<void> {
  await mongoose.connect(config.mongoUri, { maxPoolSize: 10 });
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}
