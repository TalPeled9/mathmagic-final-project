import { describe, expect, it } from 'vitest';
import { renderWeeklyReportEmail, renderUnsubscribeConfirmationHtml } from '../../emails/render';
import type { ChildWeekStats } from '../../services/weeklyReportService';

function buildChildStats(overrides: Partial<ChildWeekStats> = {}): ChildWeekStats {
  return {
    childId: '1',
    childName: 'Ari',
    avatarImageData: null,
    gradeLevel: 3,
    levelInfo: {
      level: 2,
      name: 'Math Explorer',
      currentXP: 180,
      currentLevelThresholdXP: 100,
      xpToNext: 150,
      isMaxLevel: false,
    },
    xpEarnedThisWeek: 80,
    starsEarnedThisWeek: 6,
    adventuresCompletedThisWeek: 3,
    minutesThisWeek: 45,
    minutesLastWeek: 30,
    currentDayStreak: 4,
    newBadgesThisWeek: [],
    topicsThisWeek: [],
    recentAdventures: [
      {
        adventureId: 'a1',
        mathTopic: 'g1_addition',
        topicName: 'Addition up to 20',
        storyWorld: 'space',
        completedAt: new Date('2026-01-06T10:00:00.000Z'),
        xpEarned: 30,
        starsEarned: 3,
        accuracyPercent: 90,
      },
    ],
    hasActivity: true,
    ...overrides,
  };
}

describe('renderWeeklyReportEmail', () => {
  it('includes the child name, this-week XP figure, and dashboard CTA URL in the HTML', async () => {
    const { html, subject } = await renderWeeklyReportEmail({
      parentName: 'Dana Cohen',
      weekLabel: 'Jan 5 – Jan 11, 2026',
      childStats: [buildChildStats()],
      dashboardUrl: 'http://localhost:5173/parent',
      unsubscribeUrl: 'http://localhost:3000/api/email-preferences/unsubscribe/tok',
      logoUrl: 'http://localhost:3000/api/assets/email/logo.png',
    });

    expect(html).toContain('Ari');
    expect(html).toContain('80');
    expect(html).toContain('http://localhost:5173/parent');
    expect(html).toContain('http://localhost:3000/api/email-preferences/unsubscribe/tok');
    expect(subject).toContain('80 XP');
  });

  it('renders a friendly empty state for a child with no activity this week', async () => {
    const { html } = await renderWeeklyReportEmail({
      parentName: 'Dana Cohen',
      weekLabel: 'Jan 5 – Jan 11, 2026',
      childStats: [buildChildStats({ hasActivity: false, adventuresCompletedThisWeek: 0, recentAdventures: [] })],
      dashboardUrl: 'http://localhost:5173/parent',
      unsubscribeUrl: 'http://localhost:3000/api/email-preferences/unsubscribe/tok',
      logoUrl: 'http://localhost:3000/api/assets/email/logo.png',
    });

    expect(html).toContain('gentle nudge might help them jump back in');
  });

  it('produces a non-empty plain-text fallback containing the key figures', async () => {
    const { text } = await renderWeeklyReportEmail({
      parentName: 'Dana Cohen',
      weekLabel: 'Jan 5 – Jan 11, 2026',
      childStats: [buildChildStats()],
      dashboardUrl: 'http://localhost:5173/parent',
      unsubscribeUrl: 'http://localhost:3000/api/email-preferences/unsubscribe/tok',
      logoUrl: 'http://localhost:3000/api/assets/email/logo.png',
    });

    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain('ARI');
  });
});

describe('renderUnsubscribeConfirmationHtml', () => {
  it('renders a confirmation page', async () => {
    const html = await renderUnsubscribeConfirmationHtml({ logoUrl: 'http://localhost:3000/api/assets/email/logo.png' });
    expect(html).toContain('unsubscribed');
  });
});
