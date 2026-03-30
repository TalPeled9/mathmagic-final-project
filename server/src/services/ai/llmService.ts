import type {
  AdventureState,
  LLMEndStoryContext,
  LLMEndStoryResponse,
  LLMHintContext,
  LLMHintResponse,
  LLMMathQuestionContext,
  LLMMathQuestionResponse,
  LLMModeContextMap,
  LLMModeResponseMap,
  LLMStoryPromptContext,
  LLMStartAdventureResponse,
  StoryMode,
} from '@mathmagic/types';
import { config } from '../../config';
import {
  buildEndStoryContext,
  buildHintContext,
  buildMathQuestionContext,
  buildStartAdventureContext,
} from './storyContextBuilder';
import { GeminiJsonClient, type GeminiResponseSchema } from './geminiClient';
import { buildEndStoryPrompt } from './prompts/endStory';
import { buildHintPrompt } from './prompts/hint';
import { buildMathQuestionPrompt } from './prompts/mathQuestion';
import { buildStartAdventurePrompt } from './prompts/startAdventure';
import { systemInstructions } from './prompts/systemInstructions';

const DEFAULT_MODEL = 'gemini-2.5-flash';

const JSON_SCHEMA = {
  OBJECT: 'object',
  ARRAY: 'array',
  STRING: 'string',
} as const;

const startAdventureSchema: GeminiResponseSchema = {
  type: JSON_SCHEMA.OBJECT,
  required: ['adventureNarrative', 'wizzyDialogue', 'storyChoices', 'imageDescription'],
  properties: {
    adventureNarrative: { type: JSON_SCHEMA.STRING },
    wizzyDialogue: { type: JSON_SCHEMA.STRING },
    storyChoices: {
      type: JSON_SCHEMA.ARRAY,
      minItems: 3,
      maxItems: 3,
      items: { type: JSON_SCHEMA.STRING },
    },
    imageDescription: { type: JSON_SCHEMA.STRING },
  },
};

const mathQuestionSchema: GeminiResponseSchema = {
  type: JSON_SCHEMA.OBJECT,
  required: ['wizzyDialogue', 'problemText', 'answerOptions', 'correctAnswer', 'imageDescription'],
  properties: {
    wizzyDialogue: { type: JSON_SCHEMA.STRING },
    problemText: { type: JSON_SCHEMA.STRING },
    answerOptions: {
      type: JSON_SCHEMA.ARRAY,
      minItems: 4,
      maxItems: 4,
      items: { type: JSON_SCHEMA.STRING },
    },
    correctAnswer: { type: JSON_SCHEMA.STRING },
    imageDescription: { type: JSON_SCHEMA.STRING },
  },
};

const hintSchema: GeminiResponseSchema = {
  type: JSON_SCHEMA.OBJECT,
  required: ['hintText', 'encouragement', 'answerOptions', 'correctAnswer'],
  properties: {
    hintText: { type: JSON_SCHEMA.STRING },
    scaffoldingQuestion: { type: JSON_SCHEMA.STRING },
    encouragement: { type: JSON_SCHEMA.STRING },
    answerOptions: {
      type: JSON_SCHEMA.ARRAY,
      minItems: 4,
      maxItems: 4,
      items: { type: JSON_SCHEMA.STRING },
    },
    correctAnswer: { type: JSON_SCHEMA.STRING },
  },
};

const endStorySchema: GeminiResponseSchema = {
  type: JSON_SCHEMA.OBJECT,
  required: ['wizzyDialogue', 'recap', 'celebration', 'imageDescription'],
  properties: {
    wizzyDialogue: { type: JSON_SCHEMA.STRING },
    recap: { type: JSON_SCHEMA.STRING },
    celebration: { type: JSON_SCHEMA.STRING },
    imageDescription: { type: JSON_SCHEMA.STRING },
  },
};

type ModeDefinitionMap = {
  [K in StoryMode]: {
    schema: GeminiResponseSchema;
    buildPrompt: (ctx: LLMModeContextMap[K]) => string;
  };
};

const modeDefinitions: ModeDefinitionMap = {
  start_adventure: {
    schema: startAdventureSchema,
    buildPrompt: buildStartAdventurePrompt,
  },
  math_question: {
    schema: mathQuestionSchema,
    buildPrompt: buildMathQuestionPrompt,
  },
  hint: {
    schema: hintSchema,
    buildPrompt: buildHintPrompt,
  },
  end_story: {
    schema: endStorySchema,
    buildPrompt: buildEndStoryPrompt,
  },
};

class LLMService {
  private readonly client = new GeminiJsonClient(config.gemini.apiKey, systemInstructions);

  // Direct context-based methods (legacy/flexible)
  async generateStartAdventure(ctx: LLMStoryPromptContext): Promise<LLMStartAdventureResponse> {
    return this.requestByMode('start_adventure', ctx);
  }

  async generateMathQuestion(ctx: LLMMathQuestionContext): Promise<LLMMathQuestionResponse> {
    return this.requestByMode('math_question', ctx);
  }

  async generateHint(ctx: LLMHintContext): Promise<LLMHintResponse> {
    return this.requestByMode('hint', ctx);
  }

  async generateEndStory(ctx: LLMEndStoryContext): Promise<LLMEndStoryResponse> {
    const response = await this.requestByMode('end_story', ctx);
    return { ...response, storyChoices: [] };
  }

  // AdventureState-based convenience methods (recommended for controllers)
  async generateStartAdventureFromState(state: AdventureState): Promise<LLMStartAdventureResponse> {
    const ctx = buildStartAdventureContext(state);
    return this.generateStartAdventure(ctx);
  }

  async generateMathQuestionFromState(state: AdventureState): Promise<LLMMathQuestionResponse> {
    const ctx = buildMathQuestionContext(state);
    return this.generateMathQuestion(ctx);
  }

  async generateHintFromState(state: AdventureState): Promise<LLMHintResponse> {
    const ctx = buildHintContext(state);
    return this.generateHint(ctx);
  }

  async generateEndStoryFromState(state: AdventureState): Promise<LLMEndStoryResponse> {
    const ctx = buildEndStoryContext(state);
    return this.generateEndStory(ctx);
  }

  private async requestByMode<K extends StoryMode>(
    mode: K,
    ctx: LLMModeContextMap[K]
  ): Promise<LLMModeResponseMap[K]> {
    const definition = modeDefinitions[mode];

    return this.client.generateJson<LLMModeResponseMap[K]>({
      model: DEFAULT_MODEL,
      schema: definition.schema,
      prompt: definition.buildPrompt(ctx),
      temperature: mode === 'hint' ? 0.4 : 0.8,
      maxOutputTokens: 2048,
    });
  }
}

export const llmService = new LLMService();
