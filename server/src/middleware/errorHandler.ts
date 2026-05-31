import { ErrorRequestHandler } from 'express';
import { ApiError } from '../utils/ApiError';
import { config } from '../config';
import { logger } from '../lib/logger';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;
  const clientMessage = isApiError ? err.message : 'Internal server error';

  if (!isApiError) logger.error({ err }, 'Unhandled error');

  res.status(statusCode).json({
    error: {
      message: clientMessage,
      ...(config.isProduction ? {} : { stack: err.stack }),
    },
  });
};
