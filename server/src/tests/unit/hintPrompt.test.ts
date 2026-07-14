import { describe, it, expect } from 'vitest';
import { buildHintPrompt } from '../../services/ai/prompts/hint';
import type { LLMHintContext } from '@mathmagic/types';

const baseCtx: LLMHintContext = {
  childName: 'Alice',
  gradeLevel: 2,
  mathTopic: 'g1_addition',
  storyWorld: 'fantasy',
  currentDifficulty: 'easy',
  difficultyDescription: 'Simple addition within 10.',
  problemText: 'How many keys are there in total?',
  childAnswer: '11',
  hintLevel: 1,
  previousHints: [],
};

describe('buildHintPrompt — math expression', () => {
  it('includes the expression line when mathExpression is present', () => {
    const prompt = buildHintPrompt({ ...baseCtx, mathExpression: '5 + 7 = ?' });
    expect(prompt).toContain('- Math expression: 5 + 7 = ?');
  });

  it('omits the expression line when mathExpression is absent', () => {
    const prompt = buildHintPrompt(baseCtx);
    expect(prompt).not.toContain('Math expression');
  });
});

describe('buildHintPrompt — UNIQUENESS RULES', () => {
  it('includes UNIQUENESS RULES when previousProblemTexts is non-empty', () => {
    const ctx = { ...baseCtx, previousProblemTexts: ['What is 5 + 3?'] };
    const prompt = buildHintPrompt(ctx);
    expect(prompt).toContain('UNIQUENESS RULES');
    expect(prompt).toContain('What is 5 + 3?');
  });

  it('includes UNIQUENESS RULES when previousScaffoldQuestions is non-empty', () => {
    const ctx = { ...baseCtx, previousScaffoldQuestions: ['What is 5 + 7?'] };
    const prompt = buildHintPrompt(ctx);
    expect(prompt).toContain('UNIQUENESS RULES');
    expect(prompt).toContain('What is 5 + 7?');
  });

  it('merges previousProblemTexts and previousScaffoldQuestions into one list', () => {
    const ctx = {
      ...baseCtx,
      previousProblemTexts: ['What is 5 + 3?'],
      previousScaffoldQuestions: ['What is 5 + 7?'],
    };
    const prompt = buildHintPrompt(ctx);
    expect(prompt).toContain('1. What is 5 + 3?');
    expect(prompt).toContain('2. What is 5 + 7?');
  });

  it('omits UNIQUENESS RULES when both lists are empty or undefined', () => {
    const prompt = buildHintPrompt(baseCtx);
    expect(prompt).not.toContain('UNIQUENESS RULES');
  });
});
