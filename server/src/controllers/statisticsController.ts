import { Request, Response } from 'express';
import { Child } from '../models/Child';
import { TopicProgress } from '../models/TopicProgress';
import { Adventure } from '../models/Adventure';
import { ApiError } from '../utils/ApiError';
import {
  getDailySessionBreakdown,
  getCurrentDayStreak,
} from '../services/gamification/sessionService';
import { resolveBadges } from '../services/gamification/badgeService';
import { getLevelForXP, LEVEL_THRESHOLDS } from '../config/levelThresholds';

export async function getChildStatistics(req: Request, res: Response): Promise<void> {
  const parentId = req.user!.userId;
  const childId = req.params.childId as string;

  const child = await Child.findOne({ _id: childId, parentId }).lean();
  if (!child) throw ApiError.notFound('Child not found');

  const [topics, dailyBreakdown14, recentAdventures, totalAdventuresCompleted, currentDayStreak] =
    await Promise.all([
      TopicProgress.find({ childId }).lean(),
      getDailySessionBreakdown(childId, 14),
      Adventure.find({ childId, status: 'completed' })
        .sort({ completedAt: -1 })
        .limit(10)
        .select(
          'mathTopic storyWorld completedAt xpEarned starsEarned totalChallenges correctAnswers hintsUsed'
        )
        .lean(),
      Adventure.countDocuments({ childId, status: 'completed' }),
      getCurrentDayStreak(childId),
    ]);

  // Split 14-day breakdown: first 7 = last week, last 7 = this week
  const lastWeekDays = dailyBreakdown14.slice(0, 7);
  const thisWeekDays = dailyBreakdown14.slice(7);
  const thisWeekMinutes = thisWeekDays.reduce((sum, d) => sum + d.minutes, 0);
  const lastWeekMinutes = lastWeekDays.reduce((sum, d) => sum + d.minutes, 0);

  // Level progress
  const levelInfo = getLevelForXP(child.totalXP);
  const currentLevelThresholdXP = LEVEL_THRESHOLDS[levelInfo.level - 1];

  res.json({
    topics: topics.map((t) => ({
      mathTopic: t.mathTopic,
      totalChallenges: t.totalChallenges,
      correctAnswers: t.correctAnswers,
      incorrectAnswers: t.incorrectAnswers,
      hintsUsed: t.hintsUsed,
      accuracyPercent:
        (t.correctAnswers + t.incorrectAnswers) > 0
          ? Math.round((t.correctAnswers / (t.correctAnswers + t.incorrectAnswers)) * 100)
          : 0,
      masteryLevel: t.masteryLevel,
      currentDifficulty: t.currentDifficulty,
      lastPracticedAt: t.lastPracticedAt ?? null,
    })),
    learningTime: {
      thisWeekMinutes,
      lastWeekMinutes,
      dailyBreakdown: dailyBreakdown14,
    },
    levelProgress: {
      currentLevel: levelInfo.level,
      levelName: levelInfo.name,
      currentXP: child.totalXP,
      currentLevelThresholdXP,
      xpToNextLevel: levelInfo.xpToNext,
      isMaxLevel: levelInfo.xpToNext === null,
    },
    badges: resolveBadges(child.badges),
    currentDayStreak,
    totalAdventuresCompleted,
    recentAdventures: recentAdventures.map((a) => ({
      adventureId: a._id,
      mathTopic: a.mathTopic,
      storyWorld: a.storyWorld,
      completedAt: a.completedAt ?? null,
      xpEarned: a.xpEarned,
      starsEarned: a.starsEarned,
      totalChallenges: a.totalChallenges,
      correctAnswers: a.correctAnswers,
      hintsUsed: a.hintsUsed,
      accuracyPercent:
        a.totalChallenges > 0 ? Math.round((a.correctAnswers / a.totalChallenges) * 100) : 0,
    })),
  });
}
