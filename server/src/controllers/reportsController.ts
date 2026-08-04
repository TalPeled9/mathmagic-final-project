import { Request, Response } from 'express';
import { config } from '../config/index';
import { getWeekStart } from '../services/adventureService';
import { getParentWeekReport } from '../services/weeklyReportService';
import { renderWeeklyReportEmail } from '../emails/render';
import { formatWeekLabel, sendWeeklyReportForParent } from '../services/weeklyReportDispatchService';
import { ApiError } from '../utils/ApiError';

function currentWeekToDateRange(): { weekStart: Date; weekEnd: Date } {
  return { weekStart: getWeekStart(new Date()), weekEnd: new Date() };
}

export async function previewWeeklyReportHtml(req: Request, res: Response): Promise<void> {
  const parentId = req.user!.userId;
  const range = currentWeekToDateRange();

  const report = await getParentWeekReport(parentId, range);
  if (!report) throw ApiError.notFound('Parent not found');

  const { html } = await renderWeeklyReportEmail({
    parentName: report.parent.name,
    weekLabel: formatWeekLabel(range.weekStart, range.weekEnd),
    childStats: report.children,
    dashboardUrl: `${config.clientUrl}/parent`,
    unsubscribeUrl: `${config.clientUrl}/api/email-preferences/unsubscribe/preview`,
    logoUrl: `${config.clientUrl}/images/logo.png`,
  });

  res.type('html').send(html);
}

export async function sendWeeklyReportNow(req: Request, res: Response): Promise<void> {
  const parentId = req.user!.userId;
  const range = currentWeekToDateRange();
  const result = await sendWeeklyReportForParent(parentId, { ...range, force: true });
  res.json(result);
}
