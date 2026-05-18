import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock TopicProgress model before importing service ──────────────────────
vi.mock('../../models/TopicProgress', () => ({
  TopicProgress: {
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn(),
    find: vi.fn(),
  },
}));

// ── Mock CURRICULUM_TOPICS config ───────────────────────────────────────────
vi.mock('../../config/curriculumTopics', () => ({
  CURRICULUM_TOPICS: [
    {
      id: 'g2_addition_subtraction',
      name: 'Addition & Subtraction up to 1,000',
      icon: 'Plus',
      grade: 2,
      description: 'Adding and subtracting',
      color: 'from-emerald-400 to-teal-500',
      difficulty: {
        easy: 'No regrouping',
        medium: 'With regrouping',
        hard: 'Two steps',
      },
    },
  ],
}));

import {
  updateTopicMastery,
  getTopicStats,
  updateTopicDifficulty,
} from '../../services/gamification/masteryService';
import { TopicProgress } from '../../models/TopicProgress';

const mockFindOneAndUpdate = vi.mocked(TopicProgress.findOneAndUpdate);
const mockUpdateOne = vi.mocked(TopicProgress.updateOne);
const mockFind = vi.mocked(TopicProgress.find);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('updateTopicMastery', () => {
  it('calls findOneAndUpdate with correct inc for a correct, hint-free answer', async () => {
    const fakeDoc = { _id: 'doc1', totalChallenges: 5, correctAnswers: 5, hintsUsed: 0 };
    mockFindOneAndUpdate.mockResolvedValue(fakeDoc as never);
    mockUpdateOne.mockResolvedValue({} as never);

    await updateTopicMastery('child1', 'g2_addition_subtraction', true, false);

    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { childId: 'child1', mathTopic: 'g2_addition_subtraction' },
      expect.objectContaining({
        $inc: expect.objectContaining({ totalChallenges: 1, correctAnswers: 1 }),
      }),
      expect.any(Object)
    );
  });

  it('increments incorrectAnswers and hintsUsed on wrong+hint answer', async () => {
    const fakeDoc = { _id: 'doc1', totalChallenges: 3, correctAnswers: 1, hintsUsed: 2 };
    mockFindOneAndUpdate.mockResolvedValue(fakeDoc as never);
    mockUpdateOne.mockResolvedValue({} as never);

    await updateTopicMastery('child1', 'g2_addition_subtraction', false, true);

    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        $inc: expect.objectContaining({ incorrectAnswers: 1, hintsUsed: 1 }),
      }),
      expect.any(Object)
    );
  });

  describe('mastery formula: max(0, floor((correct/total)*100 - hintsUsed*5))', () => {
    it('computes 100% mastery when all correct with no hints', async () => {
      const fakeDoc = { _id: 'doc1', totalChallenges: 4, correctAnswers: 4, hintsUsed: 0 };
      mockFindOneAndUpdate.mockResolvedValue(fakeDoc as never);
      mockUpdateOne.mockResolvedValue({} as never);

      await updateTopicMastery('child1', 'g2_addition_subtraction', true, false);

      expect(mockUpdateOne).toHaveBeenCalledWith({ _id: 'doc1' }, { $set: { masteryLevel: 100 } });
    });

    it('applies hint penalty: 5 pts per hint', async () => {
      // 4/4 correct but 4 hints → floor(100 - 20) = 80
      const fakeDoc = { _id: 'doc1', totalChallenges: 4, correctAnswers: 4, hintsUsed: 4 };
      mockFindOneAndUpdate.mockResolvedValue(fakeDoc as never);
      mockUpdateOne.mockResolvedValue({} as never);

      await updateTopicMastery('child1', 'g2_addition_subtraction', true, false);

      expect(mockUpdateOne).toHaveBeenCalledWith({ _id: 'doc1' }, { $set: { masteryLevel: 80 } });
    });

    it('floors mastery at 0 (never negative)', async () => {
      // 1/10 correct, 20 hints → floor(10 - 100) = clamp to 0
      const fakeDoc = { _id: 'doc1', totalChallenges: 10, correctAnswers: 1, hintsUsed: 20 };
      mockFindOneAndUpdate.mockResolvedValue(fakeDoc as never);
      mockUpdateOne.mockResolvedValue({} as never);

      await updateTopicMastery('child1', 'g2_addition_subtraction', false, false);

      expect(mockUpdateOne).toHaveBeenCalledWith({ _id: 'doc1' }, { $set: { masteryLevel: 0 } });
    });

    it('floors mastery result (no rounding up)', async () => {
      // 3/4 correct, 1 hint → floor(75 - 5) = 70
      const fakeDoc = { _id: 'doc1', totalChallenges: 4, correctAnswers: 3, hintsUsed: 1 };
      mockFindOneAndUpdate.mockResolvedValue(fakeDoc as never);
      mockUpdateOne.mockResolvedValue({} as never);

      await updateTopicMastery('child1', 'g2_addition_subtraction', true, true);

      expect(mockUpdateOne).toHaveBeenCalledWith({ _id: 'doc1' }, { $set: { masteryLevel: 70 } });
    });
  });
});

describe('updateTopicDifficulty', () => {
  it('calls updateOne with the correct filter and $set', async () => {
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 } as never);
    await updateTopicDifficulty('child1', 'g2_addition_subtraction', 'hard');
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { childId: 'child1', mathTopic: 'g2_addition_subtraction' },
      { $set: { currentDifficulty: 'hard' } },
      { upsert: true }
    );
  });

  it('resolves without returning a value', async () => {
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 } as never);
    const result = await updateTopicDifficulty('child1', 'g2_addition_subtraction', 'medium');
    expect(result).toBeUndefined();
  });
});

describe('getTopicStats', () => {
  it('enriches docs with name/icon/color from curriculum config', async () => {
    const fakeDocs = [
      {
        mathTopic: 'g2_addition_subtraction',
        totalChallenges: 5,
        correctAnswers: 4,
        incorrectAnswers: 1,
        hintsUsed: 1,
        masteryLevel: 75,
        currentDifficulty: 'medium',
        lastPracticedAt: new Date('2026-05-01'),
      },
    ];
    mockFind.mockReturnValue({ lean: () => Promise.resolve(fakeDocs) } as never);

    const stats = await getTopicStats('child1');

    expect(stats).toHaveLength(1);
    expect(stats[0]).toMatchObject({
      mathTopic: 'g2_addition_subtraction',
      name: 'Addition & Subtraction up to 1,000',
      icon: 'Plus',
      color: 'from-emerald-400 to-teal-500',
      masteryLevel: 75,
      currentDifficulty: 'medium',
    });
  });

  it('defaults currentDifficulty to easy for docs without it', async () => {
    const fakeDocs = [
      {
        mathTopic: 'g2_addition_subtraction',
        totalChallenges: 2,
        correctAnswers: 1,
        incorrectAnswers: 1,
        hintsUsed: 0,
        masteryLevel: 50,
        // no currentDifficulty field
      },
    ];
    mockFind.mockReturnValue({ lean: () => Promise.resolve(fakeDocs) } as never);

    const stats = await getTopicStats('child1');
    expect(stats[0].currentDifficulty).toBe('easy');
  });

  it('uses fallback name/icon/color for unknown topics', async () => {
    const fakeDocs = [
      {
        mathTopic: 'unknown-topic',
        totalChallenges: 2,
        correctAnswers: 1,
        incorrectAnswers: 1,
        hintsUsed: 0,
        masteryLevel: 50,
        currentDifficulty: 'easy',
      },
    ];
    mockFind.mockReturnValue({ lean: () => Promise.resolve(fakeDocs) } as never);

    const stats = await getTopicStats('child1');
    expect(stats[0].name).toBe('unknown-topic');
    expect(stats[0].icon).toBe('BookOpen');
    expect(stats[0].color).toBe('from-gray-400 to-gray-500');
  });
});
