// server/src/tests/unit/storyContextBuilder.test.ts
import { describe, it, expect } from 'vitest';
import {
  buildMathQuestionContext,
  buildStorySummary,
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
