import { describe, it, expect } from 'vitest';
import { mapHintResponse } from '../../services/adventureService';
import type { LLMHintResponse } from '@mathmagic/types';

const llmResponse: LLMHintResponse = {
  hintText: "Great try! Let's break it apart.",
  scaffoldingQuestion: 'What is 5 + 7?',
  encouragement: 'You got it!',
  answerOptions: ['10', '11', '12', '13'],
  correctAnswer: '12',
};

describe('mapHintResponse', () => {
  it('forwards the scaffolding question, options, answer, and encouragement', () => {
    const result = mapHintResponse(llmResponse, 1);

    expect(result).toEqual({
      hintText: "Great try! Let's break it apart.",
      hintLevel: 1,
      subQuestion: 'What is 5 + 7?',
      subQuestionOptions: ['10', '11', '12', '13'],
      subQuestionAnswer: '12',
      encouragement: 'You got it!',
    });
  });
});
