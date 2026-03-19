import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app';
import { config } from './config/index';
import { connectDB } from './config/database';

connectDB()
  .then(() => {
    const server = app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });

    function shutdown(signal: string) {
      console.log(`[${signal}] Shutting down gracefully...`);
      server.close(async () => {
        await mongoose.connection.close();
        process.exit(0);
      });
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
