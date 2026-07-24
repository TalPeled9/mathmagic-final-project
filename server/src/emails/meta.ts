// Duplicated from client/src/pages/parent/tabs/OverviewTab.tsx — small enough that
// cross-workspace coupling isn't worth it just to share a 10-entry lookup table.
const WORLD_EMOJIS: Record<string, string> = {
  space: '🚀',
  fantasy: '🏰',
  dinosaur: '🦕',
  ocean: '🌊',
  jungle: '🌿',
  pirates: '☠️',
  robots: '🤖',
  candy: '🍬',
  'magic-school': '🧙',
  'ancient-temple': '🏛️',
};

const WORLD_NAMES: Record<string, string> = {
  space: 'Space Station',
  fantasy: 'Enchanted Kingdom',
  dinosaur: 'Dino Valley',
  ocean: 'Deep Ocean',
  jungle: 'Jungle Explorer',
  pirates: 'Pirate Seas',
  robots: 'Robot City',
  candy: 'Candy Land',
  'magic-school': 'Magic School',
  'ancient-temple': 'Ancient Temple',
};

export function getWorldMeta(storyWorld: string): { emoji: string; name: string } {
  return {
    emoji: WORLD_EMOJIS[storyWorld] ?? '✨',
    name: WORLD_NAMES[storyWorld] ?? storyWorld,
  };
}

// The app itself now renders badges as SVG icons (server/src/config/badges.ts),
// which email clients don't reliably support — emoji stay the reliable choice here.
const BADGE_EMOJIS: Record<string, string> = {
  'first-adventure': '🌟',
  'perfect-score': '🎯',
  '5-day-streak': '🔥',
  'speed-master': '⚡',
  'topic-master': '🏆',
  explorer: '🧭',
  'math-veteran': '🎖️',
  'world-conqueror': '🌍',
  'hint-free-run': '🧠',
};

export function getBadgeEmoji(badgeType: string): string {
  return BADGE_EMOJIS[badgeType] ?? '🏅';
}
