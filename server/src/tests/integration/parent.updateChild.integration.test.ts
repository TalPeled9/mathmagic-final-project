import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import app from '../../app';
import User from '../../models/User';
import { Child } from '../../models/Child';
import { generateAccessToken } from '../../utils/jwt';
import { ACCESS_TOKEN_COOKIE, CSRF_COOKIE } from '../../utils/cookieOptions';

const CSRF_VALUE = 'test-csrf-token';
const LAUREN_VOICE = 'O4NKp88bb2JkAnrCbwQt';

function buildCookies(userId: string): string[] {
  const accessToken = generateAccessToken(userId);
  return [`${ACCESS_TOKEN_COOKIE}=${accessToken}`, `${CSRF_COOKIE}=${CSRF_VALUE}`];
}

describe('PUT /api/parent/children/:childId', () => {
  let mongoServer: MongoMemoryServer;
  let parentId: string;
  let childId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), { dbName: 'mathmagic-parent-update-tests' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Child.deleteMany({});

    const parent = await User.create({
      email: 'parent@example.com',
      name: 'Test Parent',
      passwordHash: 'hashed',
    });
    parentId = String(parent._id);

    const child = await Child.create({
      parentId: parent._id,
      name: 'Kiddo',
      gradeLevel: 2,
      avatars: [{ imageData: '', description: '', createdAt: new Date() }],
      activeAvatarIndex: 0,
      generationTimestamps: [],
    });
    childId = String(child._id);
  });

  it('persists name, gradeLevel, and narratorVoice like the settings Save button sends them', async () => {
    const res = await request(app)
      .put(`/api/parent/children/${childId}`)
      .set('Cookie', buildCookies(parentId))
      .set('x-csrf-token', CSRF_VALUE)
      .send({ name: 'Kiddo', gradeLevel: 5, narratorVoice: LAUREN_VOICE });

    expect(res.status).toBe(200);
    expect(res.body.child.gradeLevel).toBe(5);
    expect(res.body.child.narratorVoice).toBe(LAUREN_VOICE);

    const saved = await Child.findById(childId);
    expect(saved?.gradeLevel).toBe(5);
    expect(saved?.narratorVoice).toBe(LAUREN_VOICE);
  });
});
