import type { BadgeDefinition } from '@mathmagic/types';

export type { BadgeDefinition };

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first-adventure',
    badgeType: 'first-adventure',
    badgeName: 'First Adventure',
    description: 'Completed your very first adventure',
    iconUrl: '/images/badges/first-adventure.svg',
    unlockCondition: 'Complete any adventure',
  },
  {
    id: 'perfect-score',
    badgeType: 'perfect-score',
    badgeName: 'Perfect Score',
    description: 'Answered every question correctly without any hints',
    iconUrl: '/images/badges/perfect-score.svg',
    unlockCondition: '100% accuracy with 0 hints on one adventure',
  },
  {
    id: '5-day-streak',
    badgeType: '5-day-streak',
    badgeName: '5-Day Streak',
    description: 'Practiced math for 5 days in a row',
    iconUrl: '/images/badges/5-day-streak.svg',
    unlockCondition: 'Complete at least one adventure on 5 consecutive days',
  },
  {
    id: 'speed-master',
    badgeType: 'speed-master',
    badgeName: 'Speed Master',
    description: 'Got every answer right on the first try',
    iconUrl: '/images/badges/speed-master.svg',
    unlockCondition: 'All correct answers on first attempt in one adventure',
  },
  {
    id: 'topic-master',
    badgeType: 'topic-master',
    badgeName: 'Topic Master',
    description: 'Achieved mastery in a math topic',
    iconUrl: '/images/badges/topic-master.svg',
    unlockCondition: 'Reach 80%+ mastery level on any single math topic',
  },
  {
    id: 'explorer',
    badgeType: 'explorer',
    badgeName: 'Explorer',
    description: 'Ventured into three different story worlds',
    iconUrl: '/images/badges/explorer.svg',
    unlockCondition: 'Complete adventures in 3 different story worlds',
  },
  {
    id: 'math-veteran',
    badgeType: 'math-veteran',
    badgeName: 'Math Veteran',
    description: 'Completed 25 adventures — a true math hero!',
    iconUrl: '/images/badges/math-veteran.svg',
    unlockCondition: 'Complete 25 adventures total',
  },
  {
    id: 'world-conqueror',
    badgeType: 'world-conqueror',
    badgeName: 'World Conqueror',
    description: 'Explored every story world in MathMagic',
    iconUrl: '/images/badges/world-conqueror.svg',
    unlockCondition: 'Complete adventures in all 10 story worlds',
  },
  {
    id: 'hint-free-run',
    badgeType: 'hint-free-run',
    badgeName: 'No Hints Needed',
    description: 'Solved 3 adventures in a row without asking for a single hint',
    iconUrl: '/images/badges/hint-free-run.svg',
    unlockCondition: 'Complete 3 consecutive adventures with 0 hints used',
  },
];

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((badge) => badge.id === id);
}
