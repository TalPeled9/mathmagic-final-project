import type { IBadge } from './children';

export type StoryMode = 'story_step' | 'math_question' | 'hint' | 'end_story';

export interface ConversationTurn {
  role: 'wizzy' | 'child' | 'system';
  content: string;
  dialogue?: string; // Wizzy's spoken line only — excludes adventureNarrative/recap
}

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
  conversationTurns: ConversationTurn[]; // rolling window of last ~10 turns fed to LLM
  previousHints: string[]; // hint texts given for the current challenge
  previousProblemTexts?: string[]; // problem texts asked in this adventure

  lastProblemText?: string;
  correctAnswer?: string;
  lastChildAnswer?: string;
  attemptCount: number;
  hintLevel: 0 | 1 | 2 | 3;
  hintUsed: boolean;
  currentDifficulty: 'easy' | 'medium' | 'hard';
  recentPerformanceScores: number[];

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
  choices: string[]; // exactly 2 story choices
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

export interface XPBreakdown {
  base: number;
  noHintBonus: number;
  streakBonus: number;
}

export interface AnswerChallengeResponse {
  correct: boolean;
  xpEarned?: number; // only if correct
  feedback: string; // "Great job! ✨" or "Almost! Try again"
  correctAnswer?: string; // revealed after 3 failed attempts
  breakdown?: XPBreakdown; // present when correct — useful for XP animation on client
}

export interface HintResponse {
  hintText: string; // Wizzy's hint message
  hintLevel: number; // current hint level (0–3)
  subQuestion: string; // scaffolded sub-question — always present
  subQuestionOptions: string[]; // exactly 4 answer options for subQuestion
  subQuestionAnswer: string; // correct option for subQuestion (checked client-side)
  encouragement: string; // shown when the child answers subQuestion correctly
}

export interface CompleteAdventureResponse {
  xpEarned: number;
  completionXP: number; // XP awarded for finishing (separate from per-challenge XP)
  starsEarned: number; // 1–3
  newLevel?: number; // if child leveled up
  newBadges: IBadge[]; // all badges earned this adventure (may be empty)
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
  grade: number;
  description: string;
  color: string;
  difficulty: {
    easy: string;
    medium: string;
    hard: string;
  };
}

export interface StoryWorldConfig {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  theme: string;
}

// TODO: move to @mathmagic/shared when the types package is split into types + shared-utils
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
  'icy-caves': '🧊',
  'volcano-island': '🌋',
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

export interface ConversationEntry {
  role: 'wizzy' | 'child' | 'system';
  content: string;
  dialogue?: string;
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
  conversationHistory: ConversationEntry[];
  currentChallenge: ICurrentChallenge | null;
  lastChoices: string[];
  stepImages: Record<number, string>;
}

export interface GetAdventureImageResponse {
  imageUrl: string;
}
