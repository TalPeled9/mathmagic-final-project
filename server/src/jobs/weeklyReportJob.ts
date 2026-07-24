import User from '../models/User';
import { logger } from '../lib/logger';
import { getReportWeekRange } from '../services/weeklyReportService';
import { sendWeeklyReportForParent } from '../services/weeklyReportDispatchService';

// Guards against overlapping runs within this single always-on process. Not safe
// against overlap across multiple instances — would need a DB lock if ever scaled out.
let isRunning = false;

export async function runWeeklyReportJob(): Promise<void> {
  if (isRunning) {
    logger.warn('Weekly report job already running — skipping this trigger');
    return;
  }
  isRunning = true;

  try {
    const range = getReportWeekRange();
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    const cursor = User.find({ weeklyReportOptIn: { $ne: false } }).cursor();
    for await (const user of cursor) {
      try {
        const result = await sendWeeklyReportForParent(String(user._id), range);
        if (result.sent) sent++;
        else skipped++;
      } catch (err) {
        failed++;
        logger.error({ err, userId: String(user._id) }, 'Weekly report send failed for parent');
      }
    }

    logger.info(
      { sent, skipped, failed, weekStart: range.weekStart, weekEnd: range.weekEnd },
      'Weekly report job completed'
    );
  } finally {
    isRunning = false;
  }
}
