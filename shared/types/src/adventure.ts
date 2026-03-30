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
  correctAnswer: string;
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
