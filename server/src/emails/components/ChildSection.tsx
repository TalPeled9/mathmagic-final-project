import * as React from 'react';
import { Column, Heading, Row, Section, Text } from '@react-email/components';
import { COLORS } from '../theme';
import { ProgressBar } from './ProgressBar';
import { StatTile } from './StatTile';
import { BadgeChip } from './BadgeChip';
import { AdventureRow } from './AdventureRow';
import { EmptyWeekNotice } from './EmptyWeekNotice';
import { getBadgeEmoji } from '../meta';
import type { ChildWeekStats } from '../../services/weeklyReportService';

interface Props {
  child: ChildWeekStats;
}

function minutesDeltaLabel(thisWeek: number, lastWeek: number): string {
  const delta = thisWeek - lastWeek;
  if (delta === 0) return 'same as last week';
  return delta > 0 ? `+${delta} min vs last week` : `${delta} min vs last week`;
}

export function ChildSection({ child }: Props) {
  const { levelInfo } = child;
  const xpInLevel = levelInfo.currentXP - levelInfo.currentLevelThresholdXP;
  const progressPercent = levelInfo.isMaxLevel
    ? 100
    : Math.round((xpInLevel / (levelInfo.xpToNext ?? 1)) * 100);

  return (
    <Section style={{ marginBottom: '8px' }}>
      <Row>
        <Column>
          <Heading as="h2" style={{ fontSize: '16px', color: COLORS.gray900, margin: '0 0 8px' }}>
            {child.childName}
          </Heading>
        </Column>
      </Row>

      <Row style={{ marginBottom: '10px' }}>
        <Column>
          <Text
            style={{
              display: 'inline-block',
              backgroundColor: '#f5f3ff',
              color: COLORS.purpleDark,
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '999px',
              padding: '4px 10px',
              margin: '0 6px 0 0',
            }}
          >
            🏆 Level {levelInfo.level} — {levelInfo.name}
          </Text>
          {child.currentDayStreak > 0 && (
            <Text
              style={{
                display: 'inline-block',
                backgroundColor: '#fff7ed',
                color: '#c2410c',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '999px',
                padding: '4px 10px',
                margin: 0,
              }}
            >
              🔥 {child.currentDayStreak} day streak
            </Text>
          )}
        </Column>
      </Row>

      <Row style={{ marginBottom: '4px' }}>
        <Column>
          <Text style={{ fontSize: '11px', color: COLORS.gray400, margin: 0 }}>
            {levelInfo.currentXP} XP total
            {!levelInfo.isMaxLevel &&
              levelInfo.xpToNext !== null &&
              ` · ${levelInfo.xpToNext - xpInLevel} XP to next level`}
            {levelInfo.isMaxLevel && ' · Max level reached! 🎉'}
          </Text>
        </Column>
      </Row>
      <Row style={{ marginBottom: '16px' }}>
        <Column>
          <ProgressBar percent={progressPercent} />
        </Column>
      </Row>

      <Row style={{ marginBottom: '16px' }}>
        <StatTile emoji="⚡" value={child.xpEarnedThisWeek} label="XP this week" />
        <Column style={{ width: '8px' }} />
        <StatTile emoji="🧭" value={child.adventuresCompletedThisWeek} label="Adventures" />
        <Column style={{ width: '8px' }} />
        <StatTile emoji="⭐" value={child.starsEarnedThisWeek} label="Stars earned" />
        <Column style={{ width: '8px' }} />
        <StatTile emoji="⏱️" value={child.minutesThisWeek} label="Minutes" />
      </Row>
      <Row style={{ marginBottom: '18px' }}>
        <Column>
          <Text style={{ fontSize: '11px', color: COLORS.gray400, textAlign: 'center', margin: 0 }}>
            {minutesDeltaLabel(child.minutesThisWeek, child.minutesLastWeek)}
          </Text>
        </Column>
      </Row>

      {child.newBadgesThisWeek.length > 0 && (
        <Row style={{ marginBottom: '18px' }}>
          <Column>
            <Text style={{ fontSize: '11px', fontWeight: 700, color: COLORS.gray400, textTransform: 'uppercase', margin: '0 0 8px' }}>
              New badges this week
            </Text>
            {child.newBadgesThisWeek.map((badge) => (
              <BadgeChip key={badge.badgeType} emoji={getBadgeEmoji(badge.badgeType)} name={badge.badgeName} />
            ))}
          </Column>
        </Row>
      )}

      <Row style={{ marginBottom: '8px' }}>
        <Column>
          <Text style={{ fontSize: '11px', fontWeight: 700, color: COLORS.gray400, textTransform: 'uppercase', margin: '0 0 8px' }}>
            {child.hasActivity ? "This week's adventures" : 'This week'}
          </Text>
        </Column>
      </Row>
      {child.hasActivity ? (
        child.recentAdventures.map((adventure) => (
          <AdventureRow key={adventure.adventureId} adventure={adventure} />
        ))
      ) : (
        <EmptyWeekNotice childName={child.childName} />
      )}
    </Section>
  );
}
