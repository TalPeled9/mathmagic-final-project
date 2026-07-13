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
