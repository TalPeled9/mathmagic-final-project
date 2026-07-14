import type { StoryMode } from './adventure';

export interface LLMStoryPromptContext {
  childName: string;
  gradeLevel: number;
  mathTopic: string;
  storyWorld: string;
  storySummary?: string;
  conversationTranscript?: string; // formatted turn-by-turn history window
  selectedChoice?: string;
  currentDifficulty?: 'easy' | 'medium' | 'hard';
  difficultyDescription?: string;
}

export interface LLMMathQuestionContext extends LLMStoryPromptContext {
  selectedChoice: string;
  previousProblemTexts?: string[];
  previousScaffoldQuestions?: string[];
  requireExpression?: boolean;
  /** Server-picked "H:MM" for clock-reading questions; injected into the prompt. */
  clockTime?: string;
}

export interface LLMHintContext extends LLMStoryPromptContext {
  problemText: string;
  mathExpression?: string;
  childAnswer: string;
  hintLevel: number; // 1,2,3 progression
  previousHints: string[];
  previousProblemTexts?: string[];
  previousScaffoldQuestions?: string[];
}

export interface LLMEndStoryContext extends LLMStoryPromptContext {
  finalOutcome: string;
  solvedProblems?: number;
  totalProblems?: number;
}

export interface LLMBaseStoryResponse {
  wizzyDialogue: string;
  imageDescription: string;
}

export interface LLMStoryStepResponse extends LLMBaseStoryResponse {
  adventureNarrative: string;
  storyChoices: string[];
}

export interface LLMMathQuestionResponse extends LLMBaseStoryResponse {
  adventureNarrative: string;
  problemText: string;
  mathExpression?: string;
  /** Echoed server-picked time — set by llmService, never by the model. */
  clockTime?: string;
  answerOptions: string[];
  correctAnswer: string;
}

export interface LLMHintResponse {
  hintText: string;
  /** Absent at hint level 1 (strategy-only hint); present at levels 2–3. */
  scaffoldingQuestion?: string;
  encouragement?: string;
  answerOptions?: string[];
  correctAnswer?: string;
}

export interface LLMEndStoryResponse extends LLMBaseStoryResponse {
  recap: string;
  celebration: string;
}

export type LLMModeContextMap = {
  story_step: LLMStoryPromptContext;
  math_question: LLMMathQuestionContext;
  hint: LLMHintContext;
  end_story: LLMEndStoryContext;
};

export type LLMModeResponseMap = {
  story_step: LLMStoryStepResponse;
  math_question: LLMMathQuestionResponse;
  hint: LLMHintResponse;
  end_story: LLMEndStoryResponse;
};

export type LLMResponse = LLMModeResponseMap[StoryMode];
