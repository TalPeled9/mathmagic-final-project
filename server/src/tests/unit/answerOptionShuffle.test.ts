import { describe, it, expect } from 'vitest';
import { mapMathQuestionResponse, mapHintResponse } from '../../services/adventureService';
import type { LLMHintResponse } from '@mathmagic/types';

const RUNS = 40;

describe('answer option shuffling', () => {
  it('mapMathQuestionResponse shuffles options so the correct answer is not always first', () => {
    const base = {
      adventureNarrative: 'n',
      wizzyDialogue: 'w',
      problemText: 'What is 2 + 2?',
      answerOptions: ['4', '5', '6', '7'],
      correctAnswer: '4',
      imageDescription: 'scene',
    };

    const positions = new Set<number>();
    for (let i = 0; i < RUNS; i++) {
      const segment = mapMathQuestionResponse(base);
      const options = segment.challenge!.options;
      expect([...options].sort()).toEqual(['4', '5', '6', '7']);
      positions.add(options.indexOf('4'));
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  it('mapHintResponse shuffles sub-question options so the correct answer is not always first', () => {
    const llmResponse: LLMHintResponse = {
      hintText: 'h',
      scaffoldingQuestion: 'What is 5 + 7?',
      encouragement: 'e',
      answerOptions: ['12', '10', '11', '13'],
      correctAnswer: '12',
    };

    const positions = new Set<number>();
    for (let i = 0; i < RUNS; i++) {
      const result = mapHintResponse(llmResponse, 1);
      expect([...result.subQuestionOptions].sort()).toEqual(['10', '11', '12', '13']);
      positions.add(result.subQuestionOptions.indexOf('12'));
    }
    expect(positions.size).toBeGreaterThan(1);
  });
});
