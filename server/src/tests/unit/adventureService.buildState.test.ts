import { describe, it, expect } from 'vitest';
import { buildAdventureState } from '../../services/adventureService';
import type { IAdventureDocument } from '../../models/Adventure';
import type { IChildDocument } from '../../models/Child';

function makeAdventure(overrides: Partial<IAdventureDocument> = {}): IAdventureDocument {
  return {
    conversationHistory: [],
    currentChallenge: null,
    currentHints: [],
    currentDifficulty: 'easy',
    recentPerformanceScores: [],
    currentStepIndex: 0,
    totalSteps: 6,
    mathTopic: 'g1_addition',
    storyWorld: 'fantasy',
    previousProblemTexts: [],
    lastChoices: [],
    ...overrides,
  } as unknown as IAdventureDocument;
}

function makeChild(overrides: Partial<IChildDocument> = {}): IChildDocument {
  return { name: 'Alice', gradeLevel: 2, ...overrides } as unknown as IChildDocument;
}

describe('buildAdventureState — previousProblemTexts', () => {
  it('includes previousProblemTexts from the adventure document', () => {
    const adventure = makeAdventure({ previousProblemTexts: ['What is 5 + 3?', 'What is 2 + 4?'] });
    const state = buildAdventureState(adventure, makeChild(), 'math_question');
    expect(state.previousProblemTexts).toEqual(['What is 5 + 3?', 'What is 2 + 4?']);
  });

  it('defaults to empty array when previousProblemTexts is absent', () => {
    const adventure = makeAdventure({ previousProblemTexts: undefined as unknown as string[] });
    const state = buildAdventureState(adventure, makeChild(), 'math_question');
    expect(state.previousProblemTexts).toEqual([]);
  });
});
