import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app';
import { config } from './config/index';
import { connectDB } from './config/database';
import { logger } from './lib/logger';

connectDB()
  .then(() => {
    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });

    function shutdown(signal: string) {
      logger.info(`[${signal}] Shutting down gracefully...`);
      server.close(async () => {
        await mongoose.connection.close();
        process.exit(0);
      });
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })
  .catch((err) => {
    logger.error({ err }, 'Failed to connect to MongoDB');
    process.exit(1);
  });
