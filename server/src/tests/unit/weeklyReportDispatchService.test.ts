import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockConfig = vi.hoisted(() => ({
  resend: { apiKey: 'test-key', fromEmail: 'MathMagic Reports <test@example.com>' },
  clientUrl: 'http://localhost:5173',
}));
vi.mock('../../config/index', () => ({ config: mockConfig }));

const mockFindById = vi.hoisted(() => vi.fn());
vi.mock('../../model/User', () => ({ default: { findById: mockFindById } }));

const mockGetParentWeekReport = vi.hoisted(() => vi.fn());
vi.mock('../../services/weeklyReportService', () => ({
  getParentWeekReport: mockGetParentWeekReport,
}));

const mockGetOrCreateUnsubscribeToken = vi.hoisted(() => vi.fn());
const mockSendEmail = vi.hoisted(() => vi.fn());
vi.mock('../../services/emailService', () => ({
  getOrCreateUnsubscribeToken: mockGetOrCreateUnsubscribeToken,
  sendEmail: mockSendEmail,
}));

const mockRenderWeeklyReportEmail = vi.hoisted(() => vi.fn());
vi.mock('../../emails/render', () => ({
  renderWeeklyReportEmail: mockRenderWeeklyReportEmail,
}));

import { sendWeeklyReportForParent } from '../../services/weeklyReportDispatchService';

const WEEK_START = new Date('2026-01-05T00:00:00.000Z');
const WEEK_END = new Date('2026-01-12T00:00:00.000Z');

function buildReport(overrides: Partial<{ hasAnyActivity: boolean }> = {}) {
  return {
    parent: { id: 'parent-1', name: 'Dana', email: 'dana@example.com' },
    weekStart: WEEK_START,
    weekEnd: WEEK_END,
    children: [],
    hasAnyActivity: overrides.hasAnyActivity ?? true,
  };
}

describe('sendWeeklyReportForParent', () => {
  beforeEach(() => {
    mockFindById.mockReset();
    mockGetParentWeekReport.mockReset();
    mockGetOrCreateUnsubscribeToken.mockReset();
    mockSendEmail.mockReset();
    mockRenderWeeklyReportEmail.mockReset();
    mockConfig.resend.apiKey = 'test-key';

    mockGetOrCreateUnsubscribeToken.mockResolvedValue('tok-abc');
    mockRenderWeeklyReportEmail.mockResolvedValue({ subject: 'Subj', html: '<p>h</p>', text: 't' });
    mockSendEmail.mockResolvedValue({ ok: true, id: 'email_1' });
  });

  it('returns no-user when the parent does not exist', async () => {
    mockFindById.mockResolvedValue(null);

    const result = await sendWeeklyReportForParent('missing-id');

    expect(result).toEqual({ sent: false, reason: 'no-user' });
    expect(mockGetParentWeekReport).not.toHaveBeenCalled();
  });

  it('returns opted-out without fetching a report when the parent has opted out', async () => {
    mockFindById.mockResolvedValue({ weeklyReportOptIn: false });

    const result = await sendWeeklyReportForParent('parent-1');

    expect(result).toEqual({ sent: false, reason: 'opted-out' });
    expect(mockGetParentWeekReport).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('returns no-activity when the parent is opted in but nothing happened this week', async () => {
    mockFindById.mockResolvedValue({ weeklyReportOptIn: true });
    mockGetParentWeekReport.mockResolvedValue(buildReport({ hasAnyActivity: false }));

    const result = await sendWeeklyReportForParent('parent-1');

    expect(result).toEqual({ sent: false, reason: 'no-activity' });
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('force bypasses both the opt-out and no-activity checks', async () => {
    mockFindById.mockResolvedValue({ weeklyReportOptIn: false });
    mockGetParentWeekReport.mockResolvedValue(buildReport({ hasAnyActivity: false }));

    const result = await sendWeeklyReportForParent('parent-1', { force: true });

    expect(result).toEqual({ sent: true });
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  it('returns resend-not-configured when no API key is set', async () => {
    mockConfig.resend.apiKey = '';
    mockFindById.mockResolvedValue({ weeklyReportOptIn: true });
    mockGetParentWeekReport.mockResolvedValue(buildReport());

    const result = await sendWeeklyReportForParent('parent-1');

    expect(result).toEqual({ sent: false, reason: 'resend-not-configured' });
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('returns send-failed when the email provider call fails', async () => {
    mockFindById.mockResolvedValue({ weeklyReportOptIn: true });
    mockGetParentWeekReport.mockResolvedValue(buildReport());
    mockSendEmail.mockResolvedValue({ ok: false, error: 'boom' });

    const result = await sendWeeklyReportForParent('parent-1');

    expect(result).toEqual({ sent: false, reason: 'send-failed' });
  });

  it('returns sent:true on the happy path and includes List-Unsubscribe headers', async () => {
    mockFindById.mockResolvedValue({ weeklyReportOptIn: true });
    mockGetParentWeekReport.mockResolvedValue(buildReport());

    const result = await sendWeeklyReportForParent('parent-1');

    expect(result).toEqual({ sent: true });
    const emailArgs = mockSendEmail.mock.calls[0][0];
    expect(emailArgs.to).toBe('dana@example.com');
    expect(emailArgs.headers['List-Unsubscribe']).toContain('tok-abc');
  });
});
