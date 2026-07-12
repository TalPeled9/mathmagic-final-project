// server/src/tests/unit/storyContextBuilder.test.ts
import { describe, it, expect } from 'vitest';
import {
  buildMathQuestionContext,
  buildStorySummary,
  buildHintContext,
  pickVariant,
  hashStringToSeed,
} from '../../services/ai/storyContextBuilder';
import type { AdventureState } from '@mathmagic/types';

const baseState: AdventureState = {
  childName: 'Alex',
  gradeLevel: 2,
  mathTopic: 'addition',
  storyWorld: 'space',
  mode: 'math_question',
  currentStepIndex: 1,
  totalSteps: 5,
  selectedChoices: ['go left'],
  recentEvents: ['found a glowing chest'],
  conversationTurns: [
    { role: 'wizzy', content: 'A chest appears!', dialogue: 'A chest appears!' },
    { role: 'child', content: 'go left' },
  ],
  previousHints: [],
  attemptCount: 0,
  hintLevel: 0,
  hintUsed: false,
  currentDifficulty: 'easy',
  recentPerformanceScores: [],
  storySummary: '',
  lastProblemText: 'What is 2 + 3?',
  lastChildAnswer: '4',
  correctAnswer: '5',
};

describe('buildMathQuestionContext', () => {
  it('does not include previousEvents', () => {
    const ctx = buildMathQuestionContext(baseState);
    expect('previousEvents' in ctx).toBe(false);
  });

  it('does not include conversationTranscript', () => {
    const ctx = buildMathQuestionContext(baseState);
    expect(ctx.conversationTranscript).toBeUndefined();
  });

  it('includes selectedChoice from last entry in selectedChoices', () => {
    const ctx = buildMathQuestionContext(baseState);
    expect(ctx.selectedChoice).toBe('go left');
  });

  it('defaults selectedChoice to "adventure begins" when selectedChoices is empty', () => {
    const ctx = buildMathQuestionContext({ ...baseState, selectedChoices: [] });
    expect(ctx.selectedChoice).toBe('adventure begins');
  });

  it('includes currentDifficulty from state', () => {
    const ctx = buildMathQuestionContext({ ...baseState, currentDifficulty: 'medium' });
    expect(ctx.currentDifficulty).toBe('medium');
  });

  it('includes difficultyDescription from curriculum config', () => {
    const state = { ...baseState, mathTopic: 'g1_addition', currentDifficulty: 'easy' as const };
    const ctx = buildMathQuestionContext(state);
    expect(typeof ctx.difficultyDescription).toBe('string');
    expect(ctx.difficultyDescription).toBeTruthy();
  });

  it('returns empty string for difficultyDescription when topic is unknown', () => {
    const ctx = buildMathQuestionContext({ ...baseState, mathTopic: 'nonexistent-topic' });
    expect(ctx.difficultyDescription).toBe('');
  });
});

describe('buildStorySummary — hint mode', () => {
  it('does not embed problemText in the summary', () => {
    const summary = buildStorySummary({ ...baseState, mode: 'hint' });
    expect(summary).not.toContain('What is 2 + 3?');
  });

  it('does not embed childAnswer in the summary', () => {
    const summary = buildStorySummary({ ...baseState, mode: 'hint' });
    expect(summary).not.toContain('Child answered');
  });

  it('does not embed attemptCount in the summary', () => {
    const summary = buildStorySummary({ ...baseState, mode: 'hint', attemptCount: 2 });
    expect(summary).not.toContain('Attempt');
  });

  it('still includes recent story events', () => {
    const summary = buildStorySummary({ ...baseState, mode: 'hint' });
    expect(summary).toContain('found a glowing chest');
  });
});

describe('buildHintContext', () => {
  it('includes currentDifficulty from state', () => {
    const ctx = buildHintContext({ ...baseState, currentDifficulty: 'hard' });
    expect(ctx.currentDifficulty).toBe('hard');
  });

  it('includes difficultyDescription from curriculum config', () => {
    const state = { ...baseState, mathTopic: 'g1_addition', currentDifficulty: 'easy' as const };
    const ctx = buildHintContext(state);
    expect(ctx.difficultyDescription).toBeTruthy();
  });
});

describe('buildMathQuestionContext — previousProblemTexts', () => {
  it('passes previousProblemTexts from state into the context', () => {
    const state = {
      ...baseState,
      previousProblemTexts: ['What is 5 + 3?', 'What is 2 + 4?'],
    };
    const ctx = buildMathQuestionContext(state);
    expect(ctx.previousProblemTexts).toEqual(['What is 5 + 3?', 'What is 2 + 4?']);
  });

  it('passes empty array when previousProblemTexts is absent', () => {
    const ctx = buildMathQuestionContext(baseState);
    expect(ctx.previousProblemTexts).toEqual([]);
  });
});

describe('buildMathQuestionContext — requireExpression', () => {
  it('is true when the topic flags the current difficulty', () => {
    const ctx = buildMathQuestionContext({
      ...baseState,
      mathTopic: 'g1_addition',
      currentDifficulty: 'easy',
    });
    expect(ctx.requireExpression).toBe(true);
  });

  it('is false when the topic does not flag the current difficulty', () => {
    const ctx = buildMathQuestionContext({
      ...baseState,
      mathTopic: 'g3_addition_subtraction',
      currentDifficulty: 'hard',
    });
    expect(ctx.requireExpression).toBe(false);
  });

  it('is false for a topic without expressionFor', () => {
    const ctx = buildMathQuestionContext({
      ...baseState,
      mathTopic: 'g1_2d_shapes',
      currentDifficulty: 'easy',
    });
    expect(ctx.requireExpression).toBe(false);
  });

  it('is false for an unknown topic', () => {
    const ctx = buildMathQuestionContext({ ...baseState, mathTopic: 'nonexistent-topic' });
    expect(ctx.requireExpression).toBe(false);
  });
});

describe('buildHintContext — mathExpression', () => {
  it('passes lastMathExpression through', () => {
    const ctx = buildHintContext({ ...baseState, lastMathExpression: '2 + 3 = ?' });
    expect(ctx.mathExpression).toBe('2 + 3 = ?');
  });

  it('is undefined when state has no lastMathExpression', () => {
    const ctx = buildHintContext(baseState);
    expect(ctx.mathExpression).toBeUndefined();
  });
});

describe('pickVariant', () => {
  it('returns a plain string unchanged', () => {
    expect(pickVariant('single description', 7, 3)).toBe('single description');
  });

  it('returns empty string for an empty array', () => {
    expect(pickVariant([], 7, 3)).toBe('');
  });

  it('picks (seed + stepIndex) % length from an array', () => {
    const variants = ['add', 'subtract'];
    expect(pickVariant(variants, 0, 0)).toBe('add');
    expect(pickVariant(variants, 0, 1)).toBe('subtract');
    expect(pickVariant(variants, 0, 2)).toBe('add');
    expect(pickVariant(variants, 1, 0)).toBe('subtract');
  });

  it('is deterministic: same inputs always give the same variant', () => {
    const variants = ['a', 'b', 'c'];
    expect(pickVariant(variants, 42, 5)).toBe(pickVariant(variants, 42, 5));
  });
});

describe('hashStringToSeed', () => {
  it('returns a non-negative integer and is deterministic', () => {
    const seed = hashStringToSeed('507f1f77bcf86cd799439011');
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(hashStringToSeed('507f1f77bcf86cd799439011')).toBe(seed);
  });

  it('gives different seeds for different ids (typical case)', () => {
    expect(hashStringToSeed('adventure-one')).not.toBe(hashStringToSeed('adventure-two'));
  });
});

describe('buildMathQuestionContext / buildHintContext — variant consistency', () => {
  it('resolves the same difficultyDescription for question and hint at the same step', () => {
    // Use any topic id; with a string difficulty this is trivially equal, and once
    // variant arrays land (Tasks 5-10) this guards the question/hint consistency contract.
    const state = { ...baseState, variantSeed: 3, currentStepIndex: 4 };
    const q = buildMathQuestionContext(state);
    const h = buildHintContext(state);
    expect(h.difficultyDescription).toBe(q.difficultyDescription);
  });
});
