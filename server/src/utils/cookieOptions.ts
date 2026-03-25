import { CookieOptions } from 'express';
import { config } from '../config';

const baseOptions: CookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'strict',
  path: '/',
};
export const accessCookieOptions: CookieOptions = { ...baseOptions, maxAge: 15 * 60 * 1000 }; // 15 min
export const refreshCookieOptions: CookieOptions = {
  ...baseOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000,
}; // 7 days

// Cookie names as constants
export const ACCESS_TOKEN_COOKIE = 'mathmagic_access';
export const REFRESH_TOKEN_COOKIE = 'mathmagic_refresh';
export const CSRF_COOKIE = 'mathmagic_csrf';
export const CSRF_HEADER = 'x-csrf-token';

export const csrfCookieOptions: CookieOptions = {
  httpOnly: false, // Must be JS-readable for double-submit pattern
  secure: config.isProduction,
  sameSite: 'strict',
  path: '/',
};
