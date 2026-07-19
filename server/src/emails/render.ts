import * as React from 'react';
import { render } from '@react-email/render';
import { WeeklyReportEmail, WeeklyReportEmailProps } from './WeeklyReportEmail';
import { UnsubscribeConfirmation, UnsubscribeConfirmationProps } from './UnsubscribeConfirmation';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

function buildSubject(props: WeeklyReportEmailProps): string {
  const totalXP = props.childStats.reduce((sum, c) => sum + c.xpEarnedThisWeek, 0);
  if (totalXP === 0) return `Wizzy's Weekly Report — ${props.weekLabel}`;
  return `Wizzy's Weekly Report — ${totalXP} XP earned this week! ✨`;
}

export async function renderWeeklyReportEmail(props: WeeklyReportEmailProps): Promise<RenderedEmail> {
  const element = React.createElement(WeeklyReportEmail, props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { subject: buildSubject(props), html, text };
}

export async function renderUnsubscribeConfirmationHtml(
  props: UnsubscribeConfirmationProps
): Promise<string> {
  return render(React.createElement(UnsubscribeConfirmation, props));
}
