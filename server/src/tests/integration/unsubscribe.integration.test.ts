import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import app from '../../app';
import User from '../../models/User';

describe('GET /api/email-preferences/unsubscribe/:token', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), { dbName: 'mathmagic-unsubscribe-tests' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('flips weeklyReportOptIn to false with no auth cookie required', async () => {
    const parent = await User.create({
      email: 'parent@example.com',
      name: 'Test Parent',
      passwordHash: 'hashed',
      unsubscribeToken: 'tok-abc-123',
      weeklyReportOptIn: true,
    });

    const res = await request(app).get('/api/email-preferences/unsubscribe/tok-abc-123');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);

    const updated = await User.findById(parent._id);
    expect(updated?.weeklyReportOptIn).toBe(false);
  });

  it('returns 200 even for an unknown token, without leaking validity', async () => {
    const res = await request(app).get('/api/email-preferences/unsubscribe/does-not-exist');
    expect(res.status).toBe(200);
  });
});
