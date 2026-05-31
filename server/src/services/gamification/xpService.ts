import type { XPBreakdown } from '@mathmagic/types';

export interface XPResult {
  xpEarned: number;
  breakdown: XPBreakdown;
}

export interface AdventureStats {
  totalChallenges: number;
  correctAnswers: number;
  incorrectAnswers: number;
  hintsUsed: number;
}

/**
 * XP awarded when a child answers a challenge.
 *
 * @param correct - Whether the answer was correct
 * @param hintUsed - Whether any hint was used on this challenge
 * @param consecutiveCorrectAfterAnswer - The updated streak count AFTER this answer
 *   (i.e. adventure.consecutiveCorrect after incrementing for a correct answer)
 */
export function calculateChallengeXP(
  correct: boolean,
  hintUsed: boolean,
  consecutiveCorrectAfterAnswer: number
): XPResult {
  if (!correct) {
    return { xpEarned: 2, breakdown: { base: 2, noHintBonus: 0, streakBonus: 0 } };
  }

  const base = 10;
  const noHintBonus = hintUsed ? 0 : 5;
  const streakBonus = consecutiveCorrectAfterAnswer >= 3 ? 10 : 0;
  const xpEarned = base + noHintBonus + streakBonus;

  return { xpEarned, breakdown: { base, noHintBonus, streakBonus } };
}

/**
 * Bonus XP awarded when the full adventure is completed.
 * Separate from per-challenge XP — rewards the act of finishing.
 *
 * Formula: 20 base + up to 30 accuracy bonus
 * Examples: 0% accuracy → 20 XP | 50% → 35 XP | 100% → 50 XP
 */
export function calculateCompletionXP(stats: AdventureStats): number {
  if (stats.totalChallenges === 0) return 20;
  const accuracy = stats.correctAnswers / stats.totalChallenges;
  return 20 + Math.round(accuracy * 30);
}
