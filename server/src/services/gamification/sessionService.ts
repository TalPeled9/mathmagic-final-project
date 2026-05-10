import type { DailySessionStat } from '@mathmagic/types';
import { Types } from 'mongoose';
import { LearningSession } from '../../models/LearningSession';

/**
 * Returns total learning minutes for a child in the last 7 days.
 * Only counts sessions that have been closed (endTime set).
 */
export async function getWeeklyLearningMinutes(childId: string): Promise<number> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const result = await LearningSession.aggregate([
    {
      $match: {
        childId: new Types.ObjectId(childId),
        date: { $gte: weekAgo },
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
