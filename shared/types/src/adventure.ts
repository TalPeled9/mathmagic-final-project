import type { IBadge } from './children';

export type StoryMode = 'start_adventure' | 'math_question' | 'hint' | 'end_story';

export interface AdventureState {
  childName: string;
  gradeLevel: number;
  mathTopic: string;
  storyWorld: string;

  mode: StoryMode;
  currentStepIndex: number; // 0-based
  totalSteps: number;

  opening?: string;
  currentGoal?: string;

  selectedChoices: string[];
  recentEvents: string[];

  lastProblemText?: string;
  correctAnswer?: string;
  lastChildAnswer?: string;
  attemptCount: number;
  hintUsed: boolean;

  storySummary: string;
}

export interface ICurrentChallenge {
  problemText: string;
  options: [string, string, string, string];
  hintLevel: 0 | 1 | 2 | 3;
  attemptsCount: number;
}

export interface StorySegment {
  narrative: string; // Wizzy's story text
  wizzyDialogue: string; // Wizzy's spoken line
  choices: string[]; // 2–4 options for child to pick
  challenge: ICurrentChallenge | null; // null if this segment is pure story
  imageDescription: string; // description for image generation
  imageUrl?: string; // generated image URL (set by server)
  isLastStep: boolean; // true if this is the final segment
}

export interface StartAdventureResponse {
  adventureId: string;
  segment: StorySegment;
}

export interface ContinueAdventureRequest {
  choiceIndex: number;
}

export interface ContinueAdventureResponse {
  segment: StorySegment;
}

export interface AnswerChallengeRequest {
  answer: string;
}

export interface AnswerChallengeResponse {
  correct: boolean;
  xpEarned?: number; // only if correct
  feedback: string; // "Great job! ✨" or "Almost! Try again"
  correctAnswer?: string; // revealed after 3 failed attempts
}

export interface HintResponse {
  hintText: string; // Wizzy's hint message
  hintLevel: number; // current hint level (0–3)
  subQuestion?: string; // optional scaffolded sub-question
}

export interface CompleteAdventureResponse {
  xpEarned: number;
  starsEarned: number; // 1–3
  newLevel?: number; // if child leveled up
  newBadge?: IBadge; // if a new badge was earned
  totalXP: number; // child's updated total
  totalStars: number;
}

export interface StartAdventureRequest {
  mathTopic: string;
  storyWorld: string;
}

export interface MathTopicConfig {
  id: string;
  name: string;
  icon: string;
  gradeRange: { min: number; max: number };
  description: string;
  color: string;
}

export interface StoryWorldConfig {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  theme: string;
}

export const WORLD_EMOJIS: Record<string, string> = {
  space: '🚀',
  fantasy: '🏰',
  dinosaur: '🦕',
  ocean: '🌊',
  jungle: '🌴',
  pirates: '🏴‍☠️',
  robots: '🤖',
  candy: '🍬',
  'magic-school': '🧙',
  'ancient-temple': '🏛️',
};

export interface GetAvailableResponse {
  topics: MathTopicConfig[];
  worlds: StoryWorldConfig[];
}

export interface AdventureSummary {
  _id: string;
  mathTopic: string;
  storyWorld: string;
  status: 'in-progress' | 'completed';
  currentStepIndex: number;
  totalSteps: number;
  xpEarned: number;
  starsEarned: number;
  startedAt: string;
  completedAt?: string;
}

export interface GetChildAdventuresResponse {
  adventures: AdventureSummary[];
}

export interface GetAdventureResponse {
  adventureId: string;
  status: 'in-progress' | 'completed';
  mathTopic: string;
  storyWorld: string;
  currentStepIndex: number;
  totalSteps: number;
  currentSegment: StorySegment;
  xpEarned: number;
  starsEarned: number;
}
