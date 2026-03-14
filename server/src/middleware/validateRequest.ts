import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';
import { ApiError } from '../utils/ApiError';

export const validate =
  (schemas: { body?: ZodType; params?: ZodType; query?: ZodType }) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) return next(ApiError.badRequest(result.error.issues[0].message));
      req.body = result.data;
    }
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) return next(ApiError.badRequest(result.error.issues[0].message));
      req.params = result.data as Record<string, string>;
    }
    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) return next(ApiError.badRequest(result.error.issues[0].message));
      req.query = result.data as Record<string, string>;
    }
    next();
  };
