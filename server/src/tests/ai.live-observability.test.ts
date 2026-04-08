import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import type { Response } from 'supertest';

import app from '../app';
import User from '../model/User';
import { Adventure } from '../models/Adventure';
import { Child } from '../models/Child';
import { GeminiJsonClient } from '../services/ai/geminiClient';
import { generateAccessToken } from '../utils/jwt';
import { ACCESS_TOKEN_COOKIE, CSRF_COOKIE } from '../utils/cookieOptions';

const runLive = process.env.RUN_AI_OBSERVABILITY === 'true';
const runMock = process.env.RUN_AI_OBSERVABILITY_MOCK === 'true';
const shouldRun = runLive || runMock;
const liveDescribe = shouldRun ? describe : describe.skip;

const CSRF_VALUE = 'ai-observe-csrf-token';

type PromptCapture = {
  prompt: string;
  temperature: number | undefined;
  schemaKeys: string[];
  model: string;
};

type SummaryEntry = {
  step: string;
  mode: string;
  promptChars: number;
  responseKeys: string;
  note: string;
};

function logBlock(title: string, payload: unknown): void {
  console.info(`\n========== ${title} ==========`);
  if (typeof payload === 'string') {
    console.info(payload);
    return;
  }

  console.info(JSON.stringify(payload, null, 2));
}

function printCompactSummary(entries: SummaryEntry[]): void {
  console.info('\n========== COMPACT SUMMARY (controller e2e flow) ==========');
  for (const entry of entries) {
    console.info(
      `${entry.step} | mode=${entry.mode} | promptChars=${entry.promptChars} | responseKeys=${entry.responseKeys} | ${entry.note}`
    );
  }
}

function inferModeFromSchemaKeys(schemaKeys: string[]): string {
  if (schemaKeys.includes('adventureNarrative') && schemaKeys.includes('storyChoices')) {
    return 'story_step';
  }
  if (schemaKeys.includes('problemText') && schemaKeys.includes('correctAnswer')) {
    return 'math_question';
  }
  if (schemaKeys.includes('hintText') && schemaKeys.includes('encouragement')) {
    return 'hint';
  }
  if (schemaKeys.includes('recap') && schemaKeys.includes('celebration')) {
    return 'end_story';
  }
  return `unknown(${schemaKeys.join(',')})`;
}

function buildMockResponseByMode(mode: string): Record<string, unknown> {
  if (mode === 'story_step') {
    return {
      adventureNarrative: 'Maya and Wizzy arrive at the moon gate where stars sparkle all around.',
      wizzyDialogue: 'Great choice, Maya. Let us explore this path together!',
      storyChoices: ['Open the moon gate', 'Follow the starlight trail', 'Talk to the robot guide'],
      imageDescription: "A child's avatar and Wizzy near a glowing moon gate in space.",
    };
  }

  if (mode === 'math_question') {
    return {
      wizzyDialogue: 'Solve this puzzle to power the gate!',
      problemText: 'What is 2 + 2?',
      answerOptions: ['3', '4', '5', '6'],
      correctAnswer: '4',
      imageDescription: "A child's avatar and Wizzy with a floating math puzzle in space.",
    };
  }

  if (mode === 'hint') {
    return {
      hintText: 'Try counting up from 2 and add two more steps.',
      encouragement: 'You are doing great. Keep going!',
      answerOptions: ['3', '4', '5', '6'],
      correctAnswer: '4',
      scaffoldingQuestion: 'If you have 2 stars and get 2 more, how many stars do you have?',
    };
  }

  return {
    wizzyDialogue: 'Wonderful work today, Maya!',
    recap: 'You explored the moon gate and solved space puzzles with confidence.',
    celebration: 'Amazing effort. You completed the adventure!',
    imageDescription: "A child's avatar and Wizzy celebrating under a starry sky.",
  };
}

function buildCookies(userId: string): string[] {
  const accessToken = generateAccessToken(userId);
  return [`${ACCESS_TOKEN_COOKIE}=${accessToken}`, `${CSRF_COOKIE}=${CSRF_VALUE}`];
}

function csrfHeader(): { 'x-csrf-token': string } {
  return { 'x-csrf-token': CSRF_VALUE };
}

liveDescribe('AI live observability (controller full flow)', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), { dbName: 'ai-observe-controller-flow' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it(
    'runs full route flow: start -> math(correct) -> math(wrong) -> hint1/2/3 -> end story -> complete',
    { timeout: 300000 },
    async () => {
      if (!runMock && !process.env.GEMINI_API_KEY) {
        throw new Error(
          'Missing GEMINI_API_KEY. Put it in server/.env or set env var before running.'
        );
      }

      await User.deleteMany({});
      await Child.deleteMany({});
      await Adventure.deleteMany({});

      const parent = await User.create({
        email: 'observe-parent@example.com',
        name: 'Observe Parent',
        passwordHash: 'hashed',
      });
      const parentId = String(parent._id);

      const child = await Child.create({
        parentId,
        name: 'Maya',
        gradeLevel: 2,
        avatarUrl: 'https://example.com/avatar.png',
      });
      const childId = String(child._id);

      // Seed an existing in-progress adventure to prove startAdventure creates a fresh one.
      const staleAdventure = await Adventure.create({
        childId,
        mathTopic: 'addition',
        storyWorld: 'space',
        currentStepIndex: 4,
        lastChoices: ['Old choice A', 'Old choice B', 'Old choice C'],
        conversationHistory: [
          { role: 'wizzy', content: 'Old ongoing adventure content', timestamp: new Date() },
        ],
      });

      const cookies = buildCookies(parentId);
      const captures: PromptCapture[] = [];
      const aiResponses: unknown[] = [];
      const summary: SummaryEntry[] = [];

      async function postWithRetries(options: {
        label: string;
        path: string;
        expectedStatus: number;
        body?: unknown;
        maxAttempts?: number;
      }): Promise<Response> {
        const { label, path, expectedStatus, body, maxAttempts = 3 } = options;

        let lastResponse: Response | undefined;

        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          let req = request(app).post(path).set('Cookie', cookies).set(csrfHeader());

          if (typeof body === 'string' || (typeof body === 'object' && body !== null)) {
            req = req.send(body);
          }

          const response = await req;
          lastResponse = response;

          if (response.status === expectedStatus) {
            return response;
          }

          logBlock(`${label} failed attempt ${attempt}`, {
            status: response.status,
            body: response.body,
          });

          const retryable = response.status === 500;
          if (!retryable || attempt === maxAttempts) {
            throw new Error(
              `${label} expected ${expectedStatus}, got ${response.status}. Body: ${JSON.stringify(response.body)}`
            );
          }
        }

        throw new Error(
          `${label} failed after retries. Last response: ${JSON.stringify(lastResponse?.body ?? {})}`
        );
      }

      const originalGenerateJson = GeminiJsonClient.prototype.generateJson;
      const generateJsonSpy = vi
        .spyOn(GeminiJsonClient.prototype, 'generateJson')
        .mockImplementation(async function (
          this: GeminiJsonClient,
          params: unknown
        ): Promise<unknown> {
          const p = params as {
            prompt: string;
            schema: Record<string, unknown>;
            model: string;
            temperature?: number;
          };

          const schema = p.schema as { properties?: Record<string, unknown> };
          const schemaKeys = Object.keys(schema.properties ?? {});

          captures.push({
            prompt: p.prompt,
            temperature: p.temperature,
            schemaKeys,
            model: p.model,
          });

          const mode = inferModeFromSchemaKeys(schemaKeys);

          if (runMock) {
            const mock = buildMockResponseByMode(mode);
            aiResponses.push(mock);
            return mock;
          }

          try {
            const result = await originalGenerateJson.call(this, p as never);
            aiResponses.push(result);
            return result;
          } catch (err) {
            aiResponses.push({ __error: String(err) });
            throw err;
          }
        });

      try {
        // 1) startAdventure from controller must create a brand-new adventure.
        const beforeCount = await Adventure.countDocuments({ childId });
        const startRes = await postWithRetries({
          label: 'startAdventure',
          path: `/api/adventures/children/${childId}`,
          expectedStatus: 201,
          body: { mathTopic: 'addition', storyWorld: 'space' },
        });

        const adventureId = startRes.body.adventureId as string;
        expect(adventureId).toBeTypeOf('string');
        expect(adventureId).not.toBe(String(staleAdventure._id));

        const afterStart = await Adventure.findById(adventureId);
        expect(afterStart).not.toBeNull();
        expect(afterStart?.status).toBe('in-progress');
        expect(afterStart?.currentStepIndex).toBe(0);
        expect(afterStart?.conversationHistory.length).toBeGreaterThan(0);
        expect(afterStart?.lastChoices.length).toBe(3);

        const afterCount = await Adventure.countDocuments({ childId });
        expect(afterCount).toBeGreaterThanOrEqual(beforeCount + 1);

        // 2) continue -> first math question
        const continueToMath1 = await postWithRetries({
          label: 'continue->math1',
          path: `/api/adventures/${adventureId}/continue`,
          expectedStatus: 200,
          body: { choiceIndex: 0 },
        });

        expect(continueToMath1.body.segment.challenge).not.toBeNull();

        // 3) answer first math correctly
        const challenge1 = await Adventure.findById(adventureId);
        const firstCorrectAnswer = challenge1?.currentChallenge?.correctAnswer;
        expect(firstCorrectAnswer).toBeTypeOf('string');

        const answer1Res = await postWithRetries({
          label: 'answer1-correct',
          path: `/api/adventures/${adventureId}/answer`,
          expectedStatus: 200,
          body: { answer: firstCorrectAnswer },
        });
        expect(answer1Res.body.correct).toBe(true);

        // 4) auto-continue after solved challenge -> story step
        const continueToStory2 = await postWithRetries({
          label: 'continue->story2',
          path: `/api/adventures/${adventureId}/continue`,
          expectedStatus: 200,
          body: { choiceIndex: 0 },
        });

        expect(Array.isArray(continueToStory2.body.segment.choices)).toBe(true);
        expect(continueToStory2.body.segment.choices.length).toBe(3);

        // 5) continue again with selected choice -> second math question
        const continueToMath2 = await postWithRetries({
          label: 'continue->math2',
          path: `/api/adventures/${adventureId}/continue`,
          expectedStatus: 200,
          body: { choiceIndex: 0 },
        });
        expect(continueToMath2.body.segment.challenge).not.toBeNull();

        // 6) answer second math incorrectly once
        const wrongAnswerRes = await postWithRetries({
          label: 'answer2-wrong',
          path: `/api/adventures/${adventureId}/answer`,
          expectedStatus: 200,
          body: { answer: '__definitely_wrong__' },
        });
        expect(wrongAnswerRes.body.correct).toBe(false);

        // 7) hint 1 -> hint 2 -> hint 3
        for (const expectedLevel of [1, 2, 3]) {
          const hintRes = await postWithRetries({
            label: `hint-${expectedLevel}`,
            path: `/api/adventures/${adventureId}/hint`,
            expectedStatus: 200,
          });
          expect(hintRes.body.hintLevel).toBe(expectedLevel);
          expect(typeof hintRes.body.hintText).toBe('string');
          expect(hintRes.body.hintText.length).toBeGreaterThan(0);
        }

        // 8) clear active challenge after hints by reaching third wrong attempt.
        await postWithRetries({
          label: 'wrong-after-hints-attempt2',
          path: `/api/adventures/${adventureId}/answer`,
          expectedStatus: 200,
          body: { answer: '__still_wrong__' },
        });

        const revealAnswerRes = await postWithRetries({
          label: 'wrong-after-hints-attempt3',
          path: `/api/adventures/${adventureId}/answer`,
          expectedStatus: 200,
          body: { answer: '__still_wrong__' },
        });
        expect(revealAnswerRes.body.correct).toBe(false);
        expect(typeof revealAnswerRes.body.correctAnswer).toBe('string');

        // 9) continue to story, then continue to end_story mode
        const continueToStory3 = await postWithRetries({
          label: 'continue->story3',
          path: `/api/adventures/${adventureId}/continue`,
          expectedStatus: 200,
          body: { choiceIndex: 0 },
        });
        expect(Array.isArray(continueToStory3.body.segment.choices)).toBe(true);
        expect(continueToStory3.body.segment.choices.length).toBe(3);

        const endStoryRes = await postWithRetries({
          label: 'continue->endStory',
          path: `/api/adventures/${adventureId}/continue`,
          expectedStatus: 200,
          body: { choiceIndex: 0 },
        });

        expect(endStoryRes.body.segment.isLastStep).toBe(true);

        // 10) complete adventure (controller completion endpoint)
        const completeRes = await postWithRetries({
          label: 'completeAdventure',
          path: `/api/adventures/${adventureId}/complete`,
          expectedStatus: 200,
        });
        expect(typeof completeRes.body.xpEarned).toBe('number');
        expect(typeof completeRes.body.starsEarned).toBe('number');

        const completedAdventure = await Adventure.findById(adventureId);
        expect(completedAdventure?.status).toBe('completed');

        // Print all captured prompts and AI responses in call order.
        for (let i = 0; i < captures.length; i++) {
          const capture = captures[i]!;
          const mode = inferModeFromSchemaKeys(capture.schemaKeys);
          const responseObj = aiResponses[i] as Record<string, unknown>;
          const responseKeys = Object.keys(responseObj ?? {}).sort();

          summary.push({
            step: `${i + 1}`,
            mode,
            promptChars: capture.prompt.length,
            responseKeys: responseKeys.join(','),
            note: `temp=${capture.temperature ?? 'default'} model=${capture.model}`,
          });

          logBlock(`PROMPT #${i + 1} (${mode})`, capture.prompt);
          logBlock(`RESPONSE #${i + 1} (${mode})`, responseObj);
        }

        printCompactSummary(summary);

        const seenModes = new Set(summary.map((e) => e.mode));
        expect(seenModes.has('story_step')).toBe(true);
        expect(seenModes.has('math_question')).toBe(true);
        expect(seenModes.has('hint')).toBe(true);
        expect(seenModes.has('end_story')).toBe(true);
      } finally {
        generateJsonSpy.mockRestore();
      }
    }
  );
});
