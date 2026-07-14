import { describe, it, expect, vi, afterEach } from 'vitest';
import { GeminiJsonClient } from '../../services/ai/geminiClient';
import {
  llmService,
  buildMathQuestionSchema,
  normalizeMathExpression,
  normalizeOperatorSymbols,
} from '../../services/ai/llmService';
import type { AdventureState, LLMMathQuestionContext } from '@mathmagic/types';

const clockCtx: LLMMathQuestionContext = {
  childName: 'Alex',
  gradeLevel: 1,
  mathTopic: 'g1_time_clock',
  storyWorld: 'space',
  selectedChoice: 'adventure begins',
  currentDifficulty: 'easy' as const,
};

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
  it('returns a strategy-only fallback at hint level 1', async () => {
    vi.spyOn(GeminiJsonClient.prototype, 'generateJson').mockRejectedValue(
      new Error('rate limited')
    );

    const state: AdventureState = { ...baseState, mode: 'hint', hintLevel: 1 };
    const result = await llmService.generateHintFromState(state);

    expect(typeof result.hintText).toBe('string');
    expect(result.hintText.length).toBeGreaterThan(0);
    expect(result.scaffoldingQuestion).toBeUndefined();
    expect(result.answerOptions).toBeUndefined();
    expect(result.correctAnswer).toBeUndefined();
  });

  it('includes scaffoldingQuestion in the fallback at hint level 2', async () => {
    vi.spyOn(GeminiJsonClient.prototype, 'generateJson').mockRejectedValue(
      new Error('rate limited')
    );

    const state: AdventureState = { ...baseState, mode: 'hint', hintLevel: 2 };
    const result = await llmService.generateHintFromState(state);

    expect(typeof result.scaffoldingQuestion).toBe('string');
    expect(result.scaffoldingQuestion!.length).toBeGreaterThan(0);
    expect(result.answerOptions).toHaveLength(4);
  });
});

describe('llmService hint schema selection', () => {
  it('uses a hintText-only schema at level 1', async () => {
    const spy = vi
      .spyOn(GeminiJsonClient.prototype, 'generateJson')
      .mockResolvedValue({ hintText: 'Break the problem into small steps.' });

    const state: AdventureState = { ...baseState, mode: 'hint', hintLevel: 1 };
    await llmService.generateHintFromState(state);

    const { schema } = spy.mock.calls[0][0] as unknown as { schema: { required: string[] } };
    expect(schema.required).toEqual(['hintText']);
  });

  it('uses the full hint schema at levels 2 and 3', async () => {
    const spy = vi.spyOn(GeminiJsonClient.prototype, 'generateJson').mockResolvedValue({
      hintText: 'So we have 12.',
      scaffoldingQuestion: 'What is 20 + 10?',
      encouragement: 'Nice!',
      answerOptions: ['20', '30', '40', '50'],
      correctAnswer: '30',
    });

    const state: AdventureState = { ...baseState, mode: 'hint', hintLevel: 2 };
    await llmService.generateHintFromState(state);

    const { schema } = spy.mock.calls[0][0] as unknown as { schema: { required: string[] } };
    expect(schema.required).toContain('scaffoldingQuestion');
    expect(schema.required).toContain('answerOptions');
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

describe('buildMathQuestionSchema — requireClock', () => {
  it('drops answerOptions and correctAnswer when requireClock is true', () => {
    const schema = buildMathQuestionSchema(false, true);
    expect(schema.required).not.toContain('answerOptions');
    expect(schema.required).not.toContain('correctAnswer');
    expect(Object.keys(schema.properties as Record<string, unknown>)).not.toContain(
      'answerOptions'
    );
    expect(Object.keys(schema.properties as Record<string, unknown>)).not.toContain(
      'correctAnswer'
    );
  });

  it('keeps them when requireClock is false or omitted', () => {
    expect(buildMathQuestionSchema(false).required).toContain('answerOptions');
    expect(buildMathQuestionSchema(false, false).required).toContain('correctAnswer');
  });
});

describe('llmService clock questions', () => {
  it('attaches server-authored options, correctAnswer, clockTime, and masks leaks', async () => {
    vi.spyOn(GeminiJsonClient.prototype, 'generateJson').mockResolvedValue({
      adventureNarrative: 'The tower clock chimes — it is 7:30 already, whispers the wind.',
      wizzyDialogue: 'Look at the clock — half past seven never looked so magical!',
      problemText: 'What time does the great clock show?',
      imageDescription: 'Child and Wizzy before a tower gate.',
    });

    const response = await llmService.generateMathQuestion({ ...clockCtx, clockTime: '7:30' });

    expect(response.correctAnswer).toBe('7:30');
    expect(response.clockTime).toBe('7:30');
    expect(response.answerOptions).toHaveLength(4);
    expect(response.answerOptions).toContain('7:30');
    expect(response.adventureNarrative).not.toContain('7:30');
    expect(response.adventureNarrative).toContain('_______');
    expect(response.wizzyDialogue.toLowerCase()).not.toContain('half past seven');
  });

  it('uses the server-built clock fallback when all providers fail', async () => {
    vi.spyOn(GeminiJsonClient.prototype, 'generateJson').mockRejectedValue(
      new Error('rate limited')
    );

    const response = await llmService.generateMathQuestion({ ...clockCtx, clockTime: '4:00' });

    expect(response.correctAnswer).toBe('4:00');
    expect(response.clockTime).toBe('4:00');
    expect(response.problemText.toLowerCase()).toContain('what time');
    expect(response.answerOptions).toContain('4:00');
  });
});

describe('normalizeOperatorSymbols', () => {
  it('converts * directly between digits', () => {
    expect(normalizeOperatorSymbols('12*3 = ?')).toBe('12×3 = ?');
  });

  it('converts * with single surrounding spaces', () => {
    expect(normalizeOperatorSymbols('Which expression solves it: (12 + 8) * 3?')).toBe(
      'Which expression solves it: (12 + 8) × 3?'
    );
  });

  it('converts * between a closing and an opening parenthesis', () => {
    expect(normalizeOperatorSymbols('(2 + 3)*(4 - 1)')).toBe('(2 + 3)×(4 - 1)');
  });

  it('converts every operator occurrence', () => {
    expect(normalizeOperatorSymbols('2 * 3 * 4')).toBe('2 × 3 × 4');
  });

  it('leaves prose asterisks untouched', () => {
    expect(normalizeOperatorSymbols('*sparkle* the wand glows')).toBe('*sparkle* the wand glows');
    expect(normalizeOperatorSymbols('wave your wand * three times')).toBe(
      'wave your wand * three times'
    );
  });

  it('is a no-op on clean text and idempotent', () => {
    expect(normalizeOperatorSymbols('7 × 8 = ?')).toBe('7 × 8 = ?');
    const once = normalizeOperatorSymbols('6 * 7');
    expect(normalizeOperatorSymbols(once)).toBe(once);
  });
});

describe('llmService operator-symbol normalization wiring', () => {
  it('normalizes * in problemText, answerOptions, and correctAnswer of math questions', async () => {
    vi.spyOn(GeminiJsonClient.prototype, 'generateJson').mockResolvedValue({
      adventureNarrative: 'A two-step puzzle guards the gate.',
      wizzyDialogue: 'Pick the right expression!',
      problemText: 'Which expression opens the gate: (5 + 3) * 2 coins?',
      answerOptions: ['(5 + 3) * 2', '5 + 3 * 2', '(5 - 3) * 2', '5 * 3 + 2'],
      correctAnswer: '(5 + 3) * 2',
      imageDescription: 'A gate with symbols.',
    });

    const state: AdventureState = {
      ...baseState,
      mode: 'math_question',
      mathTopic: 'g3_order_of_operations',
      currentDifficulty: 'hard',
    };
    const result = await llmService.generateMathQuestionFromState(state);

    expect(result.problemText).toContain('(5 + 3) × 2');
    expect(result.answerOptions).toEqual(['(5 + 3) × 2', '5 + 3 × 2', '(5 - 3) × 2', '5 × 3 + 2']);
    expect(result.correctAnswer).toBe('(5 + 3) × 2');
  });

  it('normalizes * in every hint text field', async () => {
    vi.spyOn(GeminiJsonClient.prototype, 'generateJson').mockResolvedValue({
      hintText: 'Remember, do 3 * 4 first.',
      scaffoldingQuestion: 'What is 3 * 4?',
      encouragement: 'You can do 3 * 4 in your head!',
      answerOptions: ['3 * 4', '3 + 4', '12', '7'],
      correctAnswer: '3 * 4',
    });

    const state: AdventureState = { ...baseState, mode: 'hint', hintLevel: 2 };
    const result = await llmService.generateHintFromState(state);

    expect(result.hintText).toBe('Remember, do 3 × 4 first.');
    expect(result.scaffoldingQuestion).toBe('What is 3 × 4?');
    expect(result.encouragement).toBe('You can do 3 × 4 in your head!');
    expect(result.answerOptions).toEqual(['3 × 4', '3 + 4', '12', '7']);
    expect(result.correctAnswer).toBe('3 × 4');
  });

  it('normalizes * in a level-1 strategy hint without quiz fields', async () => {
    vi.spyOn(GeminiJsonClient.prototype, 'generateJson').mockResolvedValue({
      hintText: 'First multiply, like 3 * 4, then add the rest.',
    });

    const state: AdventureState = { ...baseState, mode: 'hint', hintLevel: 1 };
    const result = await llmService.generateHintFromState(state);

    expect(result.hintText).toBe('First multiply, like 3 × 4, then add the rest.');
    expect(result.scaffoldingQuestion).toBeUndefined();
  });
});
