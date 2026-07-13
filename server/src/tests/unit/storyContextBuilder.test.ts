// server/src/tests/unit/storyContextBuilder.test.ts
import { describe, it, expect } from 'vitest';
import {
  buildMathQuestionContext,
  buildStorySummary,
  buildHintContext,
  pickVariant,
  pickVariantIndex,
  pickClockTime,
  hashStringToSeed,
} from '../../services/ai/storyContextBuilder';
import type { AdventureState, MathTopicConfig } from '@mathmagic/types';

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

function makeClockTopic(overrides: Partial<MathTopicConfig> = {}): MathTopicConfig {
  return {
    id: 'test_clock_topic',
    name: 'Test Clock',
    icon: '⏰',
    grade: 1,
    color: '#000',
    description: 'test',
    difficulty: {
      easy: 'Read the clock (whole hours).',
      medium: 'Duration question.',
      hard: ['Read the clock (half hours).', 'Duration with half hours.'],
    },
    clockFor: {
      easy: { variants: 'all', minutes: [0] },
      hard: { variants: [0], minutes: [30] },
    },
    ...overrides,
  };
}

describe('pickVariantIndex', () => {
  it('matches pickVariant selection', () => {
    const variants = ['a', 'b', 'c'];
    for (let step = 0; step < 6; step++) {
      expect(variants[pickVariantIndex(variants.length, 7, step)]).toBe(
        pickVariant(variants, 7, step)
      );
    }
  });
});

describe('pickClockTime', () => {
  it('returns a valid H:MM whole-hour time for a variants:"all" difficulty', () => {
    const time = pickClockTime(makeClockTopic(), 'easy', 3, 4);
    expect(time).toMatch(/^(1[0-2]|[1-9]):00$/);
  });

  it('is deterministic', () => {
    const topic = makeClockTopic();
    expect(pickClockTime(topic, 'easy', 3, 4)).toBe(pickClockTime(topic, 'easy', 3, 4));
  });

  it('varies the hour across steps', () => {
    const topic = makeClockTopic();
    const times = new Set([0, 1, 2, 3].map((s) => pickClockTime(topic, 'easy', 0, s)));
    expect(times.size).toBeGreaterThan(1);
  });

  it('respects the allowed minutes list', () => {
    const time = pickClockTime(makeClockTopic(), 'hard', 0, 0); // seed 0 + step 0 → variant 0
    expect(time).toMatch(/^(1[0-2]|[1-9]):30$/);
  });

  it('returns undefined when the picked variant is not clock-gated', () => {
    // hard variants: [0]; (seed 0 + step 1) % 2 = 1 → duration variant → no clock
    expect(pickClockTime(makeClockTopic(), 'hard', 0, 1)).toBeUndefined();
  });

  it('returns undefined for difficulties without clockFor', () => {
    expect(pickClockTime(makeClockTopic(), 'medium', 0, 0)).toBeUndefined();
  });

  it('returns undefined for undefined topic', () => {
    expect(pickClockTime(undefined, 'easy', 0, 0)).toBeUndefined();
  });
});

describe('buildMathQuestionContext — clockTime', () => {
  it('is undefined for topics without clockFor', () => {
    const ctx = buildMathQuestionContext({ ...baseState, mathTopic: 'g1_addition' });
    expect(ctx.clockTime).toBeUndefined();
  });
});
