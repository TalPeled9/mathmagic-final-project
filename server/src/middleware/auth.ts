import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { verifyAccessToken, generateAccessToken, verifyRefreshToken } from '../utils/jwt';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  CSRF_COOKIE,
  CSRF_HEADER,
  accessCookieOptions,
  csrfCookieOptions,
} from '../utils/cookieOptions';
import { ApiError } from '../utils/ApiError';
import { isTokenRevoked } from '../services/tokenDenylist';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { userId: string };
    }
  }
}

/** Constant-time string comparison to prevent timing attacks. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Double-submit CSRF verification middleware.
 * Reads the CSRF token from the non-httpOnly cookie and compares it to
 * the X-CSRF-Token request header. Apply to any state-changing route.
 */
export function verifyCsrf(req: Request, _res: Response, next: NextFunction): void {
  const csrfCookie = req.cookies[CSRF_COOKIE] as string | undefined;
  const csrfHeader = req.headers[CSRF_HEADER] as string | undefined;
  if (!csrfCookie || !csrfHeader || !safeEqual(csrfCookie, csrfHeader)) {
    return next(ApiError.forbidden('Invalid CSRF token'));
  }
  next();
}

/**
 * JWT authentication middleware with transparent access-token refresh.
 * - Verifies the access token from the httpOnly cookie.
 * - If the access token is expired, silently refreshes it using the refresh
 *   token cookie, sets a new access token cookie, and rotates the CSRF token.
 * - Attaches { userId } to req.user on success.
 * - Enforces CSRF double-submit check for non-safe HTTP methods.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // CSRF enforcement for state-changing requests
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (!safeMethods.includes(req.method)) {
    const csrfCookie = req.cookies[CSRF_COOKIE] as string | undefined;
    const csrfHeader = req.headers[CSRF_HEADER] as string | undefined;
    if (!csrfCookie || !csrfHeader || !safeEqual(csrfCookie, csrfHeader)) {
      return next(ApiError.forbidden('Invalid CSRF token'));
    }
  }

  const accessToken = req.cookies[ACCESS_TOKEN_COOKIE] as string | undefined;

  if (accessToken && isTokenRevoked(accessToken)) {
    return next(ApiError.unauthorized('Session revoked'));
  }

  // If the access token is present and valid, proceed immediately
  if (accessToken) {
    try {
      const payload = verifyAccessToken(accessToken);
      req.user = { userId: payload.userId };
      return next();
    } catch (err: unknown) {
      // Only fall through to refresh on expiry; any other JWT error is a hard reject
      if ((err as { name?: string })?.name !== 'TokenExpiredError') {
        return next(ApiError.unauthorized('Invalid access token'));
      }
    }
  }

  // Access token is missing (browser purged the expired cookie) or expired — try refresh token
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE] as string | undefined;
  if (!refreshToken) {
    return next(ApiError.unauthorized('Session expired'));
  }
  if (isTokenRevoked(refreshToken)) {
    return next(ApiError.unauthorized('Session revoked'));
  }

  try {
    const payload = verifyRefreshToken(refreshToken);

    const newAccessToken = generateAccessToken(payload.userId);
    res.cookie(ACCESS_TOKEN_COOKIE, newAccessToken, accessCookieOptions);

    // Rotate CSRF token alongside the new access token
    const newCsrf = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, newCsrf, csrfCookieOptions);

    req.user = { userId: payload.userId };
    return next();
  } catch {
    return next(ApiError.unauthorized('Session expired'));
  }
}
