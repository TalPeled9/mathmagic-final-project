import * as React from 'react';
import { Column, Text } from '@react-email/components';
import { COLORS } from '../theme';

interface Props {
  emoji: string;
  value: string | number;
  label: string;
}

export function StatTile({ emoji, value, label }: Props) {
  return (
    <Column
      align="center"
      style={{
        backgroundColor: COLORS.gray50,
        borderRadius: '12px',
        padding: '14px 6px',
        width: '25%',
      }}
    >
      <Text style={{ fontSize: '18px', margin: '0 0 2px' }}>{emoji}</Text>
      <Text style={{ fontSize: '17px', fontWeight: 700, color: COLORS.gray900, margin: '0 0 2px' }}>
        {value}
      </Text>
      <Text style={{ fontSize: '11px', color: COLORS.gray400, margin: 0 }}>{label}</Text>
    </Column>
  );
}
