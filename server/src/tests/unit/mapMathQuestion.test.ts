import { describe, it, expect } from 'vitest';
import { mapMathQuestionResponse } from '../../services/adventureService';

describe('mapMathQuestionResponse — clockTime', () => {
  const base = {
    adventureNarrative: 'n',
    wizzyDialogue: 'w',
    problemText: 'What time does the clock show?',
    answerOptions: ['3:00', '4:00', '2:00', '3:30'],
    correctAnswer: '3:00',
    imageDescription: 'scene',
  };

  it('copies clockTime into the challenge', () => {
    const segment = mapMathQuestionResponse({ ...base, clockTime: '3:00' });
    expect(segment.challenge?.clockTime).toBe('3:00');
  });

  it('leaves clockTime undefined for regular questions', () => {
    const segment = mapMathQuestionResponse(base);
    expect(segment.challenge?.clockTime).toBeUndefined();
  });
});
