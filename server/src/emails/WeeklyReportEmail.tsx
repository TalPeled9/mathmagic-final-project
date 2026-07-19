import * as React from 'react';
import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { ChildSection } from './components/ChildSection';
import { COLORS } from './theme';
import type { ChildWeekStats } from '../services/weeklyReportService';

export interface WeeklyReportEmailProps {
  parentName: string;
  weekLabel: string;
  childStats: ChildWeekStats[];
  dashboardUrl: string;
  unsubscribeUrl: string;
  logoUrl: string;
}

export function WeeklyReportEmail({
  parentName,
  weekLabel,
  childStats,
  dashboardUrl,
  unsubscribeUrl,
  logoUrl,
}: WeeklyReportEmailProps) {
  const firstName = parentName.split(' ')[0] || parentName;

  return (
    <EmailLayout
      previewText={`${weekLabel} — your family's weekly magic recap is here!`}
      logoUrl={logoUrl}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading as="h1" style={{ fontSize: '20px', color: COLORS.gray900, margin: '0 0 4px' }}>
        Hi {firstName}, here's this week's magic! ✨
      </Heading>
      <Text style={{ fontSize: '13px', color: COLORS.gray400, margin: '0 0 20px' }}>
        {weekLabel}
      </Text>

      {childStats.map((child, index) => (
        <React.Fragment key={child.childId}>
          <ChildSection child={child} />
          {index < childStats.length - 1 && (
            <Hr style={{ borderColor: COLORS.gray100, margin: '20px 0' }} />
          )}
        </React.Fragment>
      ))}

      <Section style={{ textAlign: 'center', marginTop: '24px' }}>
        <Button
          href={dashboardUrl}
          style={{
            backgroundColor: COLORS.purple,
            color: COLORS.white,
            fontSize: '13px',
            fontWeight: 700,
            borderRadius: '10px',
            padding: '12px 24px',
          }}
        >
          View Full Dashboard
        </Button>
      </Section>
    </EmailLayout>
  );
}

export default WeeklyReportEmail;
