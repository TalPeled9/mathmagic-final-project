import * as React from 'react';
import { Text } from '@react-email/components';
import { COLORS } from '../theme';

interface Props {
  emoji: string;
  name: string;
}

export function BadgeChip({ emoji, name }: Props) {
  return (
    <Text
      style={{
        display: 'inline-block',
        backgroundColor: '#f5f3ff',
        border: `1px solid ${COLORS.purple}22`,
        borderRadius: '999px',
        padding: '6px 12px',
        margin: '0 6px 6px 0',
        fontSize: '13px',
        fontWeight: 600,
        color: COLORS.gray700,
      }}
    >
      {emoji} {name}
    </Text>
  );
}
