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
  it('includes the expression line when mathExpression is present (level 1)', () => {
    const prompt = buildHintPrompt({ ...baseCtx, mathExpression: '5 + 7 = ?' });
    expect(prompt).toContain('- Math expression: 5 + 7 = ?');
  });

  it('includes the expression line when mathExpression is present (level 2)', () => {
    const prompt = buildHintPrompt({ ...baseCtx, hintLevel: 2, mathExpression: '5 + 7 = ?' });
    expect(prompt).toContain('- Math expression: 5 + 7 = ?');
  });

  it('omits the expression line when mathExpression is absent', () => {
    const prompt = buildHintPrompt(baseCtx);
    expect(prompt).not.toContain('Math expression');
  });
});

describe('buildHintPrompt — level 1 (strategy)', () => {
  it('asks for a general strategy and forbids using the specific numbers', () => {
    const prompt = buildHintPrompt(baseCtx);
    expect(prompt).toContain('general strategy');
    expect(prompt).toContain('Do NOT use the specific numbers');
  });

  it('requests only the hintText field — no scaffolding question or options', () => {
    const prompt = buildHintPrompt(baseCtx);
    expect(prompt).toContain('Return exactly one field: hintText');
    expect(prompt).not.toContain('scaffoldingQuestion');
    expect(prompt).not.toContain('answerOptions');
  });
});

describe('buildHintPrompt — levels 2 and 3 (scaffold)', () => {
  it('level 2 asks for the first concrete sub-step with a scaffolding question', () => {
    const prompt = buildHintPrompt({ ...baseCtx, hintLevel: 2 });
    expect(prompt).toContain('HINT LEVEL 2');
    expect(prompt).toContain('FIRST sub-step');
    expect(prompt).toContain('scaffoldingQuestion');
  });

  it('level 3 anchors the question as the next step after hint 2', () => {
    const prompt = buildHintPrompt({
      ...baseCtx,
      hintLevel: 3,
      previousHints: [
        'Great try! Break the number into tens and ones, then add each part.',
        "Let's use our strategy. What is 5 + 7?",
      ],
    });
    expect(prompt).toContain('HINT LEVEL 3');
    expect(prompt).toContain('NEXT step');
    expect(prompt).toContain('DIFFERENT from');
    expect(prompt).toContain('What is 5 + 7?'); // previous hints are visible to the model
  });

  it('level 2 does not include level 3 instructions and vice versa', () => {
    const prompt2 = buildHintPrompt({ ...baseCtx, hintLevel: 2 });
    const prompt3 = buildHintPrompt({ ...baseCtx, hintLevel: 3 });
    expect(prompt2).not.toContain('HINT LEVEL 3');
    expect(prompt3).not.toContain('HINT LEVEL 2 —');
  });
});
