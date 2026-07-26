import { api } from '../lib/api';
import type { NotificationPreferences } from '@mathmagic/types';

export interface SendWeeklyReportResult {
  sent: boolean;
  reason?: 'no-user' | 'opted-out' | 'no-activity' | 'resend-not-configured' | 'send-failed';
}

export const notificationService = {
  get: () => api.get<NotificationPreferences>('/parent/notification-preferences'),
  update: (weeklyReportOptIn: boolean) =>
    api.patch<NotificationPreferences>('/parent/notification-preferences', { weeklyReportOptIn }),
  sendWeeklyReportNow: () =>
    api.post<SendWeeklyReportResult>('/parent/reports/weekly/send', {}),
};
