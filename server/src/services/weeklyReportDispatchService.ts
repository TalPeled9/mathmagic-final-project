import User from '../model/User';
import { config } from '../config/index';
import { getParentWeekReport } from './weeklyReportService';
import { getOrCreateUnsubscribeToken, sendEmail } from './emailService';
import { renderWeeklyReportEmail } from '../emails/render';

export interface SendWeeklyReportResult {
  sent: boolean;
  reason?: 'no-user' | 'opted-out' | 'no-activity' | 'resend-not-configured' | 'send-failed';
}

export function formatWeekLabel(weekStart: Date, weekEnd: Date): string {
  const endInclusive = new Date(weekEnd.getTime() - 24 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  return `${fmt(weekStart)} – ${fmt(endInclusive)}, ${endInclusive.getUTCFullYear()}`;
}

/**
 * Shared entry point for both the weekly cron job and the manual "send now" endpoint.
 * force=true bypasses the opt-in and no-activity checks (used for on-demand sends).
 */
export async function sendWeeklyReportForParent(
  parentId: string,
  opts: { weekStart?: Date; weekEnd?: Date; force?: boolean } = {}
): Promise<SendWeeklyReportResult> {
  const userDoc = await User.findById(parentId);
  if (!userDoc) return { sent: false, reason: 'no-user' };

  if (!opts.force && userDoc.weeklyReportOptIn === false) {
    return { sent: false, reason: 'opted-out' };
  }

  const range = opts.weekStart && opts.weekEnd ? { weekStart: opts.weekStart, weekEnd: opts.weekEnd } : undefined;
  const report = await getParentWeekReport(parentId, range);
  if (!report) return { sent: false, reason: 'no-user' };

  if (!opts.force && !report.hasAnyActivity) {
    return { sent: false, reason: 'no-activity' };
  }

  if (!config.resend.apiKey) {
    return { sent: false, reason: 'resend-not-configured' };
  }

  const token = await getOrCreateUnsubscribeToken(userDoc);
  const logoUrl = `${config.clientUrl}/api/assets/email/logo.png`;
  const dashboardUrl = `${config.clientUrl}/parent`;
  const unsubscribeUrl = `${config.clientUrl}/api/email-preferences/unsubscribe/${token}`;

  const { subject, html, text } = await renderWeeklyReportEmail({
    parentName: report.parent.name,
    weekLabel: formatWeekLabel(report.weekStart, report.weekEnd),
    childStats: report.children,
    dashboardUrl,
    unsubscribeUrl,
    logoUrl,
  });

  const result = await sendEmail({
    to: report.parent.email,
    subject,
    html,
    text,
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });

  if (!result.ok) return { sent: false, reason: 'send-failed' };
  return { sent: true };
}
