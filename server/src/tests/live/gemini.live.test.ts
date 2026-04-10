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
    'runs full adventure: start → math(correct) → story → math(wrong) → hint → story → end → complete',
    { timeout: 300_000 },
    async () => {
      const child = await Child.create({
        parentId: (await User.findOne({ email: 'live-parent@example.com' }))!._id,
        name: 'Maya',
        gradeLevel: 2,
        avatarUrl: 'https://example.com/avatar.png',
      });
      const childId = String(child._id);

      // 1) Start adventure → intro story step (step 0)
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

      // 2) Continue → math question (step 1 — odd steps are math)
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

      // 3) Answer math correctly (no LLM call — no sleep needed)
      const challenge = await Adventure.findById(adventureId);
      const correctAnswer = challenge?.currentChallenge?.correctAnswer;
      expect(correctAnswer).toBeTypeOf('string');

      const correctRes = await timedPost({
        label: 'answer math (correct)',
        path: `/api/adventures/${adventureId}/answer`,
        cookies,
        body: { answer: correctAnswer },
        expectedStatus: 200,
        timings,
      });
      expect(correctRes.body.correct).toBe(true);

      // 4) Continue → story step (step 2 — even steps are story)
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

      // 5) Continue → second math question (step 3 — odd)
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

      // 6) Answer math incorrectly — attempt 1 (no LLM call)
      const wrongRes = await timedPost({
        label: 'answer math (wrong attempt 1)',
        path: `/api/adventures/${adventureId}/answer`,
        cookies,
        body: { answer: '__definitely_wrong__' },
        expectedStatus: 200,
        timings,
      });
      expect(wrongRes.body.correct).toBe(false);

      // 7) Hint level 1
      await sleep(SLEEP_MS);
      const hint1Res = await timedPost({
        label: 'hint level 1',
        path: `/api/adventures/${adventureId}/hint`,
        cookies,
        expectedStatus: 200,
        timings,
      });
      expect(hint1Res.body.hintLevel).toBe(1);
      expect(typeof hint1Res.body.hintText).toBe('string');
      expect(hint1Res.body.hintText.length).toBeGreaterThan(0);

      // 8) Hint level 2
      await sleep(SLEEP_MS);
      const hint2Res = await timedPost({
        label: 'hint level 2',
        path: `/api/adventures/${adventureId}/hint`,
        cookies,
        expectedStatus: 200,
        timings,
      });
      expect(hint2Res.body.hintLevel).toBe(2);
      expect(typeof hint2Res.body.hintText).toBe('string');
      expect(hint2Res.body.hintText.length).toBeGreaterThan(0);

      // 9) Hint level 3
      await sleep(SLEEP_MS);
      const hint3Res = await timedPost({
        label: 'hint level 3',
        path: `/api/adventures/${adventureId}/hint`,
        cookies,
        expectedStatus: 200,
        timings,
      });
      expect(hint3Res.body.hintLevel).toBe(3);
      expect(typeof hint3Res.body.hintText).toBe('string');
      expect(hint3Res.body.hintText.length).toBeGreaterThan(0);

      // 10–11) Exhaust remaining attempts to clear the challenge (no LLM calls)
      await timedPost({
        label: 'wrong attempt 2',
        path: `/api/adventures/${adventureId}/answer`,
        cookies,
        body: { answer: '__still_wrong__' },
        expectedStatus: 200,
        timings,
      });

      const revealRes = await timedPost({
        label: 'wrong attempt 3 (reveal)',
        path: `/api/adventures/${adventureId}/answer`,
        cookies,
        body: { answer: '__still_wrong__' },
        expectedStatus: 200,
        timings,
      });
      expect(typeof revealRes.body.correctAnswer).toBe('string');

      // 12) Continue → story step (step 4 — even)
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

      // 13) Continue → end story (step 5 — last step)
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

      // 14) Complete (no LLM call)
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
