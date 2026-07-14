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
    const result = mapHintResponse(llmResponse, 2);

    expect(result).toEqual({
      hintText: "Great try! Let's break it apart.",
      hintLevel: 2,
      subQuestion: 'What is 5 + 7?',
      subQuestionOptions: ['10', '11', '12', '13'],
      subQuestionAnswer: '12',
      encouragement: 'You got it!',
    });
  });

  it('maps a strategy-only (level 1) response with quiz fields absent', () => {
    const strategyResponse: LLMHintResponse = {
      hintText: 'Great try! To add big numbers, break them into tens and ones first.',
    };

    const result = mapHintResponse(strategyResponse, 1);

    expect(result).toEqual({
      hintText: 'Great try! To add big numbers, break them into tens and ones first.',
      hintLevel: 1,
    });
    expect(result.subQuestion).toBeUndefined();
    expect(result.subQuestionOptions).toBeUndefined();
    expect(result.subQuestionAnswer).toBeUndefined();
    expect(result.encouragement).toBeUndefined();
  });
});
