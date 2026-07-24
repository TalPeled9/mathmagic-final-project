import type { IBadge } from '@mathmagic/types';
import { Adventure } from '../../models/Adventure';
import { TopicProgress } from '../../models/TopicProgress';
import { BADGE_DEFINITIONS } from '../../config/badges';
import type { IChildDocument } from '../../models/Child';
import type { AdventureStats } from './xpService';
import { logger } from '../../lib/logger';

export interface BadgeContext {
  currentStoryWorld: string;
  adventureDurationMinutes: number;
  totalCompletedAdventures: number;
  consecutiveHintFreeAdventures: number;
}

/**
 * Checks all badge conditions against the current adventure result and the
 * child's cumulative history. Awards ALL newly earned badges (no artificial
 * one-per-adventure limit).
 *
 * Mutates `child.badges` — caller must still call `child.save()`.
 *
 * @returns Array of IBadge objects for every badge newly awarded this call.
 */
export async function checkAndAwardBadges(
  child: IChildDocument,
  stats: AdventureStats,
  context: BadgeContext
): Promise<IBadge[]> {
  const alreadyHas = (badgeType: string) => child.badges.some((b) => b.badgeType === badgeType);
  const toAward: string[] = [];

  // ── first-adventure ────────────────────────────────────────────────────────
  // Use totalCompletedAdventures BEFORE this one — at call time the adventure
  // hasn't been counted yet (completeAdventure saves it before calling this).
  // Caller passes the freshly-incremented count so we check === 1.
  if (!alreadyHas('first-adventure') && context.totalCompletedAdventures >= 1) {
    toAward.push('first-adventure');
  }

  // ── perfect-score: 100% accuracy with 0 hints ─────────────────────────────
  if (
    !alreadyHas('perfect-score') &&
    stats.totalChallenges > 0 &&
    stats.correctAnswers === stats.totalChallenges &&
    stats.hintsUsed === 0
  ) {
    toAward.push('perfect-score');
  }

  // ── speed-master: all correct on FIRST attempt (no wrong answers, no hints) ─
  if (
    !alreadyHas('speed-master') &&
    stats.totalChallenges > 0 &&
    stats.incorrectAnswers === 0 &&
    stats.hintsUsed === 0
  ) {
    toAward.push('speed-master');
  }

  // ── 5-day-streak ──────────────────────────────────────────────────────────
  if (!alreadyHas('5-day-streak')) {
    const streak = await computeDayStreak(child._id.toString());
    if (streak >= 5) toAward.push('5-day-streak');
  }

  // ── explorer: 3 distinct story worlds ──────────────────────────────────────
  if (!alreadyHas('explorer')) {
    const distinctWorlds = await Adventure.distinct('storyWorld', {
      childId: child._id,
      status: 'completed',
    });
    const worldSet = new Set<string>(distinctWorlds);
    worldSet.add(context.currentStoryWorld);
    if (worldSet.size >= 3) toAward.push('explorer');
  }

  // ── topic-master: 80%+ mastery on a topic with ≥5 challenges ──────────────
  if (!alreadyHas('topic-master')) {
    const masteredTopic = await TopicProgress.findOne({
      childId: child._id,
      masteryLevel: { $gte: 80 },
      totalChallenges: { $gte: 5 },
    }).lean();
    if (masteredTopic) toAward.push('topic-master');
  }

  // ── math-veteran: 25 total adventures ──────────────────────────────────────
  if (!alreadyHas('math-veteran') && context.totalCompletedAdventures >= 25) {
    toAward.push('math-veteran');
  }

  // ── world-conqueror: all 10 story worlds ───────────────────────────────────
  if (!alreadyHas('world-conqueror')) {
    const distinctWorlds = await Adventure.distinct('storyWorld', {
      childId: child._id,
      status: 'completed',
    });
    const worldSet = new Set<string>(distinctWorlds);
    worldSet.add(context.currentStoryWorld);
    if (worldSet.size >= 10) toAward.push('world-conqueror');
  }

  // ── hint-free-run: 3 consecutive hint-free adventures ─────────────────────
  if (!alreadyHas('hint-free-run') && context.consecutiveHintFreeAdventures >= 3) {
    toAward.push('hint-free-run');
  }

  // Push all newly earned badges at once
  const awarded: IBadge[] = [];
  for (const badgeType of toAward) {
    const badge = pushBadge(child, badgeType);
    if (badge) awarded.push(badge);
  }

  return awarded;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Shape actually persisted on the Child document. */
export interface StoredBadge {
  badgeType: string;
  earnedAt: Date;
}

/**
 * Joins stored badges against BADGE_DEFINITIONS so the client always receives
 * fully-populated badges. Badge types with no definition (e.g. a badge retired
 * from config) are skipped rather than surfaced as broken entries.
 */
export function resolveBadges(earned: StoredBadge[]): IBadge[] {
  const resolved: IBadge[] = [];

  for (const stored of earned) {
    const def = BADGE_DEFINITIONS.find((b) => b.badgeType === stored.badgeType);
    if (!def) {
      logger.warn(`[badges] no definition for stored badgeType "${stored.badgeType}"`);
      continue;
    }

    resolved.push({
      badgeType: def.badgeType,
      badgeName: def.badgeName,
      description: def.description,
      iconUrl: def.iconUrl,
      unlockCondition: def.unlockCondition,
      earnedAt: new Date(stored.earnedAt).toISOString(),
    });
  }

  return resolved;
}

function pushBadge(child: IChildDocument, badgeType: string): IBadge | undefined {
  const def = BADGE_DEFINITIONS.find((b) => b.badgeType === badgeType);
  if (!def) return undefined;

  const earnedAt = new Date();
  child.badges.push({ badgeType: def.badgeType, earnedAt });

  return resolveBadges([{ badgeType: def.badgeType, earnedAt }])[0];
}

/** Counts how many consecutive calendar days the child has completed at least one adventure. */
async function computeDayStreak(childId: string): Promise<number> {
  const completedAdventures = await Adventure.find(
    { childId, status: 'completed', completedAt: { $exists: true } },
    { completedAt: 1, _id: 0 }
  ).lean();

  const daySet = new Set<string>();
  const todayUTC = new Date().toISOString().slice(0, 10);
  daySet.add(todayUTC);
  for (const a of completedAdventures) {
    if (a.completedAt) daySet.add(new Date(a.completedAt).toISOString().slice(0, 10));
  }

  const sortedDays = Array.from(daySet).sort().reverse(); // most-recent first
  let streak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]).getTime();
    const curr = new Date(sortedDays[i]).getTime();
    if (prev - curr === 86_400_000) {
      streak += 1;
      if (streak >= 5) break; // early exit once threshold met
    } else {
      break;
    }
  }
  return streak;
}
