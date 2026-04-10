import { describe, it, expect, vi, afterEach } from 'vitest';
import { GeminiJsonClient } from '../../services/ai/geminiClient';
import { llmService } from '../../services/ai/llmService';
import type { AdventureState } from '@mathmagic/types';

const baseState: AdventureState = {
  childName: 'Alex',
  gradeLevel: 2,
  mathTopic: 'addition',
  storyWorld: 'space',
  mode: 'story_step',
  currentStepIndex: 0,
  totalSteps: 5,
  selectedChoices: [],
  recentEvents: [],
  conversationTurns: [],
  previousHints: [],
  attemptCount: 0,
  hintLevel: 0,
  hintUsed: false,
  storySummary: '',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('llmService provider wiring', () => {
  it('returns a valid response when GeminiProvider succeeds', async () => {
    vi.spyOn(GeminiJsonClient.prototype, 'generateJson').mockResolvedValue({
      adventureNarrative: 'The adventure begins.',
      wizzyDialogue: 'Welcome, explorer!',
      storyChoices: ['Go left', 'Go right', 'Ask Wizzy'],
      imageDescription: 'A magical forest path.',
    });

    const result = await llmService.generateStoryStepFromState(baseState);

    expect(result.wizzyDialogue).toBe('Welcome, explorer!');
    expect(result.storyChoices).toHaveLength(3);
  });

  it('returns a static fallback response when all providers fail', async () => {
    // Gemini fails; OLLAMA_BASE_URL is empty in test env so OllamaProvider is not added.
    // FallbackLLMClient throws → llmService.requestByMode catches and calls fallbackByMode().
    vi.spyOn(GeminiJsonClient.prototype, 'generateJson').mockRejectedValue(
      new Error('rate limited')
    );

    const result = await llmService.generateStoryStepFromState(baseState);

    expect(result).toBeDefined();
    expect(typeof result.wizzyDialogue).toBe('string');
    expect(result.wizzyDialogue.length).toBeGreaterThan(0);
    expect(Array.isArray(result.storyChoices)).toBe(true);
    expect(result.storyChoices).toHaveLength(3);
  });
});
