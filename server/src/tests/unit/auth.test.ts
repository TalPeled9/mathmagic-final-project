import jwt, { SignOptions } from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/authService', () => ({
  verifyGoogleToken: vi.fn(),
  findOrCreateUser: vi.fn(),
  registerLocalUser: vi.fn(),
  loginLocalUser: vi.fn(),
}));

vi.mock('../../model/User', () => ({
  default: {
    findById: vi.fn(),
  },
}));

import app from '../../app';
import * as authService from '../../services/authService';
import User from '../../model/User';
import { ACCESS_TOKEN_COOKIE, CSRF_COOKIE, REFRESH_TOKEN_COOKIE } from '../../utils/cookieOptions';
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from '../../utils/jwt';

type MockUser = {
  _id: string;
  email: string;
  name: string;
  username?: string;
  createdAt?: Date;
};

function extractCookieValue(
  setCookieHeader: string | string[] | undefined,
  cookieName: string
): string {
  const setCookie = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : setCookieHeader
      ? [setCookieHeader]
      : [];

  const cookie = setCookie.find((value) => value.startsWith(`${cookieName}=`));

  if (!cookie) {
    throw new Error(`Cookie ${cookieName} was not set`);
  }

  return cookie.split(';')[0];
}

describe('auth routes', () => {
  const mockedVerifyGoogleToken = vi.mocked(authService.verifyGoogleToken);
  const mockedFindOrCreateUser = vi.mocked(authService.findOrCreateUser);
  const mockedRegisterLocalUser = vi.mocked(authService.registerLocalUser);
  const mockedLoginLocalUser = vi.mocked(authService.loginLocalUser);
  const mockedFindById = vi.mocked(User.findById);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/auth/google sets auth cookies and returns the user profile', async () => {
    const user: MockUser = {
      _id: '507f1f77bcf86cd799439011',
      email: 'parent@example.com',
      name: 'Parent One',
    };

    mockedVerifyGoogleToken.mockResolvedValue({
      googleId: 'google-123',
      email: user.email,
      name: user.name,
    });
    mockedFindOrCreateUser.mockResolvedValue(user as never);

    const response = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'google-id-token' })
      .expect(200);

    expect(mockedVerifyGoogleToken).toHaveBeenCalledWith('google-id-token');
    expect(mockedFindOrCreateUser).toHaveBeenCalledWith({
      googleId: 'google-123',
      email: user.email,
      name: user.name,
    });
    expect(response.body).toMatchObject({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });

    const setCookie = response.headers['set-cookie'];
    expect(setCookie).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`${ACCESS_TOKEN_COOKIE}=`),
        expect.stringContaining(`${REFRESH_TOKEN_COOKIE}=`),
        expect.stringContaining(`${CSRF_COOKIE}=`),
      ])
    );
    expect(response.body.csrfToken).toBeTypeOf('string');
    expect(response.body.csrfToken.length).toBeGreaterThan(0);
  });

  it('POST /api/auth/google rejects an empty credential', async () => {
    const response = await request(app)
      .post('/api/auth/google')
      .send({ credential: '' })
      .expect(400);

    expect(response.body.error.message).toContain('Google credential is required');
    expect(mockedVerifyGoogleToken).not.toHaveBeenCalled();
  });

  it('POST /api/auth/register creates a local account and returns auth cookies', async () => {
    const user: MockUser = {
      _id: '507f1f77bcf86cd799439012',
      username: 'parent_one',
      email: 'local@example.com',
      name: 'parent_one',
    };

    mockedRegisterLocalUser.mockResolvedValue(user as never);

    const response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'parent_one', email: 'local@example.com', password: 'password123' })
      .expect(200);

    expect(mockedRegisterLocalUser).toHaveBeenCalledWith({
      username: 'parent_one',
      email: 'local@example.com',
      password: 'password123',
    });
    expect(response.body).toMatchObject({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
      },
    });
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`${ACCESS_TOKEN_COOKIE}=`),
        expect.stringContaining(`${REFRESH_TOKEN_COOKIE}=`),
        expect.stringContaining(`${CSRF_COOKIE}=`),
      ])
    );
  });

  it('POST /api/auth/register rejects invalid username', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'a', email: 'bad@example.com', password: 'password123' })
      .expect(400);

    expect(response.body.error.message).toContain('Username must be at least 3 characters');
    expect(mockedRegisterLocalUser).not.toHaveBeenCalled();
  });

  it('POST /api/auth/login authenticates with email and password', async () => {
    const user: MockUser = {
      _id: '507f1f77bcf86cd799439013',
      username: 'local_parent',
      email: 'login@example.com',
      name: 'local_parent',
    };

    mockedLoginLocalUser.mockResolvedValue(user as never);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password123' })
      .expect(200);

    expect(mockedLoginLocalUser).toHaveBeenCalledWith({
      email: 'login@example.com',
      password: 'password123',
    });
    expect(response.body.user).toMatchObject({
      id: user._id,
      email: user.email,
      username: user.username,
    });
  });

  it('POST /api/auth/refresh requires a CSRF token', async () => {
    const refreshCookie = `${REFRESH_TOKEN_COOKIE}=${generateRefreshToken('user-1')}`;
    const csrfCookie = `${CSRF_COOKIE}=csrf-token`;

    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [refreshCookie, csrfCookie])
      .expect(403);

    expect(response.body.error.message).toBe('Invalid CSRF token');
  });

  it('POST /api/auth/refresh issues a new access token and csrf token', async () => {
    const refreshCookie = `${REFRESH_TOKEN_COOKIE}=${generateRefreshToken('user-1')}`;
    const csrfCookie = `${CSRF_COOKIE}=csrf-token`;

    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [refreshCookie, csrfCookie])
      .set('x-csrf-token', 'csrf-token')
      .expect(200);

    const setCookie = response.headers['set-cookie'];
    const accessCookie = extractCookieValue(setCookie, ACCESS_TOKEN_COOKIE);

    expect(verifyAccessToken(accessCookie.split('=')[1]).userId).toBe('user-1');
    expect(setCookie).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`${ACCESS_TOKEN_COOKIE}=`),
        expect.stringContaining(`${CSRF_COOKIE}=`),
      ])
    );
    expect(response.body.ok).toBe(true);
    expect(response.body.csrfToken).toBeTypeOf('string');
  });

  it('POST /api/auth/logout clears all auth cookies when csrf matches', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [`${CSRF_COOKIE}=csrf-token`])
      .set('x-csrf-token', 'csrf-token')
      .expect(200);

    const setCookie = response.headers['set-cookie'];
    expect(setCookie).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`${ACCESS_TOKEN_COOKIE}=;`),
        expect.stringContaining(`${REFRESH_TOKEN_COOKIE}=;`),
        expect.stringContaining(`${CSRF_COOKIE}=;`),
      ])
    );
    expect(response.body.ok).toBe(true);
  });

  it('POST /api/auth/logout revokes the refresh token on the server', async () => {
    const refreshToken = generateRefreshToken('user-logout');

    await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [`${REFRESH_TOKEN_COOKIE}=${refreshToken}`, `${CSRF_COOKIE}=csrf-token`])
      .set('x-csrf-token', 'csrf-token')
      .expect(200);

    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`${REFRESH_TOKEN_COOKIE}=${refreshToken}`, `${CSRF_COOKIE}=csrf-token`])
      .set('x-csrf-token', 'csrf-token')
      .expect(401);

    expect(response.body.error.message).toBe('Session revoked');
  });

  it('POST /api/auth/logout rejects request when CSRF token is missing', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [`${CSRF_COOKIE}=csrf-token`])
      .expect(403);

    expect(response.body.error.message).toBe('Invalid CSRF token');
  });

  it('GET /api/parent/profile rejects requests without an access token', async () => {
    const response = await request(app).get('/api/parent/profile').expect(401);

    expect(response.body.error.message).toBe('Unauthorized');
  });

  it('GET /api/parent/profile returns the authenticated user', async () => {
    const createdAt = new Date('2026-03-25T00:00:00.000Z');
    const accessToken = generateAccessToken('507f1f77bcf86cd799439011');

    mockedFindById.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        email: 'parent@example.com',
        name: 'Parent One',
        createdAt,
      }),
    } as never);

    const response = await request(app)
      .get('/api/parent/profile')
      .set('Cookie', [`${ACCESS_TOKEN_COOKIE}=${accessToken}`])
      .expect(200);

    expect(mockedFindById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(response.body).toEqual({
      id: '507f1f77bcf86cd799439011',
      email: 'parent@example.com',
      name: 'Parent One',
      createdAt: createdAt.toISOString(),
    });
  });

  it('GET /api/parent/profile refreshes an expired access token with a valid refresh token', async () => {
    const expiredAccessToken = jwt.sign(
      { userId: '507f1f77bcf86cd799439011' },
      process.env.JWT_SECRET!,
      { expiresIn: -1 as SignOptions['expiresIn'] }
    );
    const refreshToken = generateRefreshToken('507f1f77bcf86cd799439011');
    const createdAt = new Date('2026-03-25T00:00:00.000Z');

    mockedFindById.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        email: 'parent@example.com',
        name: 'Parent One',
        createdAt,
      }),
    } as never);

    const response = await request(app)
      .get('/api/parent/profile')
      .set('Cookie', [
        `${ACCESS_TOKEN_COOKIE}=${expiredAccessToken}`,
        `${REFRESH_TOKEN_COOKIE}=${refreshToken}`,
      ])
      .expect(200);

    const setCookie = response.headers['set-cookie'];
    const newAccessCookie = extractCookieValue(setCookie, ACCESS_TOKEN_COOKIE);
    const rotatedCsrfCookie = extractCookieValue(setCookie, CSRF_COOKIE);

    expect(verifyAccessToken(newAccessCookie.split('=')[1]).userId).toBe(
      '507f1f77bcf86cd799439011'
    );
    expect(rotatedCsrfCookie).toContain(`${CSRF_COOKIE}=`);
    expect(response.body.email).toBe('parent@example.com');
  });

  it('GET /api/parent/profile returns 404 when the authenticated user no longer exists', async () => {
    const accessToken = generateAccessToken('missing-user');

    mockedFindById.mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    } as never);

    const response = await request(app)
      .get('/api/parent/profile')
      .set('Cookie', [`${ACCESS_TOKEN_COOKIE}=${accessToken}`])
      .expect(404);

    expect(response.body.error.message).toBe('User not found');
  });
});
