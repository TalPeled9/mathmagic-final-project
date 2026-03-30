export interface MathTopic {
  id: string;
  name: string;
  icon: string;
  gradeRange: { min: number; max: number };
  description: string;
  color: string;
}

export const MATH_TOPICS: MathTopic[] = [
  {
    id: 'addition',
    name: 'Addition',
    icon: '➕',
    gradeRange: { min: 1, max: 3 },
    description: 'Learn to add numbers and find sums',
    color: '#4CAF50',
  },
  {
    id: 'subtraction',
    name: 'Subtraction',
    icon: '➖',
    gradeRange: { min: 1, max: 3 },
    description: 'Learn to subtract numbers and find differences',
    color: '#F44336',
  },
  {
    id: 'multiplication',
    name: 'Multiplication',
    icon: '✖️',
    gradeRange: { min: 2, max: 5 },
    description: 'Master times tables and repeated addition',
    color: '#2196F3',
  },
  {
    id: 'division',
    name: 'Division',
    icon: '➗',
    gradeRange: { min: 3, max: 6 },
    description: 'Learn to split numbers into equal groups',
    color: '#FF9800',
  },
  {
    id: 'fractions',
    name: 'Fractions',
    icon: '🍕',
    gradeRange: { min: 3, max: 6 },
    description: 'Understand parts of a whole with fractions',
    color: '#9C27B0',
  },
  {
    id: 'patterns',
    name: 'Patterns',
    icon: '🔢',
    gradeRange: { min: 1, max: 4 },
    description: 'Spot and complete number and shape patterns',
    color: '#00BCD4',
  },
  {
    id: 'time',
    name: 'Time',
    icon: '⏰',
    gradeRange: { min: 1, max: 3 },
    description: 'Read clocks and understand time concepts',
    color: '#607D8B',
  },
  {
    id: 'money',
    name: 'Money',
    icon: '💰',
    gradeRange: { min: 1, max: 4 },
    description: 'Count coins and make change',
    color: '#FFC107',
  },
  {
    id: 'measurement',
    name: 'Measurement',
    icon: '📏',
    gradeRange: { min: 2, max: 5 },
    description: 'Measure length, weight, and volume',
    color: '#795548',
  },
  {
    id: 'shapes',
    name: 'Shapes',
    icon: '🔷',
    gradeRange: { min: 1, max: 5 },
    description: 'Explore 2D and 3D shapes and their properties',
    color: '#E91E63',
  },
];

export function getMathTopicById(id: string): MathTopic | undefined {
  return MATH_TOPICS.find((topic) => topic.id === id);
}
