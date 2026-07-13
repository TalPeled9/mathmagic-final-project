import { describe, it, expect, vi, afterEach } from 'vitest';
import { GeminiJsonClient } from '../../services/ai/geminiClient';
import {
  llmService,
  buildMathQuestionSchema,
  normalizeMathExpression,
} from '../../services/ai/llmService';
import type { AdventureState } from '@mathmagic/types';

const baseState: AdventureState = {
  childName: 'Alex',
  gradeLevel: 2,
  mathTopic: 'addition',
  storyWorld: 'space',
  mode: 'story_step',
  currentStepIndex: 0,
  totalSteps: 5,
  selectedChoices: [],
  recentEvents: [],
  conversationTurns: [],
  previousHints: [],
  attemptCount: 0,
  hintLevel: 0,
  hintUsed: false,
  storySummary: '',
  currentDifficulty: 'easy',
  recentPerformanceScores: [],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('normalizeMathExpression', () => {
  it('converts * to × (Gemini sometimes ignores the prompt symbol rules)', () => {
    expect(normalizeMathExpression('3 * 4 = ?')).toBe('3 × 4 = ?');
  });

  it('converts every occurrence, not just the first', () => {
    expect(normalizeMathExpression('2 * 3 * 4 = ?')).toBe('2 × 3 × 4 = ?');
  });

  it('leaves already-correct expressions untouched', () => {
    expect(normalizeMathExpression('3 × 4 = ?')).toBe('3 × 4 = ?');
    expect(normalizeMathExpression('15 − ? = 7')).toBe('15 − ? = 7');
  });
});

describe('llmService math_question expression normalization', () => {
  it('normalizes * to × in mathExpression on the live-response path', async () => {
    vi.spyOn(GeminiJsonClient.prototype, 'generateJson').mockResolvedValue({
      adventureNarrative: 'You see 3 rows of 4 glowing crystals.',
      wizzyDialogue: 'Count them all!',
      problemText: 'How many crystals are there in total?',
      mathExpression: '3 * 4 = ?',
      answerOptions: ['7', '12', '11', '15'],
      correctAnswer: '12',
      imageDescription: 'Crystals in rows.',
    });

    const state: AdventureState = {
      ...baseState,
      mode: 'math_question',
      mathTopic: 'g2_multiplication_intro',
      currentDifficulty: 'easy',
    };
    const result = await llmService.generateMathQuestionFromState(state);

    expect(result.mathExpression).toBe('3 × 4 = ?');
  });
});

describe('llmService provider wiring', () => {
  it('returns a valid response when GeminiProvider succeeds', async () => {
    vi.spyOn(GeminiJsonClient.prototype, 'generateJson').mockResolvedValue({
      adventureNarrative: 'The adventure begins.',
      wizzyDialogue: 'Welcome, explorer!',
      storyChoices: ['Go left', 'Go right', 'Ask Wizzy'],
      imageDescription: 'A magical forest path.',
    });

    const result = await llmService.generateStoryStepFromState(baseState);

    expect(result.wizzyDialogue).toBe('Welcome, explorer!');
    expect(result.storyChoices).toHaveLength(3);
  });

  it('returns a static fallback response when all providers fail', async () => {
    // Gemini fails; OLLAMA_BASE_URL is empty in test env so OllamaProvider is not added.
    // FallbackLLMClient throws → llmService.requestByMode catches and calls fallbackByMode().
    vi.spyOn(GeminiJsonClient.prototype, 'generateJson').mockRejectedValue(
      new Error('rate limited')
    );

    const result = await llmService.generateStoryStepFromState(baseState);

    expect(result).toBeDefined();
    expect(typeof result.wizzyDialogue).toBe('string');
    expect(result.wizzyDialogue.length).toBeGreaterThan(0);
    expect(Array.isArray(result.storyChoices)).toBe(true);
    // The static fallback (and the Gemini schema: minItems/maxItems 2) provides exactly 2 choices
    expect(result.storyChoices).toHaveLength(2);
  });
});

describe('llmService hint fallback', () => {
  it('includes scaffoldingQuestion even at hint level 1', async () => {
    vi.spyOn(GeminiJsonClient.prototype, 'generateJson').mockRejectedValue(
      new Error('rate limited')
    );

    const state: AdventureState = { ...baseState, mode: 'hint', hintLevel: 1 };
    const result = await llmService.generateHintFromState(state);

    expect(typeof result.scaffoldingQuestion).toBe('string');
    expect(result.scaffoldingQuestion.length).toBeGreaterThan(0);
  });
});

describe('buildMathQuestionSchema', () => {
  it('requires mathExpression when requireExpression is true', () => {
    const schema = buildMathQuestionSchema(true);
    expect(schema.properties).toHaveProperty('mathExpression');
    expect(schema.required).toContain('mathExpression');
  });

  it('omits mathExpression entirely when requireExpression is false', () => {
    const schema = buildMathQuestionSchema(false);
    expect(schema.properties).not.toHaveProperty('mathExpression');
    expect(schema.required).not.toContain('mathExpression');
  });
});

describe('llmService math_question fallback', () => {
  it('includes mathExpression in the fallback for a flagged topic+difficulty', async () => {
    vi.spyOn(GeminiJsonClient.prototype, 'generateJson').mockRejectedValue(
      new Error('rate limited')
    );
    const state: AdventureState = {
      ...baseState,
      mode: 'math_question',
      mathTopic: 'g1_addition',
      currentDifficulty: 'easy',
    };
    const result = await llmService.generateMathQuestionFromState(state);
    expect(result.mathExpression).toBe('2 + 3 = ?');
  });

  it('omits mathExpression in the fallback for an unflagged topic', async () => {
    vi.spyOn(GeminiJsonClient.prototype, 'generateJson').mockRejectedValue(
      new Error('rate limited')
    );
    const state: AdventureState = {
      ...baseState,
      mode: 'math_question',
      mathTopic: 'g1_2d_shapes',
      currentDifficulty: 'easy',
    };
    const result = await llmService.generateMathQuestionFromState(state);
    expect(result.mathExpression).toBeUndefined();
  });
});
