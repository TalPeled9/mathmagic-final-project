import type { DailySessionStat } from '@mathmagic/types';
import { Types } from 'mongoose';
import { LearningSession } from '../../models/LearningSession';
import { Adventure } from '../../models/Adventure';

/**
 * Returns total learning minutes for a child within an explicit [start, end) window.
 * Unlike getDailySessionBreakdown (rolling window from now), this takes fixed
 * bounds so callers can align to a calendar week rather than the current moment.
 */
export async function getMinutesInRange(childId: string, start: Date, end: Date): Promise<number> {
  const result = await LearningSession.aggregate([
    {
      $match: {
        childId: new Types.ObjectId(childId),
        date: { $gte: start, $lt: end },
        duration: { $exists: true, $gt: 0 },
      },
    },
    { $group: { _id: null, total: { $sum: '$duration' } } },
  ]);
  return result[0]?.total ?? 0;
}

/**
 * Returns per-day learning minutes for the last `days` calendar days.
 * Gaps (days with no sessions) are filled with 0 minutes so the client
 * always receives a complete, chart-ready array.
 *
 * @param childId  MongoDB ObjectId string
 * @param days     Number of days to look back (default 7)
 */
export async function getDailySessionBreakdown(
  childId: string,
  days = 7
): Promise<DailySessionStat[]> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  cutoff.setHours(0, 0, 0, 0);

  const rows = await LearningSession.aggregate<{ _id: string; minutes: number }>([
    {
      $match: {
        childId: new Types.ObjectId(childId),
        date: { $gte: cutoff },
        duration: { $exists: true, $gt: 0 },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        minutes: { $sum: '$duration' },
      },
    },
  ]);

  // Build a lookup by date string
  const byDate = new Map<string, number>(rows.map((r) => [r._id, r.minutes]));

  // Generate all calendar days in the window and fill gaps
  const result: DailySessionStat[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, minutes: byDate.get(key) ?? 0 });
  }

  return result;
}

/**
 * Returns how many consecutive calendar days (ending today) the child has
 * completed at least one adventure. Returns 0 if today has no adventure.
 */
export async function getCurrentDayStreak(childId: string): Promise<number> {
  const completed = await Adventure.find(
    { childId: new Types.ObjectId(childId), status: 'completed', completedAt: { $exists: true } },
    { completedAt: 1, _id: 0 }
  ).lean();

  if (completed.length === 0) return 0;

  const daySet = new Set<string>(
    completed
      .filter((a) => a.completedAt)
      .map((a) => new Date(a.completedAt!).toISOString().slice(0, 10))
  );

  let streak = 0;
  const now = Date.now();
  for (let i = 0; ; i++) {
    const key = new Date(now - i * 86_400_000).toISOString().slice(0, 10);
    if (daySet.has(key)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
