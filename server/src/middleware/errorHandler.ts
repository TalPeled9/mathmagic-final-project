import { ErrorRequestHandler } from 'express';
import { ApiError } from '../utils/ApiError';
import { config } from '../config';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  res.status(statusCode).json({
    error: {
      message: err.message,
      ...(config.isProduction ? {} : { stack: err.stack }),
    },
  });
};
