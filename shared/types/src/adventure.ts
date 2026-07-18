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
  previousScaffoldQuestions?: string[]; // hint scaffoldingQuestion texts asked in this adventure

  lastProblemText?: string;
  lastMathExpression?: string;
  correctAnswer?: string;
  lastChildAnswer?: string;
  attemptCount: number;
  hintLevel: 0 | 1 | 2 | 3;
  hintUsed: boolean;
  currentDifficulty: 'easy' | 'medium' | 'hard';
  /** Deterministic per-adventure seed (hash of adventure id) for difficulty-variant rotation. */
  variantSeed?: number;
  recentPerformanceScores: number[];

  storySummary: string;
}

export interface ICurrentChallenge {
  problemText: string;
  mathExpression?: string; // symbolic form (e.g. "3 + 5 = ?") — only for flagged topics
  /** "H:MM" shown on the server-rendered analog clock — only for clock-reading questions. */
  clockTime?: string;
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
  subQuestion?: string; // scaffolded sub-question — absent at level 1 (strategy hint)
  subQuestionOptions?: string[]; // exactly 4 answer options for subQuestion (levels 2–3)
  subQuestionAnswer?: string; // correct option for subQuestion (checked client-side)
  encouragement?: string; // shown when the child answers subQuestion correctly
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
    /** One description, or an array of variants — the server picks one variant per question. */
    easy: string | string[];
    medium: string | string[];
    hard: string | string[];
  };
  /** Difficulties at which a symbolic math expression (e.g. "3 + 5 = ?") must accompany the question. */
  expressionFor?: Array<'easy' | 'medium' | 'hard'>;
  /** Difficulties where a server-rendered analog clock accompanies the question. */
  clockFor?: Partial<
    Record<
      'easy' | 'medium' | 'hard',
      {
        /** Which difficulty variants show the clock ('all', or indices into the difficulty array). */
        variants: 'all' | number[];
        /** Allowed minute values for picked times (subset of 0, 15, 30, 45). */
        minutes: number[];
      }
    >
  >;
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
  mathTopicName: string;
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
  mathTopicName: string;
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
