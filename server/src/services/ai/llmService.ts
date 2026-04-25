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
  LLMStoryStepResponse,
  StoryMode,
} from '@mathmagic/types';
import { config } from '../../config';
import { logger } from '../../lib/logger';
import {
  buildEndStoryContext,
  buildHintContext,
  buildMathQuestionContext,
  buildStoryStepContext,
} from './storyContextBuilder';
import type { GeminiResponseSchema } from './geminiClient';
import { FallbackLLMClient } from './fallbackLLMClient';
import { GeminiProvider } from './providers/geminiProvider';
import { OllamaProvider } from './providers/ollamaProvider';
import type { LLMProvider } from './providers/LLMProvider';
import { sanitizeAndValidateAIResponse } from './contentFilter';
import { buildEndStoryPrompt } from './prompts/endStory';
import { buildHintPrompt } from './prompts/hint';
import { buildMathQuestionPrompt } from './prompts/mathQuestion';
import { buildStoryStepPrompt } from './prompts/storyStep';

const JSON_SCHEMA = {
  OBJECT: 'object',
  ARRAY: 'array',
  STRING: 'string',
} as const;

const storyStepSchema: GeminiResponseSchema = {
  type: JSON_SCHEMA.OBJECT,
  required: ['adventureNarrative', 'wizzyDialogue', 'storyChoices', 'imageDescription'],
  properties: {
    adventureNarrative: { type: JSON_SCHEMA.STRING },
    wizzyDialogue: { type: JSON_SCHEMA.STRING },
    storyChoices: {
      type: JSON_SCHEMA.ARRAY,
      minItems: 2,
      maxItems: 2,
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
  story_step: {
    schema: storyStepSchema,
    buildPrompt: buildStoryStepPrompt,
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

function isUnsafeContentError(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith('Unsafe AI response in ');
}

function fallbackByMode<K extends StoryMode>(
  mode: K,
  ctx: LLMModeContextMap[K]
): LLMModeResponseMap[K] {
  switch (mode) {
    case 'story_step': {
      const response = {
        stepType: 'story_step',
        isLastStep: false,
        narrative: `Wizzy smiles at ${ctx.childName}. The magical path is glowing and ready for a new challenge. A kind breeze sparkles around you as the journey begins.`,
        adventureNarrative: `Wizzy smiles at ${ctx.childName}. The magical path is glowing and ready for a new challenge. A kind breeze sparkles around you as the journey begins.`,
        wizzyDialogue: `Let's continue safely, ${ctx.childName}. Choose your next step!`,
        storyChoices: [
          'Follow the glowing trail',
          'Visit the puzzle gate',
        ],
        imageDescription:
          'A bright and friendly cartoon scene of a child avatar with Wizzy near a glowing magical path.',
      };
      return response as unknown as LLMModeResponseMap[K];
    }

    case 'math_question': {
      const response = {
        stepType: 'math_question',
        isLastStep: false,
        narrative: 'Wizzy draws a quick puzzle in sparkling chalk for a warm-up challenge.',
        wizzyDialogue: `Nice effort, ${ctx.childName}! Let's do a quick one together.`,
        problemText: `What is 2 + 3?`,
        expectedAnswerType: 'number',
        answerFormatHint: 'Choose the number that equals 2 + 3.',
        storyChoices: ['Try the puzzle', 'Ask for a hint'],
        answerOptions: ['4', '5', '6', '7'],
        correctAnswer: '5',
        imageDescription:
          'A cheerful cartoon classroom scene with a child avatar and Wizzy pointing at a simple addition problem.',
      };
      return response as unknown as LLMModeResponseMap[K];
    }

    case 'hint': {
      const hintCtx = ctx as LLMHintContext;
      const response = {
        stepType: 'hint',
        isLastStep: false,
        hintText: `Try breaking the problem into smaller steps and solve one part at a time.`,
        encouragement: `You're doing great, ${ctx.childName}. Keep going!`,
        answerOptions: ['4', '5', '6', '7'],
        correctAnswer: '5',
        ...(hintCtx.hintLevel >= 3
          ? { scaffoldingQuestion: 'What do you get when you add 2 and then 3?' }
          : {}),
      };
      return response as unknown as LLMModeResponseMap[K];
    }

    case 'end_story': {
      const response = {
        stepType: 'end_story',
        isLastStep: true,
        storyChoices: [],
        narrative: `Wizzy and ${ctx.childName} celebrate another magical step completed together.`,
        wizzyDialogue: `Wonderful work today, ${ctx.childName}!`,
        recap: `You explored ${ctx.storyWorld} and practiced ${ctx.mathTopic} with courage and curiosity.`,
        celebration: 'You finished this chapter and earned a big magical high-five!',
        imageDescription:
          'A colorful celebration scene with a child avatar and Wizzy, stars and confetti in a friendly cartoon style.',
      };
      return response as unknown as LLMModeResponseMap[K];
    }

    default: {
      throw new Error(`Unsupported story mode fallback: ${String(mode)}`);
    }
  }
}

class LLMService {
  private readonly client: FallbackLLMClient;

  constructor() {
    const providers: LLMProvider[] = [new GeminiProvider()];
    if (config.ollama.baseUrl) {
      providers.push(new OllamaProvider());
    }
    this.client = new FallbackLLMClient(providers);
  }

  // Direct context-based methods (legacy/flexible)
  async generateStoryStep(ctx: LLMStoryPromptContext): Promise<LLMStoryStepResponse> {
    return this.requestByMode('story_step', ctx);
  }

  async generateMathQuestion(ctx: LLMMathQuestionContext): Promise<LLMMathQuestionResponse> {
    return this.requestByMode('math_question', ctx);
  }

  async generateHint(ctx: LLMHintContext): Promise<LLMHintResponse> {
    return this.requestByMode('hint', ctx);
  }

  async generateEndStory(ctx: LLMEndStoryContext): Promise<LLMEndStoryResponse> {
    return this.requestByMode('end_story', ctx);
  }

  // AdventureState-based convenience methods (recommended for controllers)
  async generateStoryStepFromState(state: AdventureState, strict = false): Promise<LLMStoryStepResponse> {
    const ctx = buildStoryStepContext(state);
    return this.requestByMode('story_step', ctx, strict);
  }

  async generateMathQuestionFromState(state: AdventureState, strict = false): Promise<LLMMathQuestionResponse> {
    const ctx = buildMathQuestionContext(state);
    return this.requestByMode('math_question', ctx, strict);
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
    ctx: LLMModeContextMap[K],
    strict = false
  ): Promise<LLMModeResponseMap[K]> {
    const definition = modeDefinitions[mode];

    let response: LLMModeResponseMap[K];
    try {
      response = await this.client.generateJson<LLMModeResponseMap[K]>({
        schema: definition.schema,
        prompt: definition.buildPrompt(ctx),
        temperature: mode === 'hint' ? 0.4 : 0.8,
        maxOutputTokens: 2048,
      });
    } catch (err) {
      if (strict) throw err; // prefetch path: let caller handle, don't cache fallback
      logger.warn({ err }, `All providers failed for mode=${mode}; using fallback.`);
      return fallbackByMode(mode, ctx);
    }

    try {
      return sanitizeAndValidateAIResponse(response);
    } catch (err) {
      if (isUnsafeContentError(err)) {
        if (strict) throw err;
        logger.warn({ err }, `Unsafe AI response blocked for mode=${mode}; using fallback.`);
        return fallbackByMode(mode, ctx);
      }

      throw err;
    }
  }
}

export const llmService = new LLMService();
