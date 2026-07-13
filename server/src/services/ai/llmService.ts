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
import {
  buildClockFallbackResponse,
  generateClockOptions,
  maskClockTimeLeaks,
} from './clockQuestion';
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
  required: [
    'adventureNarrative',
    'wizzyDialogue',
    'problemText',
    'answerOptions',
    'correctAnswer',
    'imageDescription',
  ],
  properties: {
    adventureNarrative: { type: JSON_SCHEMA.STRING },
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

export function buildMathQuestionSchema(
  requireExpression: boolean,
  requireClock = false
): GeminiResponseSchema {
  let schema = mathQuestionSchema;
  if (requireClock) {
    const required = ((schema.required as string[] | undefined) ?? []).filter(
      (field) => field !== 'answerOptions' && field !== 'correctAnswer'
    );
    const properties = { ...((schema.properties as Record<string, unknown> | undefined) ?? {}) };
    delete properties.answerOptions;
    delete properties.correctAnswer;
    schema = { ...schema, required, properties };
  }
  if (!requireExpression) return schema;
  const required = (schema.required as string[] | undefined) ?? [];
  const properties = (schema.properties as Record<string, unknown> | undefined) ?? {};
  return {
    ...schema,
    required: [...required, 'mathExpression'],
    properties: {
      ...properties,
      mathExpression: { type: JSON_SCHEMA.STRING },
    },
  };
}

/**
 * Gemini occasionally uses "*" for multiplication despite the prompt's
 * symbol rules — normalize to the kid-friendly "×" before the expression
 * is cached, persisted, or rendered.
 */
export function normalizeMathExpression(expression: string): string {
  return expression.replace(/\*/g, '×');
}

/**
 * Gemini occasionally writes "*" for multiplication in prose, options,
 * and hints too. Replace it with "×" only in operator position — between
 * digits/closing paren and digits/opening paren, allowing one space on
 * each side — so decorative asterisks in story text are never touched.
 */
export function normalizeOperatorSymbols(text: string): string {
  return text.replace(/(?<=[\d)])( ?)\*( ?)(?=[\d(])/g, '$1×$2');
}

const hintSchema: GeminiResponseSchema = {
  type: JSON_SCHEMA.OBJECT,
  required: ['hintText', 'scaffoldingQuestion', 'encouragement', 'answerOptions', 'correctAnswer'],
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
        storyChoices: ['Follow the glowing trail', 'Visit the puzzle gate'],
        imageDescription:
          'A bright and friendly cartoon scene of a child avatar with Wizzy near a glowing magical path.',
      };
      return response as unknown as LLMModeResponseMap[K];
    }

    case 'math_question': {
      const clockTime = (ctx as LLMMathQuestionContext).clockTime;
      if (clockTime) {
        return buildClockFallbackResponse(
          ctx.childName,
          clockTime
        ) as unknown as LLMModeResponseMap[K];
      }
      const requireExpression = Boolean((ctx as LLMMathQuestionContext).requireExpression);
      const response = {
        adventureNarrative: `As ${ctx.childName} continues the journey, Wizzy points to a glowing puzzle stone on the path. "There are 2 bright stars on one side and 3 on the other — we need to count them all to unlock the way forward!" Wizzy exclaims.`,
        wizzyDialogue: `You've got this, ${ctx.childName}! Let's solve it together.`,
        problemText: `What is 2 + 3?`,
        ...(requireExpression ? { mathExpression: '2 + 3 = ?' } : {}),
        answerOptions: ['4', '5', '6', '7'],
        correctAnswer: '5',
        imageDescription:
          'A cheerful cartoon scene with a child avatar and Wizzy pointing at a glowing stone with stars on both sides.',
      };
      return response as unknown as LLMModeResponseMap[K];
    }

    case 'hint': {
      const response = {
        stepType: 'hint',
        isLastStep: false,
        hintText: `Try breaking the problem into smaller steps and solve one part at a time.`,
        scaffoldingQuestion: 'What do you get when you add 2 and then 3?',
        encouragement: `You're doing great, ${ctx.childName}. Keep going!`,
        answerOptions: ['4', '5', '6', '7'],
        correctAnswer: '5',
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
  async generateStoryStepFromState(
    state: AdventureState,
    strict = false
  ): Promise<LLMStoryStepResponse> {
    const ctx = buildStoryStepContext(state);
    return this.requestByMode('story_step', ctx, strict);
  }

  async generateMathQuestionFromState(
    state: AdventureState,
    strict = false
  ): Promise<LLMMathQuestionResponse> {
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
    const difficulty = (ctx as { currentDifficulty?: string }).currentDifficulty;
    const prompt = definition.buildPrompt(ctx);

    // DEV LOGS — remove before production
    console.log(`\n${'='.repeat(60)}`);
    console.log(
      `[LLM] mode=${mode}${difficulty ? `  difficulty=${difficulty.toUpperCase()}` : ''}`
    );
    console.log(`[LLM] topic=${ctx.mathTopic}  child=${ctx.childName}  grade=${ctx.gradeLevel}`);
    console.log(`[LLM] PROMPT:\n${prompt}`);
    console.log('='.repeat(60));

    const schema =
      mode === 'math_question'
        ? buildMathQuestionSchema(
            Boolean((ctx as LLMMathQuestionContext).requireExpression),
            Boolean((ctx as LLMMathQuestionContext).clockTime)
          )
        : definition.schema;

    let response: LLMModeResponseMap[K];
    try {
      response = await this.client.generateJson<LLMModeResponseMap[K]>({
        schema,
        prompt,
        temperature: mode === 'hint' ? 0.4 : 0.8,
        maxOutputTokens: 2048,
      });
    } catch (err) {
      if (strict) throw err; // prefetch path: let caller handle, don't cache fallback
      logger.warn({ err }, `All providers failed for mode=${mode}; using fallback.`);
      return fallbackByMode(mode, ctx);
    }

    // DEV LOG — remove before production
    console.log(`[LLM] RESPONSE (mode=${mode}):\n${JSON.stringify(response, null, 2)}\n`);

    try {
      const sanitized = sanitizeAndValidateAIResponse(response);
      if (mode === 'math_question') {
        const mathResponse = sanitized as LLMMathQuestionResponse;
        if (mathResponse.mathExpression) {
          mathResponse.mathExpression = normalizeMathExpression(mathResponse.mathExpression);
        }
        mathResponse.problemText = normalizeOperatorSymbols(mathResponse.problemText);
        if (mathResponse.answerOptions) {
          mathResponse.answerOptions = mathResponse.answerOptions.map(normalizeOperatorSymbols);
        }
        if (mathResponse.correctAnswer) {
          mathResponse.correctAnswer = normalizeOperatorSymbols(mathResponse.correctAnswer);
        }

        const clockTime = (ctx as LLMMathQuestionContext).clockTime;
        if (clockTime) {
          mathResponse.adventureNarrative = maskClockTimeLeaks(
            mathResponse.adventureNarrative,
            clockTime
          );
          mathResponse.problemText = maskClockTimeLeaks(mathResponse.problemText, clockTime);
          mathResponse.wizzyDialogue = maskClockTimeLeaks(mathResponse.wizzyDialogue, clockTime);
          mathResponse.answerOptions = generateClockOptions(clockTime);
          mathResponse.correctAnswer = clockTime;
          mathResponse.clockTime = clockTime;
        }
      } else if (mode === 'hint') {
        const hintResponse = sanitized as LLMHintResponse;
        hintResponse.hintText = normalizeOperatorSymbols(hintResponse.hintText);
        hintResponse.scaffoldingQuestion = normalizeOperatorSymbols(
          hintResponse.scaffoldingQuestion
        );
        hintResponse.encouragement = normalizeOperatorSymbols(hintResponse.encouragement);
        hintResponse.answerOptions = hintResponse.answerOptions.map(normalizeOperatorSymbols);
        hintResponse.correctAnswer = normalizeOperatorSymbols(hintResponse.correctAnswer);
      }
      return sanitized;
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
