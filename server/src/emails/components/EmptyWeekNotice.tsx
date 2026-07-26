import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { COLORS } from '../theme';

interface Props {
  childName: string;
}

export function EmptyWeekNotice({ childName }: Props) {
  return (
    <Section style={{ textAlign: 'center', padding: '18px 0' }}>
      <Text style={{ fontSize: '28px', margin: '0 0 6px' }}>🧭</Text>
      <Text style={{ fontSize: '13px', color: COLORS.gray400, margin: 0 }}>
        {childName} didn't complete any adventures this week — a gentle nudge might help them jump
        back in!
      </Text>
    </Section>
  );
}
