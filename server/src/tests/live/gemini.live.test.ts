import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import type { Response } from 'supertest';

import app from '../../app';
import User from '../../model/User';
import { Adventure } from '../../models/Adventure';
import { Child } from '../../models/Child';
import { generateAccessToken } from '../../utils/jwt';
import { ACCESS_TOKEN_COOKIE, CSRF_COOKIE } from '../../utils/cookieOptions';

const CSRF_VALUE = 'gemini-live-csrf';
const SLEEP_MS = 15_000;

type TimingEntry = { step: string; durationMs: number };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildCookies(userId: string): string[] {
  return [
    `${ACCESS_TOKEN_COOKIE}=${generateAccessToken(userId)}`,
    `${CSRF_COOKIE}=${CSRF_VALUE}`,
  ];
}


async function timedPost(options: {
  label: string;
  path: string;
  cookies: string[];
  body?: unknown;
  expectedStatus: number;
  timings: TimingEntry[];
  maxAttempts?: number;
}): Promise<Response> {
  const { label, path, cookies, body, expectedStatus, timings, maxAttempts = 3 } = options;

  let lastResponse: Response | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const start = Date.now();

    let req = request(app).post(path).set('Cookie', cookies).set('x-csrf-token', CSRF_VALUE);
    if (body !== undefined) req = req.send(body as Record<string, unknown>);

    const response = await req;
    const durationMs = Date.now() - start;

    lastResponse = response;

    if (response.status === expectedStatus) {
      timings.push({ step: label, durationMs });
      console.info(`⏱  ${label}: ${(durationMs / 1000).toFixed(1)}s`);
      console.info('    response:', JSON.stringify(response.body, null, 2));
      return response;
    }

    console.warn(`${label} attempt ${attempt} got ${response.status}:`, response.body);
    if (response.status !== 500 || attempt === maxAttempts) {
      throw new Error(
        `${label} expected ${expectedStatus}, got ${response.status}. Body: ${JSON.stringify(response.body ?? {})}`
      );
    }
  }

  throw new Error(`${label} failed after retries. Last: ${JSON.stringify(lastResponse?.body ?? {})}`);
}

describe('Gemini live E2E — full adventure flow', () => {
  let mongoServer: MongoMemoryServer;
  let cookies: string[];
  const timings: TimingEntry[] = [];
  const flowStart = Date.now();

  beforeAll(async () => {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        'GEMINI_API_KEY is not set. Add it to server/.env before running: npm run test:live:gemini'
      );
    }

    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), { dbName: 'gemini-live' });

    const parent = await User.create({
      email: 'live-parent@example.com',
      name: 'Live Parent',
      passwordHash: 'hashed',
    });
    cookies = buildCookies(String(parent._id));
  });

  afterAll(async () => {
    const totalMs = Date.now() - flowStart;
    console.info('\n========== TIMING SUMMARY ==========');
    for (const entry of timings) {
      console.info(`  ${entry.step.padEnd(30)} ${(entry.durationMs / 1000).toFixed(1)}s`);
    }
    console.info(`  ${'TOTAL'.padEnd(30)} ${(totalMs / 1000).toFixed(1)}s`);
    console.info('=====================================\n');

    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it(
    'runs full adventure: start → story → math(correct) → story → math(wrong) → hint → end → complete',
    { timeout: 120_000 },
    async () => {
      const child = await Child.create({
        parentId: (await User.findOne({ email: 'live-parent@example.com' }))!._id,
        name: 'Maya',
        gradeLevel: 2,
        avatarUrl: 'https://example.com/avatar.png',
      });
      const childId = String(child._id);

      // 1) Start adventure
      const startRes = await timedPost({
        label: 'start adventure',
        path: `/api/adventures/children/${childId}`,
        cookies,
        body: { mathTopic: 'addition', storyWorld: 'space' },
        expectedStatus: 201,
        timings,
      });

      const adventureId = startRes.body.adventureId as string;
      expect(adventureId).toBeTypeOf('string');

      const afterStart = await Adventure.findById(adventureId);
      expect(afterStart?.status).toBe('in-progress');
      expect(afterStart?.lastChoices).toHaveLength(3);

      // 2) Continue → story step
      await sleep(SLEEP_MS);
      const storyRes = await timedPost({
        label: 'continue → story step',
        path: `/api/adventures/${adventureId}/continue`,
        cookies,
        body: { choiceIndex: 0 },
        expectedStatus: 200,
        timings,
      });
      expect(Array.isArray(storyRes.body.segment.choices)).toBe(true);
      expect(storyRes.body.segment.choices).toHaveLength(3);

      // 3) Continue → math question
      await sleep(SLEEP_MS);
      const mathRes = await timedPost({
        label: 'continue → math question',
        path: `/api/adventures/${adventureId}/continue`,
        cookies,
        body: { choiceIndex: 0 },
        expectedStatus: 200,
        timings,
      });
      expect(mathRes.body.segment.challenge).not.toBeNull();

      // 4) Answer math correctly
      const challenge = await Adventure.findById(adventureId);
      const correctAnswer = challenge?.currentChallenge?.correctAnswer;
      expect(correctAnswer).toBeTypeOf('string');

      await sleep(SLEEP_MS);
      const correctRes = await timedPost({
        label: 'answer math (correct)',
        path: `/api/adventures/${adventureId}/answer`,
        cookies,
        body: { answer: correctAnswer },
        expectedStatus: 200,
        timings,
      });
      expect(correctRes.body.correct).toBe(true);

      // 5) Continue → next story step
      await sleep(SLEEP_MS);
      const story2Res = await timedPost({
        label: 'continue → story step 2',
        path: `/api/adventures/${adventureId}/continue`,
        cookies,
        body: { choiceIndex: 0 },
        expectedStatus: 200,
        timings,
      });
      expect(Array.isArray(story2Res.body.segment.choices)).toBe(true);

      // 6) Continue → second math question
      await sleep(SLEEP_MS);
      const math2Res = await timedPost({
        label: 'continue → math question 2',
        path: `/api/adventures/${adventureId}/continue`,
        cookies,
        body: { choiceIndex: 0 },
        expectedStatus: 200,
        timings,
      });
      expect(math2Res.body.segment.challenge).not.toBeNull();

      // 7) Answer math incorrectly
      await sleep(SLEEP_MS);
      const wrongRes = await timedPost({
        label: 'answer math (wrong)',
        path: `/api/adventures/${adventureId}/answer`,
        cookies,
        body: { answer: '__definitely_wrong__' },
        expectedStatus: 200,
        timings,
      });
      expect(wrongRes.body.correct).toBe(false);

      // 8) Request a hint
      await sleep(SLEEP_MS);
      const hintRes = await timedPost({
        label: 'request hint',
        path: `/api/adventures/${adventureId}/hint`,
        cookies,
        expectedStatus: 200,
        timings,
      });
      expect(hintRes.body.hintLevel).toBe(1);
      expect(typeof hintRes.body.hintText).toBe('string');
      expect(hintRes.body.hintText.length).toBeGreaterThan(0);

      // 9) Exhaust attempts to clear challenge (2 more wrong answers)
      await sleep(SLEEP_MS);
      await timedPost({
        label: 'wrong attempt 2',
        path: `/api/adventures/${adventureId}/answer`,
        cookies,
        body: { answer: '__still_wrong__' },
        expectedStatus: 200,
        timings,
      });

      await sleep(SLEEP_MS);
      const revealRes = await timedPost({
        label: 'wrong attempt 3 (reveal)',
        path: `/api/adventures/${adventureId}/answer`,
        cookies,
        body: { answer: '__still_wrong__' },
        expectedStatus: 200,
        timings,
      });
      expect(typeof revealRes.body.correctAnswer).toBe('string');

      // 10) Continue → story step 3
      await sleep(SLEEP_MS);
      const story3Res = await timedPost({
        label: 'continue → story step 3',
        path: `/api/adventures/${adventureId}/continue`,
        cookies,
        body: { choiceIndex: 0 },
        expectedStatus: 200,
        timings,
      });
      expect(Array.isArray(story3Res.body.segment.choices)).toBe(true);

      // 11) Continue → end story
      await sleep(SLEEP_MS);
      const endRes = await timedPost({
        label: 'continue → end story',
        path: `/api/adventures/${adventureId}/continue`,
        cookies,
        body: { choiceIndex: 0 },
        expectedStatus: 200,
        timings,
      });
      expect(endRes.body.segment.isLastStep).toBe(true);

      // 12) Complete
      const completeRes = await timedPost({
        label: 'complete adventure',
        path: `/api/adventures/${adventureId}/complete`,
        cookies,
        expectedStatus: 200,
        timings,
      });
      expect(typeof completeRes.body.xpEarned).toBe('number');
      expect(typeof completeRes.body.starsEarned).toBe('number');

      const done = await Adventure.findById(adventureId);
      expect(done?.status).toBe('completed');
    }
  );
});
