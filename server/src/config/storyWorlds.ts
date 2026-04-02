export interface StoryWorld {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  theme: string;
}

export const STORY_WORLDS: StoryWorld[] = [
  {
    id: 'space',
    name: 'Space Station',
    description: 'Travel through the galaxy solving math mysteries aboard a star cruiser',
    imageUrl: '',
    theme: 'galactic',
  },
  {
    id: 'fantasy',
    name: 'Enchanted Kingdom',
    description: 'Help brave knights and wise wizards on magical quests',
    imageUrl: '',
    theme: 'medieval',
  },
  {
    id: 'dinosaur',
    name: 'Dino Valley',
    description: 'Journey back to the age of dinosaurs in a prehistoric adventure',
    imageUrl: '',
    theme: 'prehistoric',
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    description: 'Dive into the sea and explore shipwrecks and coral reefs',
    imageUrl: '',
    theme: 'aquatic',
  },
  {
    id: 'jungle',
    name: 'Jungle Explorer',
    description: 'Trek through a lush jungle teeming with exotic animals and hidden temples',
    imageUrl: '',
    theme: 'tropical',
  },
  {
    id: 'pirates',
    name: 'Pirate Seas',
    description: 'Sail the high seas hunting for treasure with a daring pirate crew',
    imageUrl: '',
    theme: 'nautical',
  },
  {
    id: 'robots',
    name: 'Robot Factory',
    description: 'Explore a futuristic city where robots and gadgets rule the day',
    imageUrl: '',
    theme: 'futuristic',
  },
  {
    id: 'candy',
    name: 'Candy Land',
    description: 'Wander through a delicious world made entirely of sweets and treats',
    imageUrl: '',
    theme: 'whimsical',
  },
  {
    id: 'magic-school',
    name: 'Magic School',
    description: 'Attend a school for young wizards and learn powerful spells',
    imageUrl: '',
    theme: 'enchanted',
  },
  {
    id: 'ancient-temple',
    name: 'Ancient Temple',
    description: 'Uncover the secrets of an ancient civilization hidden deep in the jungle',
    imageUrl: '',
    theme: 'archaeological',
  },
];

export function getStoryWorldById(id: string): StoryWorld | undefined {
  return STORY_WORLDS.find((world) => world.id === id);
}
