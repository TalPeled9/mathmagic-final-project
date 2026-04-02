export const LEVEL_THRESHOLDS: readonly number[] = [
  0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000,
];

export const LEVEL_NAMES: readonly string[] = [
  'Beginner',
  'Math Explorer',
  'Number Wizard',
  'Problem Solver',
  'Equation Master',
  'Logic Hero',
  'Calculation Champion',
  'Formula Genius',
  'Math Legend',
  'Grand Wizard',
];

export interface LevelInfo {
  level: number;
  name: string;
  xpToNext: number | null;
}

export function getLevelForXP(totalXP: number): LevelInfo {
  let level = 1;

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }

  const isMaxLevel = level === LEVEL_THRESHOLDS.length;
  const xpToNext = isMaxLevel ? null : LEVEL_THRESHOLDS[level] - totalXP;

  return {
    level,
    name: LEVEL_NAMES[level - 1],
    xpToNext,
  };
}
