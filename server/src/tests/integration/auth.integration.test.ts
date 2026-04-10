import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../../app';
import { googleOAuthClient } from '../../config/auth';
import User from '../../model/User';
import { ACCESS_TOKEN_COOKIE, CSRF_COOKIE, REFRESH_TOKEN_COOKIE } from '../../utils/cookieOptions';
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from '../../utils/jwt';

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

describe('auth routes integration', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), { dbName: 'mathmagic-auth-tests' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    vi.restoreAllMocks();
    await User.deleteMany({});
  });

  it('POST /api/auth/google creates a user in Mongo on first login', async () => {
    vi.spyOn(googleOAuthClient, 'verifyIdToken').mockResolvedValue({
      getPayload: () => ({
        sub: 'google-parent-1',
        email: 'parent@example.com',
        name: 'Parent One',
      }),
    } as never);

    const response = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'valid-google-id-token' })
      .expect(200);

    const user = await User.findOne({ googleId: 'google-parent-1' }).lean();

    expect(user).not.toBeNull();
    expect(user?.email).toBe('parent@example.com');
    expect(user?.name).toBe('Parent One');
    expect(response.body.user.email).toBe('parent@example.com');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`${ACCESS_TOKEN_COOKIE}=`),
        expect.stringContaining(`${REFRESH_TOKEN_COOKIE}=`),
        expect.stringContaining(`${CSRF_COOKIE}=`),
      ])
    );
  });

  it('POST /api/auth/google reuses the existing Mongo user on repeat login', async () => {
    await User.create({
      googleId: 'google-parent-1',
      email: 'parent@example.com',
      name: 'Original Parent',
    });

    vi.spyOn(googleOAuthClient, 'verifyIdToken').mockResolvedValue({
      getPayload: () => ({
        sub: 'google-parent-1',
        email: 'parent@example.com',
        name: 'Updated Name From Google',
      }),
    } as never);

    const response = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'valid-google-id-token' })
      .expect(200);

    const userCount = await User.countDocuments({ googleId: 'google-parent-1' });
    const persistedUser = await User.findOne({ googleId: 'google-parent-1' }).lean();

    expect(userCount).toBe(1);
    expect(response.body.user.name).toBe('Original Parent');
    expect(persistedUser?.name).toBe('Original Parent');
  });

  it('POST /api/auth/register creates a local user with a hashed password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'local_parent', email: 'local@example.com', password: 'password123' })
      .expect(200);

    const user = await User.findOne({ email: 'local@example.com' }).lean();

    expect(user).not.toBeNull();
    expect(user?.username).toBe('local_parent');
    expect(user?.name).toBe('local_parent');
    expect(user?.passwordHash).toBeDefined();
    expect(user?.passwordHash).not.toBe('password123');
    expect(await bcrypt.compare('password123', user!.passwordHash!)).toBe(true);
    expect(response.body.user).toMatchObject({
      email: 'local@example.com',
      username: 'local_parent',
    });
  });

  it('POST /api/auth/login authenticates a local user with email and password', async () => {
    const passwordHash = await bcrypt.hash('password123', 12);
    const user = await User.create({
      username: 'login_parent',
      email: 'login@example.com',
      passwordHash,
      name: 'login_parent',
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password123' })
      .expect(200);

    const accessCookie = extractCookieValue(response.headers['set-cookie'], ACCESS_TOKEN_COOKIE);

    expect(verifyAccessToken(accessCookie.split('=')[1]).userId).toBe(String(user._id));
    expect(response.body.user).toMatchObject({
      email: 'login@example.com',
      username: 'login_parent',
    });
  });

  it('POST /api/auth/login rejects an invalid password', async () => {
    const passwordHash = await bcrypt.hash('password123', 12);
    await User.create({
      username: 'wrong_password_parent',
      email: 'wrongpass@example.com',
      passwordHash,
      name: 'wrong_password_parent',
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrongpass@example.com', password: 'bad-password' })
      .expect(401);

    expect(response.body.error.message).toBe('Invalid email or password');
  });

  it('GET /api/parent/profile reads the authenticated user from Mongo', async () => {
    const user = await User.create({
      googleId: 'google-parent-1',
      email: 'parent@example.com',
      name: 'Parent One',
    });
    const accessToken = generateAccessToken(String(user._id));

    const response = await request(app)
      .get('/api/parent/profile')
      .set('Cookie', [`${ACCESS_TOKEN_COOKIE}=${accessToken}`])
      .expect(200);

    expect(response.body).toMatchObject({
      id: String(user._id),
      email: 'parent@example.com',
      name: 'Parent One',
    });
  });

  it('GET /api/parent/profile refreshes an expired access token using a real Mongo user', async () => {
    const user = await User.create({
      googleId: 'google-parent-2',
      email: 'refresh@example.com',
      name: 'Refresh Parent',
    });

    const expiredAccessToken = jwt.sign({ userId: String(user._id) }, process.env.JWT_SECRET!, {
      expiresIn: -1 as SignOptions['expiresIn'],
    });
    const refreshToken = generateRefreshToken(String(user._id));

    const response = await request(app)
      .get('/api/parent/profile')
      .set('Cookie', [
        `${ACCESS_TOKEN_COOKIE}=${expiredAccessToken}`,
        `${REFRESH_TOKEN_COOKIE}=${refreshToken}`,
      ])
      .expect(200);

    const newAccessCookie = extractCookieValue(response.headers['set-cookie'], ACCESS_TOKEN_COOKIE);

    expect(verifyAccessToken(newAccessCookie.split('=')[1]).userId).toBe(String(user._id));
    expect(response.body.email).toBe('refresh@example.com');
  });

  it('POST /api/auth/refresh issues a new access token from a valid refresh cookie', async () => {
    const user = await User.create({
      googleId: 'google-parent-3',
      email: 'cookie@example.com',
      name: 'Cookie Parent',
    });
    const refreshToken = generateRefreshToken(String(user._id));

    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`${REFRESH_TOKEN_COOKIE}=${refreshToken}`, `${CSRF_COOKIE}=csrf-token`])
      .set('x-csrf-token', 'csrf-token')
      .expect(200);

    const newAccessCookie = extractCookieValue(response.headers['set-cookie'], ACCESS_TOKEN_COOKIE);

    expect(verifyAccessToken(newAccessCookie.split('=')[1]).userId).toBe(String(user._id));
    expect(response.body.ok).toBe(true);
  });

  it('POST /api/auth/logout revokes refresh tokens server-side', async () => {
    const user = await User.create({
      googleId: 'google-parent-logout',
      email: 'logout@example.com',
      name: 'Logout Parent',
    });
    const refreshToken = generateRefreshToken(String(user._id));

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

  it('POST /api/auth/logout rejects request when CSRF token is invalid', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [`${CSRF_COOKIE}=cookie-csrf`])
      .set('x-csrf-token', 'header-csrf-mismatch')
      .expect(403);

    expect(response.body.error.message).toBe('Invalid CSRF token');
  });
});
