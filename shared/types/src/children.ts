export type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface IBadge {
  badgeType: string;
  badgeName: string;
  description: string;
  iconUrl: string;
  earnedAt: string;
}

export interface IChild {
  _id: string;
  parentId: string;
  name: string;
  gradeLevel: GradeLevel;
  avatarUrl?: string;
  currentLevel: number;
  totalXP: number;
  totalStars: number;
  unlockedWorlds: string[];
  badges: IBadge[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateChildRequest {
  name: string;
  gradeLevel: GradeLevel;
  avatarDescription?: string;
}

export interface UpdateChildRequest {
  name?: string;
  gradeLevel?: GradeLevel;
}

/** Enriched topic progress record used in statistics endpoints */
export interface TopicStat {
  mathTopic: string;
  name: string;
  icon: string;
  color: string;
  totalChallenges: number;
  correctAnswers: number;
  incorrectAnswers: number;
  hintsUsed: number;
  masteryLevel: number; // 0–100
  currentDifficulty: 'easy' | 'medium' | 'hard';
  lastPracticedAt?: string;
}

/** Single day entry for learning-time charts */
export interface DailySessionStat {
  date: string; // ISO date string (YYYY-MM-DD)
  minutes: number;
}
