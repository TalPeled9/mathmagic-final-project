import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import app from '../../app';
import User from '../../models/User';
import { generateAccessToken } from '../../utils/jwt';
import { ACCESS_TOKEN_COOKIE, CSRF_COOKIE } from '../../utils/cookieOptions';
import { BADGE_DEFINITIONS } from '../../config/badges';

const CSRF_VALUE = 'test-csrf-token';

function buildCookies(userId: string): string[] {
  const accessToken = generateAccessToken(userId);
  return [`${ACCESS_TOKEN_COOKIE}=${accessToken}`, `${CSRF_COOKIE}=${CSRF_VALUE}`];
}

describe('GET /api/badges', () => {
  let mongoServer: MongoMemoryServer;
  let parentId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), { dbName: 'mathmagic-badges-tests' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});

    const parent = await User.create({
      email: 'parent@example.com',
      name: 'Test Parent',
      passwordHash: 'hashed',
    });
    parentId = String(parent._id);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/badges');
    expect(res.status).toBe(401);
  });

  it('returns every badge definition with a real SVG icon path', async () => {
    const res = await request(app).get('/api/badges').set('Cookie', buildCookies(parentId));

    expect(res.status).toBe(200);
    expect(res.body.badges).toHaveLength(BADGE_DEFINITIONS.length);
    expect(res.body.badges).toHaveLength(9);

    for (const badge of res.body.badges) {
      expect(badge.iconUrl).toMatch(/^\/images\/badges\/.+\.svg$/);
      expect(badge.unlockCondition.length).toBeGreaterThan(0);
      expect(badge.badgeName.length).toBeGreaterThan(0);
    }
  });
});
