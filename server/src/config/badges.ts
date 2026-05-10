export interface BadgeDefinition {
  id: string;
  badgeType: string;
  badgeName: string;
  description: string;
  /** Emoji used in the UI in place of an image icon */
  iconEmoji: string;
  iconUrl: string;
  unlockCondition: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first-adventure',
    badgeType: 'first-adventure',
    badgeName: 'First Adventure',
    description: 'Completed your very first adventure',
    iconEmoji: '🌟',
    iconUrl: '',
    unlockCondition: 'Complete any adventure',
  },
  {
    id: 'perfect-score',
    badgeType: 'perfect-score',
    badgeName: 'Perfect Score',
    description: 'Answered every question correctly without any hints',
    iconEmoji: '🎯',
    iconUrl: '',
    unlockCondition: '100% accuracy with 0 hints on one adventure',
  },
  {
    id: '5-day-streak',
    badgeType: '5-day-streak',
    badgeName: '5-Day Streak',
    description: 'Practiced math for 5 days in a row',
    iconEmoji: '🔥',
    iconUrl: '',
    unlockCondition: 'Complete at least one adventure on 5 consecutive days',
  },
  {
    id: 'speed-master',
    badgeType: 'speed-master',
    badgeName: 'Speed Master',
    description: 'Got every answer right on the first try',
    iconEmoji: '⚡',
    iconUrl: '',
    unlockCondition: 'All correct answers on first attempt in one adventure',
  },
  {
    id: 'topic-master',
    badgeType: 'topic-master',
    badgeName: 'Topic Master',
    description: 'Achieved mastery in a math topic',
    iconEmoji: '🏆',
    iconUrl: '',
    unlockCondition: 'Reach 80%+ mastery level on any single math topic',
  },
  {
    id: 'explorer',
    badgeType: 'explorer',
    badgeName: 'Explorer',
    description: 'Ventured into three different story worlds',
    iconEmoji: '🧭',
    iconUrl: '',
    unlockCondition: 'Complete adventures in 3 different story worlds',
  },
  {
    id: 'math-veteran',
    badgeType: 'math-veteran',
    badgeName: 'Math Veteran',
    description: 'Completed 25 adventures — a true math hero!',
    iconEmoji: '🎖️',
    iconUrl: '',
    unlockCondition: 'Complete 25 adventures total',
  },
  {
    id: 'world-conqueror',
    badgeType: 'world-conqueror',
    badgeName: 'World Conqueror',
    description: 'Explored every story world in MathMagic',
    iconEmoji: '🌍',
    iconUrl: '',
    unlockCondition: 'Complete adventures in all 10 story worlds',
  },
  {
    id: 'hint-free-run',
    badgeType: 'hint-free-run',
    badgeName: 'No Hints Needed',
    description: 'Solved 3 adventures in a row without asking for a single hint',
    iconEmoji: '🧠',
    iconUrl: '',
    unlockCondition: 'Complete 3 consecutive adventures with 0 hints used',
  },
];

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((badge) => badge.id === id);
}
