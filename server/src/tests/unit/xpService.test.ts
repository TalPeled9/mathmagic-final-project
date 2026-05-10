import { describe, it, expect } from 'vitest';
import { calculateChallengeXP, calculateCompletionXP } from '../../services/gamification/xpService';

describe('calculateChallengeXP', () => {
  describe('wrong answer', () => {
    it('returns 2 consolation XP regardless of hints or streak', () => {
      expect(calculateChallengeXP(false, false, 0)).toEqual({
        xpEarned: 2,
        breakdown: { base: 2, noHintBonus: 0, streakBonus: 0 },
      });
      expect(calculateChallengeXP(false, true, 5)).toEqual({
        xpEarned: 2,
        breakdown: { base: 2, noHintBonus: 0, streakBonus: 0 },
      });
    });
  });

  describe('correct answer — no hints', () => {
    it('awards base 10 + noHintBonus 5 when no streak', () => {
      const result = calculateChallengeXP(true, false, 1);
      expect(result.xpEarned).toBe(15);
      expect(result.breakdown).toEqual({ base: 10, noHintBonus: 5, streakBonus: 0 });
    });

    it('awards base 10 + noHintBonus 5 when streak is 2 (below threshold)', () => {
      const result = calculateChallengeXP(true, false, 2);
      expect(result.xpEarned).toBe(15);
      expect(result.breakdown.streakBonus).toBe(0);
    });

    it('awards full 25 XP when streak reaches 3', () => {
      const result = calculateChallengeXP(true, false, 3);
      expect(result.xpEarned).toBe(25);
      expect(result.breakdown).toEqual({ base: 10, noHintBonus: 5, streakBonus: 10 });
    });

    it('awards full 25 XP when streak exceeds 3', () => {
      const result = calculateChallengeXP(true, false, 7);
      expect(result.xpEarned).toBe(25);
      expect(result.breakdown.streakBonus).toBe(10);
    });
  });

  describe('correct answer — with hints', () => {
    it('awards base 10 only (no hint bonus) when hint was used, no streak', () => {
      const result = calculateChallengeXP(true, true, 1);
      expect(result.xpEarned).toBe(10);
      expect(result.breakdown).toEqual({ base: 10, noHintBonus: 0, streakBonus: 0 });
    });

    it('awards base 10 + streak 10 when hint was used but streak ≥ 3', () => {
      const result = calculateChallengeXP(true, true, 3);
      expect(result.xpEarned).toBe(20);
      expect(result.breakdown).toEqual({ base: 10, noHintBonus: 0, streakBonus: 10 });
    });
  });
});

describe('calculateCompletionXP', () => {
  it('returns 20 base when no challenges', () => {
    expect(calculateCompletionXP({ totalChallenges: 0, correctAnswers: 0, incorrectAnswers: 0, hintsUsed: 0 })).toBe(20);
  });

  it('returns 20 for 0% accuracy', () => {
    expect(calculateCompletionXP({ totalChallenges: 4, correctAnswers: 0, incorrectAnswers: 4, hintsUsed: 0 })).toBe(20);
  });

  it('returns 35 for 50% accuracy', () => {
    expect(calculateCompletionXP({ totalChallenges: 4, correctAnswers: 2, incorrectAnswers: 2, hintsUsed: 0 })).toBe(35);
  });

  it('returns 50 for 100% accuracy', () => {
    expect(calculateCompletionXP({ totalChallenges: 4, correctAnswers: 4, incorrectAnswers: 0, hintsUsed: 0 })).toBe(50);
  });
});
