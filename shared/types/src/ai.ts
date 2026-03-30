import type { StoryMode } from './adventure';

export interface LLMStoryPromptContext {
  childName: string;
  gradeLevel: number;
  mathTopic: string;
  storyWorld: string;
  storySummary?: string;
  selectedChoice?: string;
}

export interface LLMMathQuestionContext extends LLMStoryPromptContext {
  selectedChoice: string;
  previousEvents?: string[];
}

export interface LLMHintContext extends LLMStoryPromptContext {
  problemText: string;
  childAnswer: string;
  hintLevel: number; // 1,2,3 progression
  previousHints: string[];
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

export interface LLMStartAdventureResponse extends LLMBaseStoryResponse {
  adventureNarrative: string;
  storyChoices: string[];
}

export interface LLMMathQuestionResponse extends LLMBaseStoryResponse {
  problemText: string;
  answerOptions: string[];
  correctAnswer: string;
}

export interface LLMHintResponse {
  hintText: string;
  scaffoldingQuestion?: string;
  encouragement: string;
  answerOptions: string[];
  correctAnswer: string;
}

export interface LLMEndStoryResponse extends LLMBaseStoryResponse {
  recap: string;
  celebration: string;
}

export type LLMModeContextMap = {
  start_adventure: LLMStoryPromptContext;
  math_question: LLMMathQuestionContext;
  hint: LLMHintContext;
  end_story: LLMEndStoryContext;
};

export type LLMModeResponseMap = {
  start_adventure: LLMStartAdventureResponse;
  math_question: LLMMathQuestionResponse;
  hint: LLMHintResponse;
  end_story: LLMEndStoryResponse;
};

export type LLMResponse = LLMModeResponseMap[StoryMode];
