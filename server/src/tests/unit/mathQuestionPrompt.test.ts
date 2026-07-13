import { describe, it, expect } from 'vitest';
import { buildMathQuestionPrompt } from '../../services/ai/prompts/mathQuestion';
import type { LLMMathQuestionContext } from '@mathmagic/types';

const baseCtx: LLMMathQuestionContext = {
  childName: 'Alice',
  gradeLevel: 2,
  mathTopic: 'g1_addition',
  storyWorld: 'fantasy',
  storySummary: 'The adventure begins.',
  selectedChoice: 'Follow the glowing trail',
  currentDifficulty: 'easy',
  difficultyDescription: 'Single-digit addition with sums up to 10.',
};

describe('buildMathQuestionPrompt — UNIQUENESS RULES', () => {
  it('includes UNIQUENESS RULES when previousProblemTexts is non-empty', () => {
    const ctx = { ...baseCtx, previousProblemTexts: ['What is 5 + 3?', 'What is 2 + 4?'] };
    const prompt = buildMathQuestionPrompt(ctx);
    expect(prompt).toContain('UNIQUENESS RULES');
    expect(prompt).toContain('What is 5 + 3?');
    expect(prompt).toContain('What is 2 + 4?');
  });

  it('omits UNIQUENESS RULES when previousProblemTexts is an empty array', () => {
    const ctx = { ...baseCtx, previousProblemTexts: [] };
    const prompt = buildMathQuestionPrompt(ctx);
    expect(prompt).not.toContain('UNIQUENESS RULES');
  });

  it('omits UNIQUENESS RULES when previousProblemTexts is undefined', () => {
    const prompt = buildMathQuestionPrompt(baseCtx);
    expect(prompt).not.toContain('UNIQUENESS RULES');
  });

  it('lists each previous problem on its own numbered line', () => {
    const ctx = { ...baseCtx, previousProblemTexts: ['What is 1 + 2?'] };
    const prompt = buildMathQuestionPrompt(ctx);
    expect(prompt).toContain('1. What is 1 + 2?');
  });
});

describe('buildMathQuestionPrompt — MATH EXPRESSION RULES', () => {
  it('includes the block when requireExpression is true', () => {
    const prompt = buildMathQuestionPrompt({ ...baseCtx, requireExpression: true });
    expect(prompt).toContain('MATH EXPRESSION RULES');
    expect(prompt).toContain('mathExpression');
    expect(prompt).toContain('"?"');
  });

  it('omits the block when requireExpression is false', () => {
    const prompt = buildMathQuestionPrompt({ ...baseCtx, requireExpression: false });
    expect(prompt).not.toContain('MATH EXPRESSION RULES');
    expect(prompt).not.toContain('mathExpression');
  });

  it('omits the block when requireExpression is undefined', () => {
    const prompt = buildMathQuestionPrompt(baseCtx);
    expect(prompt).not.toContain('MATH EXPRESSION RULES');
  });
});
