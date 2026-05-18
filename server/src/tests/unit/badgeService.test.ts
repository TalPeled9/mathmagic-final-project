import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IChildDocument } from '../../models/Child';

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock('../../models/Adventure', () => ({
  Adventure: {
    distinct: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../../models/TopicProgress', () => ({
  TopicProgress: {
    findOne: vi.fn(),
  },
}));

import { checkAndAwardBadges } from '../../services/gamification/badgeService';
import { Adventure } from '../../models/Adventure';
import { TopicProgress } from '../../models/TopicProgress';

const mockDistinct = vi.mocked(Adventure.distinct);
const mockFind = vi.mocked(Adventure.find);
const mockFindOne = vi.mocked(TopicProgress.findOne);

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeChild(overrides: Partial<IChildDocument> = {}): IChildDocument {
  return {
    _id: 'child-1',
    badges: [],
    consecutiveHintFreeAdventures: 0,
    ...overrides,
  } as unknown as IChildDocument;
}

const baseStats = {
  totalChallenges: 3,
  correctAnswers: 3,
  incorrectAnswers: 0,
  hintsUsed: 0,
};

const baseContext = {
  currentStoryWorld: 'space',
  adventureDurationMinutes: 8,
  totalCompletedAdventures: 1,
  consecutiveHintFreeAdventures: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no distinct worlds, no mastered topics, no prior adventures
  mockDistinct.mockResolvedValue([]);
  // Adventure.find() is called with .lean() chaining (for computeDayStreak)
  mockFind.mockReturnValue({ lean: () => Promise.resolve([]) } as never);
  // TopicProgress.findOne() is called with .lean() chaining
  mockFindOne.mockReturnValue({ lean: () => Promise.resolve(null) } as never);
});

// ── Badge condition tests ─────────────────────────────────────────────────────

describe('checkAndAwardBadges', () => {
  describe('first-adventure', () => {
    it('awards badge when totalCompletedAdventures is 1', async () => {
      const child = makeChild();
      const badges = await checkAndAwardBadges(child, baseStats, {
        ...baseContext,
        totalCompletedAdventures: 1,
      });
      expect(badges.some((b) => b.badgeType === 'first-adventure')).toBe(true);
    });

    it('does NOT re-award if already owned', async () => {
      const child = makeChild({
        badges: [
          {
            badgeType: 'first-adventure',
            badgeName: 'First Adventure',
            description: '',
            iconUrl: '',
            earnedAt: new Date(),
          },
        ] as never,
      });
      const badges = await checkAndAwardBadges(child, baseStats, baseContext);
      expect(badges.some((b) => b.badgeType === 'first-adventure')).toBe(false);
    });

    it('does NOT award when totalCompletedAdventures is 0', async () => {
      const child = makeChild();
      const badges = await checkAndAwardBadges(child, baseStats, {
        ...baseContext,
        totalCompletedAdventures: 0,
      });
      expect(badges.some((b) => b.badgeType === 'first-adventure')).toBe(false);
    });
  });

  describe('perfect-score', () => {
    it('awards badge for 100% accuracy with 0 hints', async () => {
      const child = makeChild();
      const badges = await checkAndAwardBadges(child, { ...baseStats, hintsUsed: 0 }, baseContext);
      expect(badges.some((b) => b.badgeType === 'perfect-score')).toBe(true);
    });

    it('does NOT award when hints were used', async () => {
      const child = makeChild();
      const badges = await checkAndAwardBadges(child, { ...baseStats, hintsUsed: 1 }, baseContext);
      expect(badges.some((b) => b.badgeType === 'perfect-score')).toBe(false);
    });

    it('does NOT award when not all correct', async () => {
      const child = makeChild();
      const badges = await checkAndAwardBadges(
        child,
        { ...baseStats, correctAnswers: 2, incorrectAnswers: 1 },
        baseContext
      );
      expect(badges.some((b) => b.badgeType === 'perfect-score')).toBe(false);
    });
  });

  describe('speed-master', () => {
    it('awards badge when 0 incorrect and 0 hints', async () => {
      const child = makeChild();
      const badges = await checkAndAwardBadges(
        child,
        { ...baseStats, incorrectAnswers: 0, hintsUsed: 0 },
        baseContext
      );
      expect(badges.some((b) => b.badgeType === 'speed-master')).toBe(true);
    });

    it('does NOT award when there were wrong attempts', async () => {
      const child = makeChild();
      const badges = await checkAndAwardBadges(
        child,
        { ...baseStats, incorrectAnswers: 1 },
        baseContext
      );
      expect(badges.some((b) => b.badgeType === 'speed-master')).toBe(false);
    });
  });

  describe('explorer', () => {
    it('awards badge when 3 distinct worlds (including current)', async () => {
      mockDistinct.mockResolvedValue(['fantasy', 'ocean']);
      const child = makeChild();
      const badges = await checkAndAwardBadges(child, baseStats, {
        ...baseContext,
        currentStoryWorld: 'space',
      });
      expect(badges.some((b) => b.badgeType === 'explorer')).toBe(true);
    });

    it('does NOT award when only 2 distinct worlds', async () => {
      mockDistinct.mockResolvedValue(['fantasy']);
      const child = makeChild();
      const badges = await checkAndAwardBadges(child, baseStats, {
        ...baseContext,
        currentStoryWorld: 'space',
      });
      expect(badges.some((b) => b.badgeType === 'explorer')).toBe(false);
    });
  });

  describe('topic-master', () => {
    it('awards badge when a topic has 80%+ mastery and 5+ challenges', async () => {
      mockFindOne.mockReturnValue({
        lean: () => Promise.resolve({ masteryLevel: 85, totalChallenges: 6 }),
      } as never);
      const child = makeChild();
      const badges = await checkAndAwardBadges(child, baseStats, baseContext);
      expect(badges.some((b) => b.badgeType === 'topic-master')).toBe(true);
    });

    it('does NOT award when no topic meets threshold', async () => {
      mockFindOne.mockReturnValue({ lean: () => Promise.resolve(null) } as never);
      const child = makeChild();
      const badges = await checkAndAwardBadges(child, baseStats, baseContext);
      expect(badges.some((b) => b.badgeType === 'topic-master')).toBe(false);
    });
  });

  describe('math-veteran', () => {
    it('awards badge at 25 completed adventures', async () => {
      const child = makeChild();
      const badges = await checkAndAwardBadges(child, baseStats, {
        ...baseContext,
        totalCompletedAdventures: 25,
      });
      expect(badges.some((b) => b.badgeType === 'math-veteran')).toBe(true);
    });

    it('does NOT award at 24 adventures', async () => {
      const child = makeChild();
      const badges = await checkAndAwardBadges(child, baseStats, {
        ...baseContext,
        totalCompletedAdventures: 24,
      });
      expect(badges.some((b) => b.badgeType === 'math-veteran')).toBe(false);
    });
  });

  describe('world-conqueror', () => {
    it('awards badge when all 10 worlds completed', async () => {
      mockDistinct.mockResolvedValue([
        'fantasy',
        'ocean',
        'jungle',
        'pirates',
        'robots',
        'candy',
        'magic-school',
        'ancient-temple',
        'dinosaur',
      ]);
      const child = makeChild();
      const badges = await checkAndAwardBadges(child, baseStats, {
        ...baseContext,
        currentStoryWorld: 'space',
      });
      expect(badges.some((b) => b.badgeType === 'world-conqueror')).toBe(true);
    });

    it('does NOT award when only 9 worlds', async () => {
      mockDistinct.mockResolvedValue([
        'fantasy',
        'ocean',
        'jungle',
        'pirates',
        'robots',
        'candy',
        'magic-school',
        'ancient-temple',
      ]);
      const child = makeChild();
      const badges = await checkAndAwardBadges(child, baseStats, {
        ...baseContext,
        currentStoryWorld: 'space',
      });
      expect(badges.some((b) => b.badgeType === 'world-conqueror')).toBe(false);
    });
  });

  describe('hint-free-run', () => {
    it('awards badge at 3 consecutive hint-free adventures', async () => {
      const child = makeChild();
      const badges = await checkAndAwardBadges(child, baseStats, {
        ...baseContext,
        consecutiveHintFreeAdventures: 3,
      });
      expect(badges.some((b) => b.badgeType === 'hint-free-run')).toBe(true);
    });

    it('does NOT award at 2 consecutive', async () => {
      const child = makeChild();
      const badges = await checkAndAwardBadges(child, baseStats, {
        ...baseContext,
        consecutiveHintFreeAdventures: 2,
      });
      expect(badges.some((b) => b.badgeType === 'hint-free-run')).toBe(false);
    });
  });

  describe('multiple badges in one call', () => {
    it('can award first-adventure, perfect-score, and speed-master simultaneously', async () => {
      const child = makeChild();
      const stats = { totalChallenges: 3, correctAnswers: 3, incorrectAnswers: 0, hintsUsed: 0 };
      const badges = await checkAndAwardBadges(child, stats, {
        ...baseContext,
        totalCompletedAdventures: 1,
      });

      const types = badges.map((b) => b.badgeType);
      expect(types).toContain('first-adventure');
      expect(types).toContain('perfect-score');
      expect(types).toContain('speed-master');
      // All pushed onto child.badges
      expect((child.badges as unknown[]).length).toBe(badges.length);
    });
  });

  describe('no re-award', () => {
    it('skips badge if already in child.badges', async () => {
      const child = makeChild({
        badges: [
          {
            badgeType: 'perfect-score',
            badgeName: 'Perfect Score',
            description: '',
            iconUrl: '',
            earnedAt: new Date(),
          },
        ] as never,
      });
      const stats = { totalChallenges: 3, correctAnswers: 3, incorrectAnswers: 0, hintsUsed: 0 };
      const badges = await checkAndAwardBadges(child, stats, baseContext);
      expect(badges.some((b) => b.badgeType === 'perfect-score')).toBe(false);
    });
  });

  describe('badge shape', () => {
    it('returned badges have required IBadge fields', async () => {
      const child = makeChild();
      const badges = await checkAndAwardBadges(child, baseStats, {
        ...baseContext,
        totalCompletedAdventures: 1,
      });
      for (const badge of badges) {
        expect(badge).toHaveProperty('badgeType');
        expect(badge).toHaveProperty('badgeName');
        expect(badge).toHaveProperty('description');
        expect(badge).toHaveProperty('iconUrl');
        expect(badge).toHaveProperty('earnedAt');
        expect(typeof badge.earnedAt).toBe('string'); // ISO string
      }
    });
  });
});
