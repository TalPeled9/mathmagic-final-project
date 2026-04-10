import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.env.PINO_PRETTY
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});
