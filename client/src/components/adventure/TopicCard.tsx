import type { MathTopicConfig } from '@mathmagic/types';
import { AdventureCard } from './AdventureCard';
import { getTopicImageConfig } from '@/utils/topicImages';

interface TopicCardProps {
  topic: MathTopicConfig;
  isSelected: boolean;
  onClick: () => void;
  animationDelay: number;
}

export function TopicCard({ topic, isSelected, onClick, animationDelay }: TopicCardProps) {
  const { category, fallbackGradient } = getTopicImageConfig(topic.id);
  return (
    <AdventureCard
      id={topic.id}
      name={topic.name}
      description={topic.description}
      imageSrc={`/images/topics/${category}.jpg`}
      fallbackGradient={fallbackGradient}
      isSelected={isSelected}
      onClick={onClick}
      animationDelay={animationDelay}
    />
  );
}
