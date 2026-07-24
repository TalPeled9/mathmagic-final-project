import { api } from '../lib/api';
import type {
  IChild,
  IBadge,
  CreateChildRequest,
  UpdateChildRequest,
  GenerateAvatarRequest,
  SetActiveAvatarRequest,
} from '@mathmagic/types';

export interface TopicSummary {
  mathTopic: string;
  masteryLevel: number;
  totalChallenges: number;
  correctAnswers: number;
  accuracyPercent: number;
}

export interface ChildWithTopics extends IChild {
  topTopics: TopicSummary[];
}

export interface StatTopicStat {
  mathTopic: string;
  totalChallenges: number;
  correctAnswers: number;
  incorrectAnswers: number;
  hintsUsed: number;
  accuracyPercent: number;
  masteryLevel: number;
  currentDifficulty: 'easy' | 'medium' | 'hard';
  lastPracticedAt: string | null;
}

export interface DailySessionStat {
  date: string;
  minutes: number;
}

export interface RecentAdventure {
  adventureId: string;
  mathTopic: string;
  storyWorld: string;
  completedAt: string | null;
  xpEarned: number;
  starsEarned: number;
  totalChallenges: number;
  correctAnswers: number;
  hintsUsed: number;
  accuracyPercent: number;
}

export interface ChildStatistics {
  topics: StatTopicStat[];
  learningTime: {
    thisWeekMinutes: number;
    lastWeekMinutes: number;
    dailyBreakdown: DailySessionStat[];
  };
  levelProgress: {
    currentLevel: number;
    levelName: string;
    currentXP: number;
    currentLevelThresholdXP: number;
    xpToNextLevel: number | null;
    isMaxLevel: boolean;
  };
  badges: IBadge[];
  currentDayStreak: number;
  totalAdventuresCompleted: number;
  recentAdventures: RecentAdventure[];
}

export const childService = {
  getAll: () =>
    api.get<{ children: ChildWithTopics[] }>('/parent/children').then((r) => r.children),
  getOne: (id: string) => api.get<{ child: IChild }>(`/parent/children/${id}`).then((r) => r.child),
  create: (data: CreateChildRequest) =>
    api.post<{ child: IChild }>('/parent/children', data).then((r) => r.child),
  update: (id: string, data: UpdateChildRequest) =>
    api.put<{ child: IChild }>(`/parent/children/${id}`, data).then((r) => r.child),
  remove: (id: string) => api.delete<void>(`/parent/children/${id}`),
  generateAvatar: (id: string, data: GenerateAvatarRequest) =>
    api.post<{ child: IChild }>(`/parent/children/${id}/avatar`, data).then((r) => r.child),
  setActiveAvatar: (id: string, data: SetActiveAvatarRequest) =>
    api.patch<{ child: IChild }>(`/parent/children/${id}/avatar/active`, data).then((r) => r.child),
  getStatistics: (id: string) => api.get<ChildStatistics>(`/parent/children/${id}/statistics`),
};
