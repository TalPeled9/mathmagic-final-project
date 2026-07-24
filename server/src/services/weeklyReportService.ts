import { Types } from 'mongoose';
import User, { IUser } from '../models/User';
import { Child, IChildDocument } from '../models/Child';
import { Adventure } from '../models/Adventure';
import { TopicProgress } from '../models/TopicProgress';
import { getMinutesInRange, getCurrentDayStreak } from './gamification/sessionService';
import { getWeekStart } from './adventureService';
import { getLevelForXP, LEVEL_THRESHOLDS } from '../config/levelThresholds';
import { resolveBadges } from './gamification/badgeService';
import { getCurriculumTopicById } from '../config/curriculumTopics';

export interface WeeklyAdventureSummary {
  adventureId: string;
  mathTopic: string;
  topicName: string;
  storyWorld: string;
  completedAt: Date;
  xpEarned: number;
  starsEarned: number;
  accuracyPercent: number;
}

export interface WeeklyBadgeSummary {
  badgeType: string;
  badgeName: string;
  earnedAt: string;
}

export interface WeeklyTopicSummary {
  mathTopic: string;
  topicName: string;
  icon: string;
  masteryLevel: number;
}

export interface ChildWeekStats {
  childId: string;
  childName: string;
  avatarImageData: string | null;
  gradeLevel: number;
  levelInfo: {
    level: number;
    name: string;
    currentXP: number;
    currentLevelThresholdXP: number;
    xpToNext: number | null;
    isMaxLevel: boolean;
  };
  xpEarnedThisWeek: number;
  starsEarnedThisWeek: number;
  adventuresCompletedThisWeek: number;
  minutesThisWeek: number;
  minutesLastWeek: number;
  currentDayStreak: number;
  newBadgesThisWeek: WeeklyBadgeSummary[];
  topicsThisWeek: WeeklyTopicSummary[];
  recentAdventures: WeeklyAdventureSummary[];
  hasActivity: boolean;
}

export interface ParentWeekReport {
  parent: { id: string; name: string; email: string };
  weekStart: Date;
  weekEnd: Date;
  children: ChildWeekStats[];
  hasAnyActivity: boolean;
}

const MAX_RECENT_ADVENTURES = 5;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Returns the [weekStart, weekEnd) window for the last FULL calendar week
 * (Mon-Sun, UTC) relative to referenceDate. Used by the automated cron send.
 */
export function getReportWeekRange(referenceDate = new Date()): { weekStart: Date; weekEnd: Date } {
  const weekEnd = getWeekStart(referenceDate);
  const weekStart = new Date(weekEnd.getTime() - MS_PER_WEEK);
  return { weekStart, weekEnd };
}

export async function getChildWeekStats(
  child: IChildDocument,
  weekStart: Date,
  weekEnd: Date
): Promise<ChildWeekStats> {
  const childId = String(child._id);
  const previousWeekStart = new Date(weekStart.getTime() - MS_PER_WEEK);

  const [adventuresThisWeek, minutesThisWeek, minutesLastWeek, currentDayStreak] = await Promise.all([
    Adventure.find({
      childId: new Types.ObjectId(childId),
      status: 'completed',
      completedAt: { $gte: weekStart, $lt: weekEnd },
    })
      .sort({ completedAt: -1 })
      .lean(),
    getMinutesInRange(childId, weekStart, weekEnd),
    getMinutesInRange(childId, previousWeekStart, weekStart),
    getCurrentDayStreak(childId),
  ]);

  const xpEarnedThisWeek = adventuresThisWeek.reduce((sum, a) => sum + (a.xpEarned ?? 0), 0);
  const starsEarnedThisWeek = adventuresThisWeek.reduce((sum, a) => sum + (a.starsEarned ?? 0), 0);

  const topicsTouched = [...new Set(adventuresThisWeek.map((a) => a.mathTopic))];
  const topicProgressDocs = topicsTouched.length
    ? await TopicProgress.find({ childId: new Types.ObjectId(childId), mathTopic: { $in: topicsTouched } }).lean()
    : [];
  const masteryByTopic = new Map(topicProgressDocs.map((t) => [t.mathTopic, t.masteryLevel]));
  const topicsThisWeek: WeeklyTopicSummary[] = topicsTouched.map((mathTopic) => {
    const topicConfig = getCurriculumTopicById(mathTopic);
    return {
      mathTopic,
      topicName: topicConfig?.name ?? mathTopic,
      icon: topicConfig?.icon ?? '📘',
      masteryLevel: masteryByTopic.get(mathTopic) ?? 0,
    };
  });

  const newBadgesThisWeek: WeeklyBadgeSummary[] = resolveBadges(
    child.badges.filter((b) => b.earnedAt >= weekStart && b.earnedAt < weekEnd)
  ).map((b) => ({
    badgeType: b.badgeType,
    badgeName: b.badgeName,
    earnedAt: b.earnedAt,
  }));

  const recentAdventures: WeeklyAdventureSummary[] = adventuresThisWeek
    .slice(0, MAX_RECENT_ADVENTURES)
    .map((a) => ({
      adventureId: String(a._id),
      mathTopic: a.mathTopic,
      topicName: getCurriculumTopicById(a.mathTopic)?.name ?? a.mathTopic,
      storyWorld: a.storyWorld,
      completedAt: a.completedAt as Date,
      xpEarned: a.xpEarned,
      starsEarned: a.starsEarned,
      accuracyPercent:
        a.totalChallenges > 0 ? Math.round((a.correctAnswers / a.totalChallenges) * 100) : 0,
    }));

  const levelInfo = getLevelForXP(child.totalXP);
  const currentLevelThresholdXP = LEVEL_THRESHOLDS[levelInfo.level - 1];

  return {
    childId,
    childName: child.name,
    avatarImageData: child.avatars[child.activeAvatarIndex]?.imageData || null,
    gradeLevel: child.gradeLevel,
    levelInfo: {
      level: levelInfo.level,
      name: levelInfo.name,
      currentXP: child.totalXP,
      currentLevelThresholdXP,
      xpToNext: levelInfo.xpToNext,
      isMaxLevel: levelInfo.xpToNext === null,
    },
    xpEarnedThisWeek,
    starsEarnedThisWeek,
    adventuresCompletedThisWeek: adventuresThisWeek.length,
    minutesThisWeek,
    minutesLastWeek,
    currentDayStreak,
    newBadgesThisWeek,
    topicsThisWeek,
    recentAdventures,
    hasActivity: adventuresThisWeek.length > 0 || minutesThisWeek > 0,
  };
}

export async function getParentWeekReport(
  parentId: string,
  range?: { weekStart: Date; weekEnd: Date }
): Promise<ParentWeekReport | null> {
  const { weekStart, weekEnd } = range ?? getReportWeekRange();

  const [parent, children] = await Promise.all([
    User.findById(parentId).lean<IUser>(),
    Child.find({ parentId: new Types.ObjectId(parentId) }),
  ]);

  if (!parent) return null;

  const childStats = await Promise.all(
    children.map((child) => getChildWeekStats(child, weekStart, weekEnd))
  );

  return {
    parent: { id: String(parent._id), name: parent.name, email: parent.email },
    weekStart,
    weekEnd,
    children: childStats,
    hasAnyActivity: childStats.some((c) => c.hasActivity),
  };
}
