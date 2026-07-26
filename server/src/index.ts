import 'dotenv/config';
import mongoose from 'mongoose';
import cron from 'node-cron';
import app from './app';
import { config } from './config/index';
import { connectDB } from './config/database';
import { logger } from './lib/logger';
import { runWeeklyReportJob } from './jobs/weeklyReportJob';

connectDB()
  .then(() => {
    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });

    let reportTask: ReturnType<typeof cron.schedule> | undefined;
    if (config.weeklyReport.enabled) {
      reportTask = cron.schedule(
        config.weeklyReport.cronSchedule,
        () => {
          void runWeeklyReportJob();
        },
        { timezone: config.weeklyReport.timezone }
      );
      logger.info(
        { schedule: config.weeklyReport.cronSchedule, timezone: config.weeklyReport.timezone },
        'Weekly report cron scheduled'
      );
    }

    function shutdown(signal: string) {
      logger.info(`[${signal}] Shutting down gracefully...`);
      reportTask?.stop();
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
