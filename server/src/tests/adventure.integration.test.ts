import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../app';
import { llmService } from '../services/ai/llmService';
import User from '../model/User';
import { Child } from '../models/Child';
import { Adventure } from '../models/Adventure';
import { LearningSession } from '../models/LearningSession';
import { TopicProgress } from '../models/TopicProgress';
import { generateAccessToken } from '../utils/jwt';
import { ACCESS_TOKEN_COOKIE, CSRF_COOKIE } from '../utils/cookieOptions';

// ─── LLM + image mocks (hoisted) ─────────────────────────────────────────────

vi.mock('../services/ai/llmService', () => ({
  llmService: {
    generateStoryStepFromState: vi.fn(),
    generateMathQuestionFromState: vi.fn(),
    generateHintFromState: vi.fn(),
    generateEndStoryFromState: vi.fn(),
  },
}));

vi.mock('../services/ai/imageGenerationService', () => ({
  generateStoryImage: vi.fn().mockResolvedValue(null),
}));

// Bypass AI rate limit for tests so requests don't get throttled
vi.mock('../middleware/rateLimit', () => ({
  aiRateLimit: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// ─── Mock return value fixtures ───────────────────────────────────────────────

const MOCK_START_RESPONSE = {
  adventureNarrative: 'Once upon a time in a magical forest…',
  wizzyDialogue: 'Welcome, young adventurer!',
  storyChoices: ['Follow the path', 'Climb the tree', 'Cross the river'],
  imageDescription: 'A bright enchanted forest at dawn',
};

const MOCK_MATH_RESPONSE = {
  wizzyDialogue: 'Solve this to continue!',
  problemText: '2 + 2 = ?',
  correctAnswer: '4',
  answerOptions: ['3', '4', '5', '6'],
  imageDescription: 'A math scroll glowing with light',
};

const MOCK_HINT_RESPONSE = {
  hintText: 'Think about what you add to 2 to make 4.',
  scaffoldingQuestion: 'What is 2 + 1?',
  encouragement: 'You can do it!',
  answerOptions: ['3', '4', '5', '6'],
  correctAnswer: '4',
};

const MOCK_END_RESPONSE = {
  recap: 'You bravely solved the challenges and saved the forest!',
  celebration: 'Amazing work, hero!',
  wizzyDialogue: 'You did it!',
  imageDescription: 'A celebration with fireworks over the forest',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CSRF_VALUE = 'test-csrf-token';

function buildCookies(userId: string): string[] {
  const accessToken = generateAccessToken(userId);
  return [
    `${ACCESS_TOKEN_COOKIE}=${accessToken}`,
    `${CSRF_COOKIE}=${CSRF_VALUE}`,
  ];
}

function csrfHeader(): { 'x-csrf-token': string } {
  return { 'x-csrf-token': CSRF_VALUE };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('adventure routes integration', () => {
  let mongoServer: MongoMemoryServer;
  let parentId: string;
  let childId: string;
  let otherParentId: string;

  const mockedLlm = vi.mocked(llmService);

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), { dbName: 'mathmagic-adventure-tests' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    vi.restoreAllMocks();

    // Clear all collections
    await User.deleteMany({});
    await Child.deleteMany({});
    await Adventure.deleteMany({});
    await LearningSession.deleteMany({});
    await TopicProgress.deleteMany({});

    // Seed parent + child
    const parent = await User.create({
      email: 'parent@example.com',
      name: 'Test Parent',
      passwordHash: 'hashed',
    });
    parentId = String(parent._id);

    const child = await Child.create({
      parentId,
      name: 'Timmy',
      gradeLevel: 2,
    });
    childId = String(child._id);

    // Seed a second parent for 403 tests
    const other = await User.create({
      email: 'other@example.com',
      name: 'Other Parent',
      passwordHash: 'hashed',
    });
    otherParentId = String(other._id);

    // Default LLM mock return values
    mockedLlm.generateStoryStepFromState.mockResolvedValue(MOCK_START_RESPONSE);
    mockedLlm.generateMathQuestionFromState.mockResolvedValue(MOCK_MATH_RESPONSE);
    mockedLlm.generateHintFromState.mockResolvedValue(MOCK_HINT_RESPONSE);
    mockedLlm.generateEndStoryFromState.mockResolvedValue(MOCK_END_RESPONSE);
  });

  // ─── GET /api/adventures/children/:childId/available ───────────────────────

  describe('GET /api/adventures/children/:childId/available', () => {
    it('returns math topics filtered by child grade and all story worlds', async () => {
      const response = await request(app)
        .get(`/api/adventures/children/${childId}/available`)
        .set('Cookie', buildCookies(parentId))
        .expect(200);

      expect(response.body.worlds).toBeDefined();
      expect(Array.isArray(response.body.worlds)).toBe(true);
      expect(response.body.worlds.length).toBeGreaterThan(0);

      expect(response.body.topics).toBeDefined();
      expect(Array.isArray(response.body.topics)).toBe(true);
      // Grade 2 child should get topics that cover grade 2
      for (const topic of response.body.topics) {
        expect(topic.gradeRange.min).toBeLessThanOrEqual(2);
        expect(topic.gradeRange.max).toBeGreaterThanOrEqual(2);
      }
    });
  });

  // ─── POST /api/adventures/children/:childId — start adventure ──────────────

  describe('POST /api/adventures/children/:childId', () => {
    it('creates adventure and returns 201 with adventureId and segment', async () => {
      const response = await request(app)
        .post(`/api/adventures/children/${childId}`)
        .set('Cookie', buildCookies(parentId))
        .set(csrfHeader())
        .send({ mathTopic: 'addition', storyWorld: 'space' })
        .expect(201);

      expect(typeof response.body.adventureId).toBe('string');
      expect(response.body.adventureId.length).toBeGreaterThan(0);

      const { segment } = response.body;
      expect(segment.narrative).toBe(MOCK_START_RESPONSE.adventureNarrative);
      expect(segment.wizzyDialogue).toBe(MOCK_START_RESPONSE.wizzyDialogue);
      expect(segment.choices).toEqual(MOCK_START_RESPONSE.storyChoices);
      expect(segment.imageDescription).toBe(MOCK_START_RESPONSE.imageDescription);
      expect(segment.challenge).toBeNull();
      expect(segment.isLastStep).toBe(false);

      // Verify DB document was created
      const adventure = await Adventure.findById(response.body.adventureId);
      expect(adventure).not.toBeNull();
      expect(adventure?.mathTopic).toBe('addition');
      expect(adventure?.storyWorld).toBe('space');
      expect(adventure?.conversationHistory.length).toBeGreaterThan(0);
    });

    it('returns 400 for an unknown mathTopic', async () => {
      const response = await request(app)
        .post(`/api/adventures/children/${childId}`)
        .set('Cookie', buildCookies(parentId))
        .set(csrfHeader())
        .send({ mathTopic: 'quantum-physics', storyWorld: 'space' })
        .expect(400);

      expect(response.body.error.message).toMatch(/unknown math topic/i);
    });

    it('returns 403 when authenticated parent does not own the child', async () => {
      await request(app)
        .post(`/api/adventures/children/${childId}`)
        .set('Cookie', buildCookies(otherParentId))
        .set(csrfHeader())
        .send({ mathTopic: 'addition', storyWorld: 'space' })
        .expect(403);
    });
  });

  // ─── GET /api/adventures/:adventureId ──────────────────────────────────────

  describe('GET /api/adventures/:adventureId', () => {
    it('returns adventure state including conversationHistory', async () => {
      // Create an adventure to fetch
      const startRes = await request(app)
        .post(`/api/adventures/children/${childId}`)
        .set('Cookie', buildCookies(parentId))
        .set(csrfHeader())
        .send({ mathTopic: 'addition', storyWorld: 'space' })
        .expect(201);

      const { adventureId } = startRes.body;

      const response = await request(app)
        .get(`/api/adventures/${adventureId}`)
        .set('Cookie', buildCookies(parentId))
        .expect(200);

      expect(response.body.adventureId).toBe(adventureId);
      expect(response.body.mathTopic).toBe('addition');
      expect(response.body.storyWorld).toBe('space');
      expect(response.body.status).toBe('in-progress');
      expect(Array.isArray(response.body.conversationHistory)).toBe(true);
      expect(response.body.conversationHistory.length).toBeGreaterThan(0);
    });

    it('returns 404 for an unknown adventureId', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await request(app)
        .get(`/api/adventures/${fakeId}`)
        .set('Cookie', buildCookies(parentId))
        .expect(404);
    });
  });

  // ─── POST /api/adventures/:adventureId/continue ────────────────────────────

  describe('POST /api/adventures/:adventureId/continue', () => {
    it('increments stepIndex and returns next segment', async () => {
      const startRes = await request(app)
        .post(`/api/adventures/children/${childId}`)
        .set('Cookie', buildCookies(parentId))
        .set(csrfHeader())
        .send({ mathTopic: 'addition', storyWorld: 'space' })
        .expect(201);

      const { adventureId } = startRes.body;

      // Step 0 yielded choices; we continue with choiceIndex 0 → step 1 is math_question
      const continueRes = await request(app)
        .post(`/api/adventures/${adventureId}/continue`)
        .set('Cookie', buildCookies(parentId))
        .set(csrfHeader())
        .send({ choiceIndex: 0 })
        .expect(200);

      expect(continueRes.body.segment).toBeDefined();

      // Verify stepIndex advanced in DB
      const updated = await Adventure.findById(adventureId);
      expect(updated?.currentStepIndex).toBe(1);
    });
  });

  // ─── POST /api/adventures/:adventureId/answer ──────────────────────────────

  describe('POST /api/adventures/:adventureId/answer', () => {
    async function startAndAdvanceToMathQuestion() {
      const startRes = await request(app)
        .post(`/api/adventures/children/${childId}`)
        .set('Cookie', buildCookies(parentId))
        .set(csrfHeader())
        .send({ mathTopic: 'addition', storyWorld: 'space' })
        .expect(201);

      const { adventureId } = startRes.body;

      await request(app)
        .post(`/api/adventures/${adventureId}/continue`)
        .set('Cookie', buildCookies(parentId))
        .set(csrfHeader())
        .send({ choiceIndex: 0 })
        .expect(200);

      return adventureId;
    }

    it('correct answer returns { correct: true, xpEarned }', async () => {
      const adventureId = await startAndAdvanceToMathQuestion();

      const response = await request(app)
        .post(`/api/adventures/${adventureId}/answer`)
        .set('Cookie', buildCookies(parentId))
        .set(csrfHeader())
        .send({ answer: '4' })
        .expect(200);

      expect(response.body.correct).toBe(true);
      expect(typeof response.body.xpEarned).toBe('number');
      expect(response.body.xpEarned).toBeGreaterThan(0);

      // Challenge should be cleared
      const adventure = await Adventure.findById(adventureId);
      expect(adventure?.currentChallenge).toBeNull();
    });

    it('wrong answer (1st attempt) returns { correct: false } and preserves challenge', async () => {
      const adventureId = await startAndAdvanceToMathQuestion();

      const response = await request(app)
        .post(`/api/adventures/${adventureId}/answer`)
        .set('Cookie', buildCookies(parentId))
        .set(csrfHeader())
        .send({ answer: 'wrong' })
        .expect(200);

      expect(response.body.correct).toBe(false);
      expect(response.body.feedback).toMatch(/try again/i);

      // Challenge should still be active
      const adventure = await Adventure.findById(adventureId);
      expect(adventure?.currentChallenge).not.toBeNull();
      expect(adventure?.currentChallenge?.attemptsCount).toBe(1);
    });

    it('3rd wrong attempt reveals the correct answer', async () => {
      const adventureId = await startAndAdvanceToMathQuestion();
      const cookies = buildCookies(parentId);

      // First two wrong attempts
      for (let i = 0; i < 2; i++) {
        await request(app)
          .post(`/api/adventures/${adventureId}/answer`)
          .set('Cookie', cookies)
          .set(csrfHeader())
          .send({ answer: 'wrong' })
          .expect(200);
      }

      // Third wrong attempt
      const response = await request(app)
        .post(`/api/adventures/${adventureId}/answer`)
        .set('Cookie', cookies)
        .set(csrfHeader())
        .send({ answer: 'wrong' })
        .expect(200);

      expect(response.body.correct).toBe(false);
      expect(response.body.correctAnswer).toBe('4');

      // Challenge should now be cleared
      const adventure = await Adventure.findById(adventureId);
      expect(adventure?.currentChallenge).toBeNull();
    });

    it('returns 400 when no challenge is active', async () => {
      // Start adventure — step 0 is story, no math challenge
      const startRes = await request(app)
        .post(`/api/adventures/children/${childId}`)
        .set('Cookie', buildCookies(parentId))
        .set(csrfHeader())
        .send({ mathTopic: 'addition', storyWorld: 'space' })
        .expect(201);

      await request(app)
        .post(`/api/adventures/${startRes.body.adventureId}/answer`)
        .set('Cookie', buildCookies(parentId))
        .set(csrfHeader())
        .send({ answer: '4' })
        .expect(400);
    });
  });

  // ─── POST /api/adventures/:adventureId/hint ────────────────────────────────

  describe('POST /api/adventures/:adventureId/hint', () => {
    it('returns hint with hintText and hintLevel 1', async () => {
      // Start + advance to math question
      const startRes = await request(app)
        .post(`/api/adventures/children/${childId}`)
        .set('Cookie', buildCookies(parentId))
        .set(csrfHeader())
        .send({ mathTopic: 'addition', storyWorld: 'space' })
        .expect(201);

      const { adventureId } = startRes.body;

      await request(app)
        .post(`/api/adventures/${adventureId}/continue`)
        .set('Cookie', buildCookies(parentId))
        .set(csrfHeader())
        .send({ choiceIndex: 0 })
        .expect(200);

      const response = await request(app)
        .post(`/api/adventures/${adventureId}/hint`)
        .set('Cookie', buildCookies(parentId))
        .set(csrfHeader())
        .expect(200);

      expect(response.body.hintText).toBe(MOCK_HINT_RESPONSE.hintText);
      expect(response.body.hintLevel).toBe(1);

      // hintLevel should be incremented in DB
      const adventure = await Adventure.findById(adventureId);
      expect(adventure?.currentChallenge?.hintLevel).toBe(1);
      expect(adventure?.hintsUsed).toBe(1);
    });
  });

  // ─── POST /api/adventures/:adventureId/complete ────────────────────────────

  describe('POST /api/adventures/:adventureId/complete', () => {
    it('completes adventure and returns reward summary', async () => {
      const startRes = await request(app)
        .post(`/api/adventures/children/${childId}`)
        .set('Cookie', buildCookies(parentId))
        .set(csrfHeader())
        .send({ mathTopic: 'addition', storyWorld: 'space' })
        .expect(201);

      const { adventureId } = startRes.body;

      const response = await request(app)
        .post(`/api/adventures/${adventureId}/complete`)
        .set('Cookie', buildCookies(parentId))
        .set(csrfHeader())
        .expect(200);

      expect(typeof response.body.xpEarned).toBe('number');
      expect(typeof response.body.starsEarned).toBe('number');
      expect(response.body.starsEarned).toBeGreaterThanOrEqual(1);
      expect(response.body.starsEarned).toBeLessThanOrEqual(3);
      expect(typeof response.body.totalXP).toBe('number');
      expect(typeof response.body.totalStars).toBe('number');

      // Adventure should be marked completed in DB
      const adventure = await Adventure.findById(adventureId);
      expect(adventure?.status).toBe('completed');
      expect(adventure?.completedAt).toBeDefined();
    });

    it('returns 400 when adventure is already completed', async () => {
      const startRes = await request(app)
        .post(`/api/adventures/children/${childId}`)
        .set('Cookie', buildCookies(parentId))
        .set(csrfHeader())
        .send({ mathTopic: 'addition', storyWorld: 'space' })
        .expect(201);

      const { adventureId } = startRes.body;
      const cookies = buildCookies(parentId);

      // Complete once
      await request(app)
        .post(`/api/adventures/${adventureId}/complete`)
        .set('Cookie', cookies)
        .set(csrfHeader())
        .expect(200);

      // Try to complete again
      await request(app)
        .post(`/api/adventures/${adventureId}/complete`)
        .set('Cookie', cookies)
        .set(csrfHeader())
        .expect(400);
    });
  });

  // ─── Auth guard ────────────────────────────────────────────────────────────

  describe('auth guard', () => {
    it('GET without auth cookie returns 401', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await request(app)
        .get(`/api/adventures/${fakeId}`)
        .expect(401);
    });
  });

  // ─── Conversation history cap ──────────────────────────────────────────────

  describe('conversation history cap', () => {
    it('history length stays at 100 after exceeding the cap', async () => {
      const startRes = await request(app)
        .post(`/api/adventures/children/${childId}`)
        .set('Cookie', buildCookies(parentId))
        .set(csrfHeader())
        .send({ mathTopic: 'addition', storyWorld: 'space' })
        .expect(201);

      const { adventureId } = startRes.body;

      // Directly push 120 entries via the model to simulate overflow without 120 HTTP calls
      await Adventure.findByIdAndUpdate(adventureId, {
        $push: {
          conversationHistory: {
            $each: Array.from({ length: 120 }, (_, i) => ({
              role: 'wizzy',
              content: `msg ${i}`,
              timestamp: new Date(),
            })),
          },
        },
      });

      // One more continue call to trigger the cap enforcement
      await request(app)
        .post(`/api/adventures/${adventureId}/continue`)
        .set('Cookie', buildCookies(parentId))
        .set(csrfHeader())
        .send({ choiceIndex: 0 })
        .expect(200);

      // Refresh from DB and assert cap held
      const updated = await Adventure.findById(adventureId);
      expect(updated!.conversationHistory.length).toBeLessThanOrEqual(100);
    });
  });
});
