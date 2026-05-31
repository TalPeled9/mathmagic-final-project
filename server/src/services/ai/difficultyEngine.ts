export type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];
const STREAK_THRESHOLD = 2;

export function scoreChallenge(
  correct: boolean,
  attemptNumber: number,
  hintUsed: boolean,
): 0 | 1 | 2 {
  if (!correct) return 0;
  if (attemptNumber === 1 && !hintUsed) return 2;
  return 1;
}

export function adjustDifficulty(
  current: Difficulty,
  recentScores: number[],
): Difficulty {
  const last = recentScores.slice(-STREAK_THRESHOLD);
  if (last.length === STREAK_THRESHOLD && last.every((s) => s === 2)) {
    return bumpUp(current);
  }
  if (last.length === STREAK_THRESHOLD && last.every((s) => s === 0)) {
    return bumpDown(current);
  }
  return current;
}

function bumpUp(d: Difficulty): Difficulty {
  const idx = DIFFICULTY_ORDER.indexOf(d);
  return DIFFICULTY_ORDER[Math.min(idx + 1, DIFFICULTY_ORDER.length - 1)];
}

function bumpDown(d: Difficulty): Difficulty {
  const idx = DIFFICULTY_ORDER.indexOf(d);
  return DIFFICULTY_ORDER[Math.max(idx - 1, 0)];
}
