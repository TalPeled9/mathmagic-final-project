import type { StoryWorldConfig } from '@mathmagic/types';
import { AdventureCard } from './AdventureCard';

const WORLD_GRADIENTS: Record<string, string> = {
  space: 'linear-gradient(160deg, #bfdbfe 0%, #1e40af 45%, #0c1445 100%)',
  fantasy: 'linear-gradient(160deg, #ddd6fe 0%, #7c3aed 45%, #2e1065 100%)',
  dinosaur: 'linear-gradient(160deg, #fcd34d 0%, #b45309 45%, #3b1500 100%)',
  ocean: 'linear-gradient(160deg, #67e8f9 0%, #0369a1 45%, #012948 100%)',
  jungle: 'linear-gradient(160deg, #86efac 0%, #15803d 45%, #052e16 100%)',
  pirates: 'linear-gradient(160deg, #fde68a 0%, #d97706 45%, #451a03 100%)',
  robots: 'linear-gradient(160deg, #a5b4fc 0%, #4338ca 45%, #1e1b4b 100%)',
  candy: 'linear-gradient(160deg, #fbcfe8 0%, #db2777 45%, #500724 100%)',
  'magic-school': 'linear-gradient(160deg, #fde68a 0%, #7c3aed 45%, #1e0050 100%)',
  'ancient-temple': 'linear-gradient(160deg, #d6d3d1 0%, #78350f 45%, #1c0a00 100%)',
  'icy-caves': 'linear-gradient(160deg, #e0f2fe 0%, #7dd3fc 30%, #0369a1 65%, #0c2a4a 100%)',
  'volcano-island': 'linear-gradient(160deg, #fef08a 0%, #ef4444 35%, #7f1d1d 65%, #1a0400 100%)',
};

const DEFAULT_GRADIENT = 'linear-gradient(160deg, #e2e8f0 0%, #64748b 45%, #0f172a 100%)';

interface WorldCardProps {
  world: StoryWorldConfig;
  isSelected: boolean;
  onClick: () => void;
  animationDelay: number;
}

export function WorldCard({ world, isSelected, onClick, animationDelay }: WorldCardProps) {
  return (
    <AdventureCard
      id={world.id}
      name={world.name}
      description={world.description}
      imageSrc={`/images/worlds/${world.id}.jpg`}
      fallbackGradient={WORLD_GRADIENTS[world.id] ?? DEFAULT_GRADIENT}
      isSelected={isSelected}
      onClick={onClick}
      animationDelay={animationDelay}
    />
  );
}
