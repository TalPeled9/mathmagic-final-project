export interface BadgeDefinition {
  id: string;
  badgeType: string;
  badgeName: string;
  description: string;
  iconUrl: string;
  unlockCondition: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first-adventure',
    badgeType: 'first-adventure',
    badgeName: 'First Adventure',
    description: 'Completed your very first adventure',
    iconUrl: '',
    unlockCondition: 'Complete any adventure',
  },
  {
    id: 'perfect-score',
    badgeType: 'perfect-score',
    badgeName: 'Perfect Score',
    description: 'Answered every question correctly without any hints',
    iconUrl: '',
    unlockCondition: '100% accuracy with 0 hints on one adventure',
  },
  {
    id: '5-day-streak',
    badgeType: '5-day-streak',
    badgeName: '5-Day Streak',
    description: 'Practiced math for 5 days in a row',
    iconUrl: '',
    unlockCondition: 'Complete at least one adventure on 5 consecutive days',
  },
  {
    id: 'speed-master',
    badgeType: 'speed-master',
    badgeName: 'Speed Master',
    description: 'Got every answer right on the first try',
    iconUrl: '',
    unlockCondition: 'All correct answers on first attempt in one adventure',
  },
  {
    id: 'topic-master',
    badgeType: 'topic-master',
    badgeName: 'Topic Master',
    description: 'Achieved mastery in a math topic',
    iconUrl: '',
    unlockCondition: 'Reach >80% mastery level on any single math topic',
  },
  {
    id: 'explorer',
    badgeType: 'explorer',
    badgeName: 'Explorer',
    description: 'Ventured into three different story worlds',
    iconUrl: '',
    unlockCondition: 'Complete adventures in 3 different story worlds',
  },
];

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((badge) => badge.id === id);
}
