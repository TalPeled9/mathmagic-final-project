import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mockSend = vi.hoisted(() => vi.fn());
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

import app from '../../app';
import User from '../../model/User';
import { Child } from '../../models/Child';
import { generateAccessToken } from '../../utils/jwt';
import { ACCESS_TOKEN_COOKIE, CSRF_COOKIE } from '../../utils/cookieOptions';

const CSRF_VALUE = 'test-csrf-token';

function buildCookies(userId: string): string[] {
  const accessToken = generateAccessToken(userId);
  return [`${ACCESS_TOKEN_COOKIE}=${accessToken}`, `${CSRF_COOKIE}=${CSRF_VALUE}`];
}

describe('/api/parent/reports/weekly', () => {
  let mongoServer: MongoMemoryServer;
  let parentId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), { dbName: 'mathmagic-reports-route-tests' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Child.deleteMany({});
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: 'email_123' }, error: null });

    const parent = await User.create({
      email: 'parent@example.com',
      name: 'Test Parent',
      passwordHash: 'hashed',
    });
    parentId = String(parent._id);

    await Child.create({
      parentId: parent._id,
      name: 'Kiddo',
      gradeLevel: 3,
      avatars: [{ imageData: '', description: '', createdAt: new Date() }],
      activeAvatarIndex: 0,
      generationTimestamps: [],
    });
  });

  it('POST /weekly/send force-sends the report and returns sent:true', async () => {
    const res = await request(app)
      .post('/api/parent/reports/weekly/send')
      .set('Cookie', buildCookies(parentId))
      .set('x-csrf-token', CSRF_VALUE)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ sent: true });
    expect(mockSend).toHaveBeenCalledTimes(1);

    const payload = mockSend.mock.calls[0][0];
    expect(payload.to).toBe('parent@example.com');
    expect(payload.html).toContain('Kiddo');
  });

  it('POST /weekly/send requires authentication', async () => {
    // Valid CSRF pair but no access/refresh token cookies, so this exercises the
    // auth check specifically (a request with no CSRF cookie at all is rejected
    // earlier, with 403, by the CSRF check).
    const res = await request(app)
      .post('/api/parent/reports/weekly/send')
      .set('Cookie', [`${CSRF_COOKIE}=${CSRF_VALUE}`])
      .set('x-csrf-token', CSRF_VALUE)
      .send({});
    expect(res.status).toBe(401);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('GET /weekly/preview renders HTML without sending an email', async () => {
    const res = await request(app)
      .get('/api/parent/reports/weekly/preview')
      .set('Cookie', buildCookies(parentId));

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('Kiddo');
    expect(mockSend).not.toHaveBeenCalled();
  });
});
