// Display-name lookup for story worlds, shared across the child dashboard and
// the adventure replay header. Math-topic display names come from server config
// (curriculum topics) via the adventures API's `mathTopicName` field.

export const WORLD_NAMES: Record<string, string> = {
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
