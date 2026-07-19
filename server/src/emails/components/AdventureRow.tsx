import * as React from 'react';
import { Row, Column, Text } from '@react-email/components';
import { COLORS } from '../theme';
import { getWorldMeta } from '../meta';
import type { WeeklyAdventureSummary } from '../../services/weeklyReportService';

interface Props {
  adventure: WeeklyAdventureSummary;
}

export function AdventureRow({ adventure }: Props) {
  const world = getWorldMeta(adventure.storyWorld);
  const stars = '⭐'.repeat(adventure.starsEarned) + '☆'.repeat(3 - adventure.starsEarned);

  return (
    <Row style={{ backgroundColor: COLORS.gray50, borderRadius: '12px', padding: '10px 12px', marginBottom: '8px' }}>
      <Column style={{ width: '32px', fontSize: '20px', verticalAlign: 'top', padding: '2px 0' }}>
        {world.emoji}
      </Column>
      <Column style={{ verticalAlign: 'top', padding: '2px 0' }}>
        <Text style={{ fontSize: '13px', fontWeight: 600, color: COLORS.gray700, margin: 0 }}>
          {world.name}
        </Text>
        <Text style={{ fontSize: '12px', color: COLORS.gray400, margin: '2px 0 0' }}>
          {adventure.topicName} · {adventure.accuracyPercent}% accuracy
        </Text>
      </Column>
      <Column style={{ width: '90px', textAlign: 'right', verticalAlign: 'top', padding: '2px 0' }}>
        <Text style={{ fontSize: '12px', margin: 0 }}>{stars}</Text>
        <Text style={{ fontSize: '12px', fontWeight: 700, color: COLORS.gold, margin: '2px 0 0' }}>
          ⚡ {adventure.xpEarned} XP
        </Text>
      </Column>
    </Row>
  );
}
