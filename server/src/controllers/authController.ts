import { Request, Response } from 'express';
import crypto from 'crypto';
import { verifyGoogleToken, findOrCreateUser } from '../services/authService';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import {
  accessCookieOptions,
  refreshCookieOptions,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  CSRF_COOKIE,
  csrfCookieOptions,
} from '../utils/cookieOptions';
import { ApiError } from '../utils/ApiError';
import { isTokenRevoked, revokeToken } from '../services/tokenDenylist';

function issueCsrfCookie(res: Response): string {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE, token, csrfCookieOptions);
  return token;
}

export async function googleAuth(req: Request, res: Response): Promise<void> {
  const { credential } = req.body as { credential: string };

  const googleData = await verifyGoogleToken(credential);
  const user = await findOrCreateUser(googleData);

  const userId = String(user._id);
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);

  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, accessCookieOptions);
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookieOptions);
  const csrfToken = issueCsrfCookie(res);

  res.json({
    user: { id: userId, email: user.email, name: user.name },
    csrfToken,
  });
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const token = req.cookies[REFRESH_TOKEN_COOKIE] as string | undefined;
  if (!token) throw ApiError.unauthorized('No refresh token provided');
  if (isTokenRevoked(token)) throw ApiError.unauthorized('Session revoked');

  const payload = verifyRefreshToken(token);
  const newAccessToken = generateAccessToken(payload.userId);

  res.cookie(ACCESS_TOKEN_COOKIE, newAccessToken, accessCookieOptions);
  const csrfToken = issueCsrfCookie(res);

  res.json({ ok: true, csrfToken });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const accessToken = req.cookies[ACCESS_TOKEN_COOKIE] as string | undefined;
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE] as string | undefined;

  if (accessToken) revokeToken(accessToken);
  if (refreshToken) revokeToken(refreshToken);

  const clearOpts = { path: '/' };
  res.clearCookie(ACCESS_TOKEN_COOKIE, clearOpts);
  res.clearCookie(REFRESH_TOKEN_COOKIE, clearOpts);
  res.clearCookie(CSRF_COOKIE, clearOpts);
  res.json({ ok: true });
}
