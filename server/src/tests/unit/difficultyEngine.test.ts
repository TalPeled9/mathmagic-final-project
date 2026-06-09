import { describe, it, expect } from 'vitest';
import {
  scoreChallenge,
  adjustDifficulty,
  type Difficulty,
} from '../../services/ai/difficultyEngine';

describe('scoreChallenge', () => {
  it('returns 2 for first try with no hint', () => {
    expect(scoreChallenge(true, 1, false)).toBe(2);
  });

  it('returns 1 for first try with a hint', () => {
    expect(scoreChallenge(true, 1, true)).toBe(1);
  });

  it('returns 1 for second try with no hint', () => {
    expect(scoreChallenge(true, 2, false)).toBe(1);
  });

  it('returns 1 for second try with a hint', () => {
    expect(scoreChallenge(true, 2, true)).toBe(1);
  });

  it('returns 0 when not correct (3-attempt exhaustion)', () => {
    expect(scoreChallenge(false, 3, false)).toBe(0);
  });

  it('returns 0 when not correct even if hint was used', () => {
    expect(scoreChallenge(false, 3, true)).toBe(0);
  });
});

describe('adjustDifficulty', () => {
  it('bumps up from easy to medium after 2 consecutive score-2s', () => {
    expect(adjustDifficulty('easy', [2, 2])).toBe('medium');
  });

  it('bumps up from medium to hard after 2 consecutive score-2s', () => {
    expect(adjustDifficulty('medium', [2, 2])).toBe('hard');
  });

  it('stays at hard (does not exceed) after 2 consecutive score-2s', () => {
    expect(adjustDifficulty('hard', [2, 2])).toBe('hard');
  });

  it('bumps down from hard to medium after 2 consecutive score-0s', () => {
    expect(adjustDifficulty('hard', [0, 0])).toBe('medium');
  });

  it('bumps down from medium to easy after 2 consecutive score-0s', () => {
    expect(adjustDifficulty('medium', [0, 0])).toBe('easy');
  });

  it('stays at easy (does not go below) after 2 consecutive score-0s', () => {
    expect(adjustDifficulty('easy', [0, 0])).toBe('easy');
  });

  it('holds steady on mixed scores [2, 0]', () => {
    expect(adjustDifficulty('medium', [2, 0])).toBe('medium');
  });

  it('holds steady on mixed scores [0, 2]', () => {
    expect(adjustDifficulty('medium', [0, 2])).toBe('medium');
  });

  it('holds steady on [1, 1] (medium scores)', () => {
    expect(adjustDifficulty('medium', [1, 1])).toBe('medium');
  });

  it('ignores all scores before the last 2 — [2, 2, 0, 0] bumps down', () => {
    expect(adjustDifficulty('medium', [2, 2, 0, 0])).toBe('easy');
  });

  it('does not trigger on only 1 score (not enough history)', () => {
    expect(adjustDifficulty('easy', [2])).toBe('easy');
  });

  it('does not trigger on empty scores', () => {
    expect(adjustDifficulty('medium', [])).toBe('medium');
  });
});
