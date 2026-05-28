export type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface IBadge {
  badgeType: string;
  badgeName: string;
  description: string;
  iconUrl: string;
  earnedAt: string;
}

export interface AvatarSlot {
  imageData: string;    // base64 data URL
  description: string;  // corrected description used to generate this avatar
  createdAt: string;    // ISO date string
}

export interface IChild {
  _id: string;
  parentId: string;
  name: string;
  gradeLevel: GradeLevel;
  avatars: AvatarSlot[];
  activeAvatarIndex: number;
  weeklyGenerationsRemaining: number;     // 0–3
  weeklyGenerationsDaysUntilReset: number; // 0 when quota not exhausted
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
}

export interface UpdateChildRequest {
  name?: string;
  gradeLevel?: GradeLevel;
}

export interface GenerateAvatarRequest {
  description: string;
  replaceIndex?: number; // required when all 3 slots are filled
}

export interface SetActiveAvatarRequest {
  avatarIndex: number;
}

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

export interface DailySessionStat {
  date: string;
  minutes: number;
}
