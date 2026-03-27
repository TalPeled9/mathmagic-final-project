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

